import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Home,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import Button from '../common/Button';
import quizService from '../../services/quizService';

export const QuizResults = ({ attempt, quiz, onRetake, onBack }) => {
  const [expandedAnswer, setExpandedAnswer] = useState(null);

  if (!attempt || !quiz) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <p className="text-slate-300">Results not available</p>
      </div>
    );
  }

  const { score, passed, answers } = attempt;
  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  const earnedPoints = answers.reduce((sum, answer) => sum + (answer.is_correct ? answer.question.points : 0), 0);

  const getScoreLetter = (percent) => {
    if (percent >= 90) return 'A';
    if (percent >= 80) return 'B';
    if (percent >= 70) return 'C';
    if (percent >= 60) return 'D';
    return 'F';
  };

  const scoreLetter = getScoreLetter(score);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Result Summary Card */}
      <div
        className={`rounded-2xl border-2 p-8 text-center space-y-6 ${
          passed
            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30'
            : 'bg-gradient-to-br from-rose-500/10 to-orange-500/10 border-rose-500/30'
        }`}
      >
        <div className="space-y-4">
          {passed ? (
            <>
              <Trophy className="w-16 h-16 mx-auto text-emerald-400 animate-bounce" />
              <h1 className="text-4xl font-black text-emerald-300">Congratulations!</h1>
              <p className="text-lg text-emerald-200">You passed the quiz</p>
            </>
          ) : (
            <>
              <AlertCircle className="w-16 h-16 mx-auto text-rose-400" />
              <h1 className="text-4xl font-black text-rose-300">Keep Learning</h1>
              <p className="text-lg text-rose-200">You didn't pass this time. Try again!</p>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700/30">
          {/* Score */}
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Score</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-black text-white">{score.toFixed(1)}</span>
              <span className="text-xl text-slate-400">%</span>
            </div>
          </div>

          {/* Grade */}
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Grade</p>
            <div className="text-4xl font-black text-sky-400">{scoreLetter}</div>
          </div>

          {/* Points */}
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Points</p>
            <div className="text-2xl font-bold">
              <span className="text-emerald-400">{earnedPoints}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">{totalPoints}</span>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Status</p>
            <p
              className={`text-lg font-bold ${
                passed ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {passed ? 'PASSED' : 'FAILED'}
            </p>
          </div>
        </div>

        {!passed && (
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <p className="text-sm text-slate-300">
              You need <span className="font-bold text-sky-300">{quiz.passing_score}%</span> to pass. Keep practicing!
            </p>
          </div>
        )}
      </div>

      {/* Answer Review */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-sky-400" />
          Answer Review
        </h2>

        <div className="space-y-3">
          {answers.map((answer, idx) => (
            <div
              key={idx}
              className={`rounded-lg border-2 overflow-hidden transition-all ${
                answer.is_correct
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-rose-500/30 bg-rose-500/5'
              }`}
            >
              {/* Question Header */}
              <button
                onClick={() =>
                  setExpandedAnswer(expandedAnswer === idx ? null : idx)
                }
                className={`w-full p-4 flex items-center justify-between hover:bg-black/10 transition-colors ${
                  expandedAnswer === idx ? 'bg-black/20' : ''
                }`}
              >
                <div className="flex items-start gap-4 text-left flex-1">
                  <div className="flex-shrink-0">
                    {answer.is_correct ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 mb-1">
                      Q{idx + 1}: {answer.question.prompt}
                    </p>
                    <p className="text-xs text-slate-400">
                      {answer.is_correct ? 'Correct ✓' : 'Incorrect ✗'} • {' '}
                      <span className={answer.is_correct ? 'text-emerald-400' : 'text-rose-400'}>
                        {answer.question.points} point{answer.question.points !== 1 ? 's' : ''}
                      </span>
                    </p>
                  </div>
                </div>
              </button>

              {/* Answer Details */}
              {expandedAnswer === idx && (
                <div className="border-t border-slate-700/30 p-4 space-y-4 bg-black/20">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2">
                      YOUR ANSWER
                    </p>
                    {answer.selected_option ? (
                      <p
                        className={`p-3 rounded text-sm font-medium ${
                          answer.is_correct
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
                        }`}
                      >
                        {answer.selected_option.text}
                      </p>
                    ) : (
                      <p className="p-3 rounded text-sm text-slate-400 bg-slate-800/30 border border-slate-700/30">
                        No answer selected
                      </p>
                    )}
                  </div>

                  {!answer.is_correct && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-2">
                        CORRECT ANSWER
                      </p>
                      <p className="p-3 rounded text-sm font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                        {answer.correct_option_id
                          ? answer.question.options.find(
                              (o) => o.id === answer.correct_option_id
                            )?.text
                          : 'N/A'}
                      </p>
                    </div>
                  )}

                  {answer.explanation && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-2">
                        EXPLANATION
                      </p>
                      <p className="text-sm text-slate-300 bg-slate-800/30 rounded p-3 border border-slate-700/30 leading-relaxed">
                        {answer.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t border-slate-700">
        <Button
          onClick={onBack}
          variant="secondary"
          size="lg"
          className="flex-1"
          leftIcon={<Home className="w-4 h-4" />}
        >
          Back to Course
        </Button>
        {!passed && (
          <Button
            onClick={onRetake}
            variant="primary"
            size="lg"
            className="flex-1"
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Retake Quiz
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizResults;
