import axios from 'axios';
import { decodeBase64, encodeBase64 } from '../encryption/base64';
import { getServerUrl } from '@/sync/serverConfig';
import { QRAuthKeyPair } from './authQRStart';
import { decryptBox } from '@/encryption/libsodium';

export interface AuthCredentials {
    secret: Uint8Array;
    token: string;
}

export async function authQRWait(keypair: QRAuthKeyPair, onProgress?: (dots: number) => void, shouldCancel?: () => boolean): Promise<AuthCredentials | null> {
    let dots = 0;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 5;
    const serverUrl = getServerUrl();

    while (true) {
        if (shouldCancel && shouldCancel()) {
            return null;
        }

        try {
            const response = await axios.post(`${serverUrl}/v1/auth/account/request`, {
                publicKey: encodeBase64(keypair.publicKey),
            });

            // Reset failure counter on successful response
            consecutiveFailures = 0;

            if (response.data.state === 'authorized') {
                const token = response.data.token as string;
                const encryptedResponse = decodeBase64(response.data.response);

                const decrypted = decryptBox(encryptedResponse, keypair.secretKey);
                if (decrypted) {
                    console.log('\n\n✓ Authentication successful\n');
                    return {
                        secret: decrypted,
                        token: token
                    };
                } else {
                    console.log('\n\nFailed to decrypt response. Please try again.');
                    return null;
                }
            }
        } catch (error) {
            consecutiveFailures++;
            if (consecutiveFailures >= maxConsecutiveFailures) {
                console.log('\n\nFailed to check authentication status after multiple retries. Please try again.');
                return null;
            }
            // Exponential backoff: 1s, 2s, 4s, 8s (capped)
            const backoffMs = Math.min(1000 * Math.pow(2, consecutiveFailures - 1), 8000);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue;
        }

        // Call progress callback if provided
        if (onProgress) {
            onProgress(dots);
        }
        dots++;

        // Wait 1 second before next check
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}