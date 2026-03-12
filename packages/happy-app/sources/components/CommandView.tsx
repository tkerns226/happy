import * as React from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';

interface CommandViewProps {
    command: string;
    prompt?: string;
    stdout?: string | null;
    stderr?: string | null;
    error?: string | null;
    // Legacy prop for backward compatibility
    output?: string | null;
    maxHeight?: number;
    fullWidth?: boolean;
    hideEmptyOutput?: boolean;
}

export const CommandView = React.memo<CommandViewProps>(({
    command,
    prompt = '$',
    stdout,
    stderr,
    error,
    output,
    maxHeight,
    fullWidth,
    hideEmptyOutput,
}) => {
    // Use legacy output if new props aren't provided
    const hasNewProps = stdout !== undefined || stderr !== undefined || error !== undefined;

    return (
        <View style={[
            styles.container,
            maxHeight ? { maxHeight } : undefined,
            fullWidth ? { width: '100%' } : undefined
        ]}>
            {/* Command Line */}
            <View style={styles.line}>
                <Text style={styles.promptText}>{prompt} </Text>
                <Text style={styles.commandText}>{command}</Text>
            </View>

            {hasNewProps ? (
                <>
                    {/* Standard Output */}
                    {stdout && stdout.trim() && (
                        <Text style={styles.stdout}>{stdout}</Text>
                    )}

                    {/* Standard Error */}
                    {stderr && stderr.trim() && (
                        <Text style={styles.stderr}>{stderr}</Text>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Text style={styles.error}>{error}</Text>
                    )}

                    {/* Empty output indicator */}
                    {!stdout && !stderr && !error && !hideEmptyOutput && (
                        <Text style={styles.emptyOutput}>[Command completed with no output]</Text>
                    )}
                </>
            ) : (
                /* Legacy output format */
                output && (
                    <Text style={styles.commandText}>{'\n---\n' + output}</Text>
                )
            )}
        </View>
    );
});

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.colors.terminal.background,
        borderRadius: 8,
        overflow: 'hidden',
        padding: 16,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    line: {
        alignItems: 'baseline',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    promptText: {
        ...Typography.mono(),
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.terminal.prompt,
        fontWeight: '600',
    },
    commandText: {
        ...Typography.mono(),
        fontSize: 14,
        color: theme.colors.terminal.command,
        lineHeight: 20,
        flex: 1,
    },
    stdout: {
        ...Typography.mono(),
        fontSize: 13,
        color: theme.colors.terminal.stdout,
        lineHeight: 18,
        marginTop: 8,
    },
    stderr: {
        ...Typography.mono(),
        fontSize: 13,
        color: theme.colors.terminal.stderr,
        lineHeight: 18,
        marginTop: 8,
    },
    error: {
        ...Typography.mono(),
        fontSize: 13,
        color: theme.colors.terminal.error,
        lineHeight: 18,
        marginTop: 8,
    },
    emptyOutput: {
        ...Typography.mono(),
        fontSize: 13,
        color: theme.colors.terminal.emptyOutput,
        lineHeight: 18,
        marginTop: 8,
        fontStyle: 'italic',
    },
}));
