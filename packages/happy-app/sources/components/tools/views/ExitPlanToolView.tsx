import * as React from 'react';
import { ToolViewProps } from "./_all";
import { ToolSectionView } from '../../tools/ToolSectionView';
import { MarkdownView } from '@/components/markdown/MarkdownView';
import { knownTools } from '../../tools/knownTools';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

interface AllowedPrompt {
    tool: string;
    prompt: string;
}

export const ExitPlanToolView = React.memo<ToolViewProps>(({ tool }) => {
    let plan = '<empty>';
    let allowedPrompts: AllowedPrompt[] | undefined;
    let remoteSessionUrl: string | undefined;
    let remoteSessionTitle: string | undefined;

    const parsed = knownTools.ExitPlanMode.input.safeParse(tool.input);
    if (parsed.success) {
        plan = parsed.data.plan ?? '<empty>';
        allowedPrompts = parsed.data.allowedPrompts;
        remoteSessionUrl = parsed.data.remoteSessionUrl;
        remoteSessionTitle = parsed.data.remoteSessionTitle;
    }

    return (
        <ToolSectionView>
            <View style={{ paddingHorizontal: 8, marginTop: -10 }}>
                <MarkdownView markdown={plan} />
            </View>
            {allowedPrompts && allowedPrompts.length > 0 && (
                <View style={promptStyles.container}>
                    <Text style={promptStyles.heading}>Requested permissions:</Text>
                    {allowedPrompts.map((p, i) => (
                        <View key={i} style={promptStyles.item}>
                            <Ionicons name="terminal-outline" size={14} color={promptStyles.icon.color} />
                            <Text style={promptStyles.text}>
                                <Text style={promptStyles.toolName}>{p.tool}</Text>
                                {' \u2014 '}
                                {p.prompt}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
            {remoteSessionUrl && (
                <View style={promptStyles.remoteContainer}>
                    <Ionicons name="link-outline" size={14} color={promptStyles.icon.color} />
                    <Text style={promptStyles.remoteText}>
                        {remoteSessionTitle || 'Remote session'}: {remoteSessionUrl}
                    </Text>
                </View>
            )}
        </ToolSectionView>
    );
});

const promptStyles = StyleSheet.create((theme) => ({
    container: {
        paddingHorizontal: 8,
        marginTop: 8,
        gap: 4,
    },
    heading: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        paddingVertical: 2,
    },
    icon: {
        color: theme.colors.textSecondary,
    },
    text: {
        fontSize: 13,
        color: theme.colors.text,
        flex: 1,
    },
    toolName: {
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    remoteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        marginTop: 8,
    },
    remoteText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        flex: 1,
    },
}));
