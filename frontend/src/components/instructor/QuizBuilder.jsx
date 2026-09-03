import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';

export const QuizBuilder = ({ 
  quizForm, 
  setQuizForm, 
  onSubmit, 
  onCancel,
  sections = [],
  editing = false,
  onSelectExistingQuiz = null,
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  // Initialize questions array if not present
  if (!quizForm.questions) {
    quizForm.questions = [];
  }

  const addQuestion = () => {
    const newQuestion = {
      prompt: '',
      question_type: 'MCQ',
      points: 1,
      order: quizForm.questions.length + 1,
      explanation: '',
      options: [
        { text: '', order: 1, is_correct: false },
        { text: '', order: 2, is_correct: false },
      ],
    };
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setExpandedQuestion(quizForm.questions.length);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...quizForm.questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuizForm(prev => ({ ...prev, questions: updated }));
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    const updated = [...quizForm.questions];
    updated[questionIndex].options[optionIndex] = {
      ...updated[questionIndex].options[optionIndex],
      [field]: value
    };
    setQuizForm(prev => ({ ...prev, questions: updated }));
  };

  const addOption = (questionIndex) => {
    const updated = [...quizForm.questions];
    const newOrder = Math.max(...updated[questionIndex].options.map(o => o.order), 0) + 1;
    updated[questionIndex].options.push({
      text: '',
      order: newOrder,
      is_correct: false
    });
    setQuizForm(prev => ({ ...prev, questions: updated }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    if (quizForm.questions[questionIndex].options.length <= 2) {
      alert('Question must have at least 2 options');
      return;
    }
    const updated = [...quizForm.questions];
    updated[questionIndex].options.splice(optionIndex, 1);
    setQuizForm(prev => ({ ...prev, questions: updated }));
  };

  const removeQuestion = (index) => {
    const updated = quizForm.questions.filter((_, i) => i !== index);
    setQuizForm(prev => ({ ...prev, questions: updated }));
    setExpandedQuestion(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    if (!quizForm.lesson) {
      alert('Please select a lesson');
      return;
    }
    if (!quizForm.title.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    if (quizForm.questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    // Validate each question
    for (let i = 0; i < quizForm.questions.length; i++) {
      const q = quizForm.questions[i];
      if (!q.prompt.trim()) {
        alert(`Question ${i + 1}: Please enter question text`);
        return;
      }
      if (q.options.length < 2) {
        alert(`Question ${i + 1}: Must have at least 2 options`);
        return;
      }
      if (!q.options.some(o => o.is_correct)) {
        alert(`Question ${i + 1}: Must mark at least one correct answer`);
        return;
      }
      if (!q.options.some(o => o.text.trim())) {
        alert(`Question ${i + 1}: All options must have text`);
        return;
      }
    }

    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info Section */}
      <div className="space-y-4 pb-6 border-b border-slate-700">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Attach to Lesson <span className="text-rose-400">*</span>
          </label>
          <select
            required
            value={quizForm.lesson}
            onChange={(e) => {
              const selectedLessonId = e.target.value;
              setQuizForm((prev) => ({ ...prev, lesson: selectedLessonId }));
              if (!editing && selectedLessonId) {
                const allLessons = sections.flatMap((s) => s.lessons || []);
                const match = allLessons.find((l) => String(l.id) === String(selectedLessonId));
                if (match?.quiz && onSelectExistingQuiz) {
                  onSelectExistingQuiz(match.quiz);
                }
              }
            }}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="">Select Lesson</option>
            {sections.flatMap((sec) =>
              sec.lessons?.map((l) => {
                const hasExisting = Boolean(l.quiz && (!editing || String(l.quiz.lesson) !== String(l.id)));
                return (
                  <option key={l.id} value={l.id}>
                    {sec.title} → {l.title} {l.quiz ? '(Has Quiz)' : ''}
                  </option>
                );
              })
            )}
          </select>
          {editing && (
            <p className="text-[11px] text-amber-400">
              Editing quiz for attached lesson. Changes to questions and settings will be saved.
            </p>
          )}
        </div>

        <Input
          label="Quiz Title"
          required
          placeholder="e.g. Component State & Hooks Quiz"
          value={quizForm.title}
          onChange={(e) => setQuizForm((prev) => ({ ...prev, title: e.target.value }))}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Description / Instructions
          </label>
          <textarea
            rows={2}
            placeholder="Test your comprehension of the concepts covered..."
            value={quizForm.description}
            onChange={(e) => setQuizForm((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Passing Score (%)"
            type="number"
            min="1"
            max="100"
            value={quizForm.passing_score}
            onChange={(e) => setQuizForm((prev) => ({ ...prev, passing_score: e.target.value }))}
          />
          <Input
            label="Time Limit (min)"
            type="number"
            min="0"
            value={quizForm.time_limit_minutes}
            onChange={(e) =>
              setQuizForm((prev) => ({ ...prev, time_limit_minutes: e.target.value }))
            }
          />
          <Input
            label="Max Attempts"
            type="number"
            min="1"
            value={quizForm.max_attempts}
            onChange={(e) => setQuizForm((prev) => ({ ...prev, max_attempts: e.target.value }))}
          />
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">
            Questions ({quizForm.questions.length})
          </h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addQuestion}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Question
          </Button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {quizForm.questions.map((question, qIndex) => (
            <div
              key={qIndex}
              className="bg-slate-900/50 border border-slate-700/50 rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/30 transition"
                onClick={() =>
                  setExpandedQuestion(expandedQuestion === qIndex ? null : qIndex)
                }
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-bold text-sky-400 w-6">Q{qIndex + 1}</span>
                  <p className="text-xs text-slate-300 truncate">{question.prompt || 'New question'}</p>
                  <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">
                    {question.options.length} options
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeQuestion(qIndex);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </Button>
                  {expandedQuestion === qIndex ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {expandedQuestion === qIndex && (
                <div className="border-t border-slate-700/50 p-4 space-y-4">
                  <Input
                    label="Question Text"
                    required
                    placeholder="What is the question?"
                    value={question.prompt}
                    onChange={(e) => updateQuestion(qIndex, 'prompt', e.target.value)}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Question Type
                      </label>
                      <select
                        value={question.question_type}
                        onChange={(e) => updateQuestion(qIndex, 'question_type', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value="MCQ">Multiple Choice</option>
                        <option value="TF">True/False</option>
                      </select>
                    </div>
                    <Input
                      label="Points"
                      type="number"
                      min="1"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', e.target.value)}
                    />
                    <Input
                      label="Order"
                      type="number"
                      min="1"
                      value={question.order}
                      onChange={(e) => updateQuestion(qIndex, 'order', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Answer Options
                    </label>
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={option.is_correct}
                            onChange={(e) =>
                              updateOption(qIndex, oIndex, 'is_correct', e.target.checked)
                            }
                            className="w-4 h-4 rounded cursor-pointer accent-emerald-500"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            placeholder={`Option ${oIndex + 1}`}
                            value={option.text}
                            onChange={(e) =>
                              updateOption(qIndex, oIndex, 'text', e.target.value)
                            }
                            className="flex-1 bg-slate-950 border border-slate-700/80 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                          />
                          {question.options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(qIndex, oIndex)}
                            >
                              <Trash2 className="w-4 h-4 text-rose-400" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => addOption(qIndex)}
                      leftIcon={<Plus className="w-3 h-3" />}
                      className="mt-2"
                    >
                      Add Option
                    </Button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Explanation (shown after attempt)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Explain why this is the correct answer..."
                      value={question.explanation}
                      onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-700">
        <Button type="submit" variant="primary" size="md" className="flex-1">
          {editing ? 'Save Quiz with Questions' : 'Create Quiz with Questions'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default QuizBuilder;
