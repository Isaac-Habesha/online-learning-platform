import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import Button from '../common/Button';
import { useToast } from '../../contexts/ToastContext';
import quizService from '../../services/quizService';

export const QuizTaker = ({ quizId, onComplete, onCancel }) => {
  const toast = useToast();
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showReview, setShowReview] = useState(false);

  // Fetch quiz and start attempt
  useEffect(() => {
    const initQuiz = async () => {
      try {
        setLoading(true);
        const quizData = await quizService.getQuiz(quizId);
        setQuiz(quizData);

        const attemptData = await quizService.startAttempt(quizId);
        setAttempt(attemptData);

        // Initialize time limit
        if (quizData.time_limit_minutes > 0) {
          setTimeRemaining(quizData.time_limit_minutes * 60);
        }
      } catch (err) {
        const msg = err.response?.data?.detail || 'Failed to start quiz';
        toast.error(msg, 'Error');
        onCancel();
      } finally {
        setLoading(false);
      }
    };

    initQuiz();
  }, [quizId]);

  // Timer countdown
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          handleSubmit();
          return 0;
        }
        if (newTime === 60) {
          toast.warning('1 minute remaining!', 'Time Warning');
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const isAnswered = answers[currentQuestion?.id] !== undefined;

  const handleSelectOption = (optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const answersData = quiz.questions.map((q) => ({
      question_id: q.id,
      selected_option_id: answers[q.id] || null,
    }));

    setSubmitting(true);
    try {
      const result = await quizService.submitAttempt(quizId, answersData);
      toast.success('Quiz submitted!', 'Complete');
      onComplete(result);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit quiz';
      toast.error(msg, 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border b-2 border-sky-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-300">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !currentQuestion) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <p className="text-slate-300">Quiz not found</p>
      </div>
    );
  }

  const progressPercent = ((Object.keys(answers).length) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">{quiz.title}</h1>
        <p className="text-slate-400 text-sm">{quiz.description}</p>

        <div className="mt-6 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">PROGRESS</span>
            <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-300">{answeredCount}/{quiz.questions.length}</span>
          </div>

          {timeRemaining && (
            <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
              <Clock className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-mono font-bold text-sky-300">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </h2>
            <span className="text-sm font-bold text-emerald-400">
              +{currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-lg text-slate-100 leading-relaxed">{currentQuestion.prompt}</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                answers[currentQuestion.id] === option.id
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                value={option.id}
                checked={answers[currentQuestion.id] === option.id}
                onChange={() => handleSelectOption(option.id)}
                className="w-5 h-5 cursor-pointer accent-sky-500"
              />
              <span className="text-slate-200 text-lg">{option.text}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {quiz.questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                idx === currentQuestionIndex
                  ? 'bg-sky-500 text-white'
                  : answers[q.id] !== undefined
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700/50'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <Button
            variant="primary"
            onClick={handleNext}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        )}
      </div>

      {/* Review Toggle */}
      <div className="text-center">
        <button
          onClick={() => setShowReview(!showReview)}
          className="text-sm text-sky-400 hover:text-sky-300 underline"
        >
          {showReview ? 'Hide' : 'Show'} all questions overview
        </button>
      </div>

      {showReview && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 space-y-2">
          <h3 className="font-bold text-slate-200 mb-4">Question Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {quiz.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentQuestionIndex(idx);
                  setShowReview(false);
                }}
                className={`p-3 rounded text-xs font-semibold transition-all ${
                  answers[q.id] !== undefined
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}
              >
                Q{idx + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTaker;
