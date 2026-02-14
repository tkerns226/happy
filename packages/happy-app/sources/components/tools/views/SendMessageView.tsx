import * as React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ToolViewProps } from './_all';
import { ToolSectionView } from '../../tools/ToolSectionView';
import { t } from '@/text';

export const SendMessageView = React.memo<ToolViewProps>(({ tool }) => {
    const type = tool.input?.type;
    const recipient = tool.input?.recipient;
    const content = tool.input?.content;
    const summary = tool.input?.summary;

    if (!content && !summary) return null;

    const displayText = content || summary;
    const isShutdown = type === 'shutdown_request';
    const isBroadcast = type === 'broadcast';

    return (
        <ToolSectionView>
            <View style={msgStyles.container}>
                {recipient && (
                    <Text style={msgStyles.recipientText}>
                        {isShutdown
                            ? t('tools.teamTools.shutdownRequest', { name: recipient })
                            : isBroadcast
                                ? t('tools.teamTools.broadcast')
                                : t('tools.teamTools.messageTo', { name: recipient })
                        }
                    </Text>
                )}
                {displayText && (
                    <Text style={msgStyles.contentText} numberOfLines={6}>
                        {displayText}
                    </Text>
                )}
            </View>
        </ToolSectionView>
    );
});

const msgStyles = StyleSheet.create((theme) => ({
    container: {
        gap: 4,
    },
    recipientText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    contentText: {
        fontSize: 14,
        color: theme.colors.text,
    },
}));
