import * as React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ToolViewProps } from './_all';
import { ToolSectionView } from '../../tools/ToolSectionView';
import { t } from '@/text';

interface TaskItem {
    id: string;
    subject: string;
    status: 'pending' | 'in_progress' | 'completed';
    owner?: string;
    blockedBy?: string[];
    description?: string;
    activeForm?: string;
}

function getStatusIcon(status: string): string {
    switch (status) {
        case 'completed': return '\u2611';
        case 'in_progress': return '\u25B6';
        case 'pending': return '\u2610';
        case 'deleted': return '\u2715';
        default: return '\u2610';
    }
}

/**
 * Extracts a task list from various result formats.
 * Claude Code may return tasks as a top-level array or nested under a `tasks` key.
 */
function extractTasks(result: any): TaskItem[] | null {
    if (!result) return null;
    if (Array.isArray(result)) return result;
    if (result.tasks && Array.isArray(result.tasks)) return result.tasks;
    // Single task result (from TaskGet/TaskCreate)
    if (typeof result.id === 'string' && typeof result.subject === 'string') {
        return [result];
    }
    return null;
}

const TaskListContent = React.memo<{ tasks: TaskItem[] }>(({ tasks }) => {
    return (
        <View style={taskStyles.container}>
            {tasks.map((task, index) => {
                const icon = getStatusIcon(task.status);
                const isCompleted = task.status === 'completed';
                const isInProgress = task.status === 'in_progress';
                const isBlocked = task.blockedBy && task.blockedBy.length > 0;

                return (
                    <View key={task.id || `task-${index}`} style={taskStyles.taskItem}>
                        <Text style={[
                            taskStyles.taskText,
                            isCompleted && taskStyles.completedText,
                            isInProgress && taskStyles.inProgressText,
                            isBlocked && !isCompleted && taskStyles.blockedText,
                        ]}>
                            {icon} {task.subject}
                        </Text>
                        {task.owner && (
                            <Text style={taskStyles.metaText}>
                                {t('tools.taskTools.owner', { name: task.owner })}
                            </Text>
                        )}
                        {isBlocked && !isCompleted && (
                            <Text style={taskStyles.metaText}>
                                {t('tools.taskTools.blockedBy', { ids: task.blockedBy!.join(', ') })}
                            </Text>
                        )}
                    </View>
                );
            })}
        </View>
    );
});

export const TaskToolView = React.memo<ToolViewProps>(({ tool }) => {
    const toolName = tool.name;

    // TaskList - show the full task list from result
    if (toolName === 'TaskList') {
        const tasks = extractTasks(tool.result);
        if (tasks && tasks.length > 0) {
            return (
                <ToolSectionView>
                    <TaskListContent tasks={tasks} />
                </ToolSectionView>
            );
        }
        return null;
    }

    // TaskGet - show single task details from result
    if (toolName === 'TaskGet') {
        const tasks = extractTasks(tool.result);
        if (tasks && tasks.length > 0) {
            const task = tasks[0];
            return (
                <ToolSectionView>
                    <View style={taskStyles.container}>
                        <Text style={[
                            taskStyles.taskText,
                            task.status === 'completed' && taskStyles.completedText,
                            task.status === 'in_progress' && taskStyles.inProgressText,
                        ]}>
                            {getStatusIcon(task.status)} {task.subject}
                        </Text>
                        {task.description && (
                            <Text style={taskStyles.descriptionText} numberOfLines={3}>
                                {task.description}
                            </Text>
                        )}
                        {task.owner && (
                            <Text style={taskStyles.metaText}>
                                {t('tools.taskTools.owner', { name: task.owner })}
                            </Text>
                        )}
                    </View>
                </ToolSectionView>
            );
        }
        return null;
    }

    // TaskCreate - show the created task from input
    if (toolName === 'TaskCreate') {
        const subject = tool.input?.subject;
        if (typeof subject === 'string') {
            return (
                <ToolSectionView>
                    <View style={taskStyles.container}>
                        <Text style={taskStyles.taskText}>
                            {getStatusIcon('pending')} {subject}
                        </Text>
                    </View>
                </ToolSectionView>
            );
        }
        return null;
    }

    // TaskUpdate - show the update summary
    if (toolName === 'TaskUpdate') {
        const taskId = tool.input?.taskId;
        const status = tool.input?.status;
        const subject = tool.input?.subject;
        if (taskId) {
            return (
                <ToolSectionView>
                    <View style={taskStyles.container}>
                        <Text style={[
                            taskStyles.taskText,
                            status === 'completed' && taskStyles.completedText,
                            status === 'in_progress' && taskStyles.inProgressText,
                        ]}>
                            {status ? getStatusIcon(status) : '\u270E'} {subject || `#${taskId}`}
                            {status ? ` \u2192 ${status}` : ''}
                        </Text>
                    </View>
                </ToolSectionView>
            );
        }
        return null;
    }

    return null;
});

const taskStyles = StyleSheet.create((theme) => ({
    container: {
        gap: 4,
    },
    taskItem: {
        paddingVertical: 2,
    },
    taskText: {
        fontSize: 14,
        color: theme.colors.text,
        flex: 1,
    },
    completedText: {
        color: '#34C759',
        textDecorationLine: 'line-through',
    },
    inProgressText: {
        color: '#007AFF',
    },
    blockedText: {
        color: '#FF9500',
    },
    metaText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginLeft: 20,
        marginTop: 1,
    },
    descriptionText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginLeft: 20,
        marginTop: 2,
    },
}));
