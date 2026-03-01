import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = resolve(__dirname, '..', 'scripts', 'claude_remote_launcher.cjs');
const CLAUDE_CLI = 'C:/Users/Tim/AppData/Roaming/npm/node_modules/@anthropic-ai/claude-code/cli.js';

test.describe('remote-control CLAUDECODE env var fix', () => {

    test('claude_remote_launcher.cjs strips CLAUDECODE before importing cli.js', async () => {
        // Spawn the launcher with CLAUDECODE=1, just asking for --version
        // Before the fix: "Error: Claude Code cannot be launched inside another Claude Code session."
        // After the fix: prints version and exits cleanly
        const result = await runProcess('node', [CLI_PATH, '--version'], {
            CLAUDECODE: '1',
        });

        expect(result.exitCode).toBe(0);
        expect(result.combined).toContain('Claude Code');
        expect(result.combined).not.toContain('cannot be launched');
        expect(result.combined).not.toContain('Nested sessions');
    });

    test('native binary remote-control connects without --sdk-url error', async () => {
        const nativeBinary = resolve(
            process.env.USERPROFILE || process.env.HOME || '',
            '.claude', 'bin', 'claude.exe'
        );

        // Start remote-control, let it connect, then kill after a few seconds
        const result = await runProcess(nativeBinary, ['remote-control'], {
            CLAUDECODE: '',  // Clear to avoid nested session check
        }, 8000);

        // Should connect successfully, not fail with --sdk-url error
        expect(result.combined).not.toContain('bad option');
        expect(result.combined).not.toContain('--sdk-url');
        expect(result.combined).toContain('Connected');
    });
});

function runProcess(
    cmd: string,
    args: string[],
    extraEnv: Record<string, string>,
    timeoutMs = 10000,
    shell = false,
): Promise<{ exitCode: number; stdout: string; stderr: string; combined: string }> {
    return new Promise((resolve) => {
        const env = { ...process.env, ...extraEnv };

        const child = spawn(cmd, args, {
            env,
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
            shell,
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (d) => { stdout += d.toString(); });
        child.stderr.on('data', (d) => { stderr += d.toString(); });

        const timer = setTimeout(() => {
            child.kill('SIGTERM');
        }, timeoutMs);

        child.on('close', (code) => {
            clearTimeout(timer);
            resolve({
                exitCode: code ?? 1,
                stdout,
                stderr,
                combined: stdout + stderr,
            });
        });

        child.on('error', () => {
            clearTimeout(timer);
            resolve({
                exitCode: 1,
                stdout,
                stderr,
                combined: stdout + stderr,
            });
        });
    });
}
