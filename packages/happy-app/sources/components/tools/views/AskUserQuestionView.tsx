import * as React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ToolViewProps } from './_all';
import { ToolSectionView } from '../ToolSectionView';
import { sessionAllow } from '@/sync/ops';
import { t } from '@/text';
import { Ionicons } from '@expo/vector-icons';

interface QuestionOption {
    label: string;
    description: string;
}

interface Question {
    question: string;
    header: string;
    options: QuestionOption[];
    multiSelect: boolean;
}

interface AskUserQuestionInput {
    questions: Question[];
}

// "Other" option uses a sentinel index: question.options.length
const OTHER_SENTINEL = -1;

// Styles MUST be defined outside the component to prevent infinite re-renders
// with react-native-unistyles. The theme is passed as a function parameter.
const styles = StyleSheet.create((theme) => ({
    container: {
        gap: 16,
    },
    questionSection: {
        gap: 8,
    },
    headerChip: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.surfaceHighest,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 4,
    },
    headerText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
    },
    questionText: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: 8,
    },
    optionsContainer: {
        gap: 4,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.divider,
        gap: 10,
        minHeight: 44, // Minimum touch target for mobile
    },
    optionButtonSelected: {
        backgroundColor: theme.colors.surfaceHigh,
        borderColor: theme.colors.radio.active,
    },
    optionButtonDisabled: {
        opacity: 0.6,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: theme.colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    radioOuterSelected: {
        borderColor: theme.colors.radio.active,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.radio.dot,
    },
    checkboxOuter: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: theme.colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxOuterSelected: {
        borderColor: theme.colors.radio.active,
        backgroundColor: theme.colors.radio.active,
    },
    optionContent: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text,
    },
    optionDescription: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    otherTextInput: {
        marginTop: 8,
        marginLeft: 30,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: theme.colors.text,
        backgroundColor: theme.colors.surfaceHigh,
        minHeight: 40,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        justifyContent: 'flex-end',
    },
    submitButton: {
        backgroundColor: theme.colors.button.primary.background,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 44, // Minimum touch target for mobile
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: theme.colors.button.primary.tint,
        fontSize: 14,
        fontWeight: '600',
    },
    submittedContainer: {
        gap: 8,
    },
    submittedItem: {
        flexDirection: 'row',
        gap: 8,
    },
    submittedHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    submittedValue: {
        fontSize: 13,
        color: theme.colors.text,
        flex: 1,
    },
}));

export const AskUserQuestionView = React.memo<ToolViewProps>(({ tool, sessionId }) => {
    const { theme } = useUnistyles();
    const [selections, setSelections] = React.useState<Map<number, Set<number>>>(new Map());
    const [otherTexts, setOtherTexts] = React.useState<Map<number, string>>(new Map());
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSubmitted, setIsSubmitted] = React.useState(false);

    // Parse input
    const input = tool.input as AskUserQuestionInput | undefined;
    const questions = input?.questions;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return null;
    }

    const isRunning = tool.state === 'running';
    const canInteract = isRunning && !isSubmitted;

    // Check if all questions have at least one selection, and if "Other" is selected, text must be non-empty
    const allQuestionsAnswered = questions.every((_, qIndex) => {
        const selected = selections.get(qIndex);
        if (!selected || selected.size === 0) return false;
        if (selected.has(OTHER_SENTINEL)) {
            const text = otherTexts.get(qIndex) || '';
            return text.trim().length > 0;
        }
        return true;
    });

    const handleOptionToggle = React.useCallback((questionIndex: number, optionIndex: number, multiSelect: boolean) => {
        if (!canInteract) return;

        setSelections(prev => {
            const newMap = new Map(prev);
            const currentSet = newMap.get(questionIndex) || new Set();

            if (multiSelect) {
                // Toggle for multi-select
                const newSet = new Set(currentSet);
                if (newSet.has(optionIndex)) {
                    newSet.delete(optionIndex);
                } else {
                    newSet.add(optionIndex);
                }
                newMap.set(questionIndex, newSet);
            } else {
                // Replace for single-select
                newMap.set(questionIndex, new Set([optionIndex]));
            }

            return newMap;
        });
    }, [canInteract]);

    const handleOtherTextChange = React.useCallback((questionIndex: number, text: string) => {
        setOtherTexts(prev => {
            const newMap = new Map(prev);
            newMap.set(questionIndex, text);
            return newMap;
        });
    }, []);

    // Build structured answers: { [header]: selectedLabel }
    const buildAnswers = React.useCallback((): Record<string, string> => {
        const answers: Record<string, string> = {};
        questions.forEach((q, qIndex) => {
            const selected = selections.get(qIndex);
            if (selected && selected.size > 0) {
                if (selected.has(OTHER_SENTINEL)) {
                    // "Other" free-text answer
                    answers[q.header] = otherTexts.get(qIndex)?.trim() || '';
                } else {
                    const selectedLabels = Array.from(selected)
                        .map(optIndex => q.options[optIndex]?.label)
                        .filter(Boolean)
                        .join(', ');
                    answers[q.header] = selectedLabels;
                }
            }
        });
        return answers;
    }, [questions, selections, otherTexts]);

    const handleSubmit = React.useCallback(async () => {
        if (!sessionId || !allQuestionsAnswered || isSubmitting || !tool.permission?.id) return;

        setIsSubmitting(true);
        setIsSubmitted(true);

        const answers = buildAnswers();

        try {
            // Single RPC call: approve permission with structured answer data
            await sessionAllow(sessionId, tool.permission.id, undefined, undefined, undefined, answers);
        } catch (error) {
            console.error('Failed to submit answer:', error);
            setIsSubmitted(false);
        } finally {
            setIsSubmitting(false);
        }
    }, [sessionId, allQuestionsAnswered, isSubmitting, tool.permission?.id, buildAnswers]);

    // Bug 4 fix: Read completed answers from tool.result for persisted state
    if (isSubmitted || tool.state === 'completed') {
        // Try to read answers from tool.result (persisted across reload)
        const resultAnswers = (tool.result as Record<string, unknown>)?.answers as Record<string, string> | undefined;

        return (
            <ToolSectionView>
                <View style={styles.submittedContainer}>
                    {questions.map((q, qIndex) => {
                        // Prefer tool.result answers over ephemeral local state
                        let displayValue: string;
                        if (resultAnswers && resultAnswers[q.header]) {
                            displayValue = resultAnswers[q.header];
                        } else {
                            const selected = selections.get(qIndex);
                            if (selected && selected.size > 0) {
                                if (selected.has(OTHER_SENTINEL)) {
                                    displayValue = otherTexts.get(qIndex)?.trim() || '-';
                                } else {
                                    displayValue = Array.from(selected)
                                        .map(optIndex => q.options[optIndex]?.label)
                                        .filter(Boolean)
                                        .join(', ') || '-';
                                }
                            } else {
                                displayValue = '-';
                            }
                        }
                        return (
                            <View key={qIndex} style={styles.submittedItem}>
                                <Text style={styles.submittedHeader}>{q.header}:</Text>
                                <Text style={styles.submittedValue}>{displayValue}</Text>
                            </View>
                        );
                    })}
                </View>
            </ToolSectionView>
        );
    }

    return (
        <ToolSectionView>
            <View style={styles.container}>
                {questions.map((question, qIndex) => {
                    const selectedOptions = selections.get(qIndex) || new Set();
                    const isOtherSelected = selectedOptions.has(OTHER_SENTINEL);

                    return (
                        <View key={qIndex} style={styles.questionSection}>
                            <View style={styles.headerChip}>
                                <Text style={styles.headerText}>{question.header}</Text>
                            </View>
                            <Text style={styles.questionText}>{question.question}</Text>
                            <View style={styles.optionsContainer}>
                                {question.options.map((option, oIndex) => {
                                    const isSelected = selectedOptions.has(oIndex);

                                    return (
                                        <TouchableOpacity
                                            key={oIndex}
                                            style={[
                                                styles.optionButton,
                                                isSelected && styles.optionButtonSelected,
                                                !canInteract && styles.optionButtonDisabled,
                                            ]}
                                            onPress={() => handleOptionToggle(qIndex, oIndex, question.multiSelect)}
                                            disabled={!canInteract}
                                            activeOpacity={0.7}
                                        >
                                            {question.multiSelect ? (
                                                <View style={[
                                                    styles.checkboxOuter,
                                                    isSelected && styles.checkboxOuterSelected,
                                                ]}>
                                                    {isSelected && (
                                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                                    )}
                                                </View>
                                            ) : (
                                                <View style={[
                                                    styles.radioOuter,
                                                    isSelected && styles.radioOuterSelected,
                                                ]}>
                                                    {isSelected && <View style={styles.radioInner} />}
                                                </View>
                                            )}
                                            <View style={styles.optionContent}>
                                                <Text style={styles.optionLabel}>{option.label}</Text>
                                                {option.description && (
                                                    <Text style={styles.optionDescription}>{option.description}</Text>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}

                                {/* "Other" free-text option */}
                                <TouchableOpacity
                                    style={[
                                        styles.optionButton,
                                        isOtherSelected && styles.optionButtonSelected,
                                        !canInteract && styles.optionButtonDisabled,
                                    ]}
                                    onPress={() => handleOptionToggle(qIndex, OTHER_SENTINEL, question.multiSelect)}
                                    disabled={!canInteract}
                                    activeOpacity={0.7}
                                >
                                    {question.multiSelect ? (
                                        <View style={[
                                            styles.checkboxOuter,
                                            isOtherSelected && styles.checkboxOuterSelected,
                                        ]}>
                                            {isOtherSelected && (
                                                <Ionicons name="checkmark" size={14} color="#fff" />
                                            )}
                                        </View>
                                    ) : (
                                        <View style={[
                                            styles.radioOuter,
                                            isOtherSelected && styles.radioOuterSelected,
                                        ]}>
                                            {isOtherSelected && <View style={styles.radioInner} />}
                                        </View>
                                    )}
                                    <View style={styles.optionContent}>
                                        <Text style={styles.optionLabel}>{t('tools.askUserQuestion.other')}</Text>
                                        <Text style={styles.optionDescription}>{t('tools.askUserQuestion.otherDescription')}</Text>
                                    </View>
                                </TouchableOpacity>
                                {isOtherSelected && (
                                    <TextInput
                                        style={styles.otherTextInput}
                                        placeholder={t('tools.askUserQuestion.otherPlaceholder')}
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={otherTexts.get(qIndex) || ''}
                                        onChangeText={(text) => handleOtherTextChange(qIndex, text)}
                                        editable={canInteract}
                                        multiline
                                    />
                                )}
                            </View>
                        </View>
                    );
                })}

                {canInteract && (
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!allQuestionsAnswered || isSubmitting) && styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={!allQuestionsAnswered || isSubmitting}
                            activeOpacity={0.7}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color={theme.colors.button.primary.tint} />
                            ) : (
                                <Text style={styles.submitButtonText}>{t('tools.askUserQuestion.submit')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ToolSectionView>
    );
});
