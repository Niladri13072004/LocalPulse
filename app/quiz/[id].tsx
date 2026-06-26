import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useQuizStore } from '../../store/useQuizStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { quizzes, completeQuiz } = useQuizStore();
  const { user } = useAuthStore();

  const quiz = quizzes[id as string];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  if (!quiz) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Quiz not found.</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];

  const handleSelectOption = (idx: number) => {
    if (selectedOpt !== null) return; // Prevent double selection
    setSelectedOpt(idx);
    if (idx === currentQuestion.correctIndex) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
    } else {
      // Quiz finished!
      completeQuiz(id as string);
      setQuizFinished(true);
    }
  };

  const formattedXPVal = quiz.questions.reduce((sum, q) => sum + q.xpValue, 0);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Civic Academy Quiz</Text>
        {!quizFinished && (
          <Text style={styles.progressText}>
            Q: {currentIdx + 1} / {quiz.questions.length}
          </Text>
        )}
      </View>

      {!quizFinished ? (
        <View style={styles.quizBox}>
          {/* Question Text */}
          <Text style={styles.questionText}>{currentQuestion.questionText}</Text>

          {/* Options */}
          <View style={styles.optionsList}>
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedOpt === idx;
              const isCorrect = idx === currentQuestion.correctIndex;
              const isWrong = isSelected && !isCorrect;

              let btnStyle: StyleProp<ViewStyle> = styles.optBtn;
              let txtStyle: StyleProp<TextStyle> = styles.optBtnText;

              if (selectedOpt !== null) {
                if (isCorrect) {
                  btnStyle = [styles.optBtn, styles.correctBtn];
                  txtStyle = [styles.optBtnText, styles.correctBtnText];
                } else if (isWrong) {
                  btnStyle = [styles.optBtn, styles.wrongBtn];
                  txtStyle = [styles.optBtnText, styles.wrongBtnText];
                }
              }

              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={idx}
                  onPress={() => handleSelectOption(idx)}
                  disabled={selectedOpt !== null}
                  style={btnStyle}
                >
                  <Text style={txtStyle}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation / Next Controls */}
          {selectedOpt !== null && (
            <View style={styles.feedbackContainer}>
              <Text style={selectedOpt === currentQuestion.correctIndex ? styles.feedCorrectText : styles.feedWrongText}>
                {selectedOpt === currentQuestion.correctIndex ? '🎉 Correct Answer!' : '❌ Incorrect.'}
              </Text>
              
              <TouchableOpacity accessibilityRole="button" onPress={handleNext} style={styles.nextBtn}>
                <Text style={styles.nextText}>
                  {currentIdx === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question ➔'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.scoreBox}>
          <Text style={styles.scoreIcon}>🏆</Text>
          <Text style={styles.scoreTitle}>Quiz Completed!</Text>
          <Text style={styles.scoreText}>
            You scored {score} out of {quiz.questions.length} correct answers.
          </Text>
          
          <View style={styles.rewardsPanel}>
            <Text style={styles.rewardTitle}>REWARDS EARNED</Text>
            <Text style={styles.rewardVal}>✨ +30 XP</Text>
            
            {score === quiz.questions.length && (
              <Text style={styles.bonusText}>🔥 Perfect Score Badge Unlocked!</Text>
            )}
          </View>

          <TouchableOpacity 
            accessibilityRole="button"
            onPress={() => router.replace('/(citizen)/learn')} 
            style={styles.closeBtn}
          >
            <Text style={styles.closeText}>Close Academy</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 12,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  progressText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  quizBox: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsList: {
    gap: 12,
  },
  optBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  optBtnText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  correctBtn: {
    backgroundColor: '#10B98120',
    borderColor: '#10B981',
  },
  correctBtnText: {
    color: '#10B981',
    fontWeight: '700',
  },
  wrongBtn: {
    backgroundColor: '#EF444420',
    borderColor: '#EF4444',
  },
  wrongBtnText: {
    color: '#EF4444',
    fontWeight: '700',
  },
  feedbackContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  feedCorrectText: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '800',
  },
  feedWrongText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '800',
  },
  nextBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  scoreBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scoreIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  scoreTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  scoreText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  rewardsPanel: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
    gap: 6,
  },
  rewardTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  rewardVal: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900',
    marginVertical: 4,
  },
  bonusText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: '#0284C7',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
