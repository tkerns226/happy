import { z } from "zod";
import { type Fastify } from "../types";
import { log } from "@/utils/log";

export function voiceRoutes(app: Fastify) {
    app.post('/v1/voice/token', {
        preHandler: app.authenticate,
        schema: {
            body: z.object({
                agentId: z.string()
            }),
            response: {
                200: z.object({
                    allowed: z.boolean(),
                    token: z.string().optional(),
                    agentId: z.string().optional()
                }),
                400: z.object({
                    allowed: z.boolean(),
                    error: z.string()
                }),
                500: z.object({
                    allowed: z.boolean(),
                    error: z.string()
                })
            }
        }
    }, async (request, reply) => {
        const userId = request.userId; // CUID from JWT
        const { agentId } = request.body;

        log({ module: 'voice' }, `Voice token request from user ${userId}`);

        const isDevelopment = process.env.NODE_ENV === 'development' || process.env.ENV === 'dev';

        // Check subscription in production
        if (!isDevelopment) {
            const revenueCatPublicKey = process.env.REVENUECAT_PUBLIC_KEY;
            if (!revenueCatPublicKey) {
                log({ module: 'voice' }, 'Missing REVENUECAT_PUBLIC_KEY environment variable');
                return reply.code(500).send({
                    allowed: false,
                    error: 'Server misconfiguration: missing REVENUECAT_PUBLIC_KEY'
                });
            }

            const response = await fetch(
                `https://api.revenuecat.com/v1/subscribers/${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${revenueCatPublicKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                log({ module: 'voice' }, `RevenueCat check failed for user ${userId}: ${response.status}`);
                return reply.send({ 
                    allowed: false,
                    agentId
                });
            }

            const data = await response.json() as any;
            const proEntitlement = data.subscriber?.entitlements?.active?.pro;
            
            if (!proEntitlement) {
                log({ module: 'voice' }, `User ${userId} does not have active subscription`);
                return reply.send({ 
                    allowed: false,
                    agentId
                });
            }
        }

        // Check if 11Labs API key is configured
        const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
        if (!elevenLabsApiKey) {
            log({ module: 'voice' }, 'Missing 11Labs API key');
            return reply.code(400).send({ allowed: false, error: 'Missing 11Labs API key on the server' });
        }

        // Get 11Labs conversation token
        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
            {
                method: 'GET',
                headers: {
                    'xi-api-key': elevenLabsApiKey,
                    'Accept': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            log({ module: 'voice' }, `Failed to get 11Labs token for user ${userId}`);
            return reply.code(400).send({ 
                allowed: false,
                error: `Failed to get 11Labs token for user ${userId}`
            });
        }

        const data = await response.json() as any;
        const token = data.token;

        log({ module: 'voice' }, `Voice token issued for user ${userId}`);
        return reply.send({
            allowed: true,
            token,
            agentId
        });
    });
}
