# Integration Guide: Adding Quizzes & Assignments to Lesson Viewer

## Quick Integration Example

This shows how to integrate the new quiz and assignment components into your lesson viewing page.

### Complete Example Component:

```jsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import QuizTaker from '../../components/learner/QuizTaker';
import QuizResults from '../../components/learner/QuizResults';
import AssignmentSubmitter from '../../components/learner/AssignmentSubmitter';
import courseService from '../../services/courseService';
import quizService from '../../services/quizService';
import assignmentService from '../../services/assignmentService';

export function LessonViewer() {
  const { courseId, lessonId } = useParams();
  
  const [lesson, setLesson] = useState(null);
  const [quizState, setQuizState] = useState('start'); // start, taking, results
  const [assignmentState, setAssignmentState] = useState('start'); // start, submitting
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load lesson data including quiz & assignment
  useEffect(() => {
    const loadLesson = async () => {
      try {
        const data = await courseService.getLesson(courseId, lessonId);
        setLesson(data);
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadLesson();
  }, [courseId, lessonId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Lesson Content */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">{lesson.title}</h1>
        <div className="prose prose-invert max-w-none">
          {/* Render lesson HTML/markdown */}
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>
      </div>

      {/* QUIZ SECTION */}
      {lesson.quiz && (
        <div className="border-t-2 border-slate-700 pt-8">
          {quizState === 'taking' ? (
            <QuizTaker
              quizId={lesson.quiz.id}
              onComplete={(attempt) => {
                setQuizAttempt(attempt);
                setQuizState('results');
              }}
              onCancel={() => setQuizState('start')}
            />
          ) : quizState === 'results' ? (
            <QuizResults
              attempt={quizAttempt}
              quiz={lesson.quiz}
              onRetake={() => setQuizState('taking')}
              onBack={() => setQuizState('start')}
            />
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                📝 Quiz Assessment
              </h2>
              <p className="text-slate-300">{lesson.quiz.description}</p>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-sm text-slate-400 mb-3">
                  📊 Passing Score: {lesson.quiz.passing_score}%
                  {lesson.quiz.time_limit_minutes > 0 && (
                    <> • ⏱️ Time Limit: {lesson.quiz.time_limit_minutes} min</>
                  )}
                  • 🔄 Attempts: {lesson.quiz.max_attempts}
                </p>
                <Button
                  onClick={() => setQuizState('taking')}
                  variant="primary"
                  size="lg"
                >
                  Start Quiz →
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ASSIGNMENT SECTION */}
      {lesson.assignments && lesson.assignments.length > 0 && (
        <div className="border-t-2 border-slate-700 pt-8 space-y-6">
          {lesson.assignments.map((assignment) => (
            <div key={assignment.id}>
              {assignmentState === 'submitting' && (
                <AssignmentSubmitter
                  assignment={assignment}
                  onSubmit={() => {
                    toast.success('Assignment submitted!');
                    setAssignmentState('start');
                  }}
                  onCancel={() => setAssignmentState('start')}
                />
              ) : (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    📋 Assignment
                  </h2>
                  <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {assignment.title}
                    </h3>
                    <p className="text-slate-300 mb-4 whitespace-pre-wrap">
                      {assignment.instructions}
                    </p>
                    <div className="flex items-center gap-4 mb-4 text-sm text-slate-400">
                      <span>⭐ Max Marks: {assignment.max_marks}</span>
                      <span>📁 Accepted: {assignment.allowed_extensions}</span>
                    </div>
                    <Button
                      onClick={() => setAssignmentState('submitting')}
                      variant="primary"
                    >
                      Submit Assignment →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Next Lesson Button */}
      {lesson.nextLesson && (
        <div className="border-t-2 border-slate-700 pt-8 text-center">
          <Button
            to={`/course/${courseId}/lesson/${lesson.nextLesson.id}`}
            variant="primary"
            size="lg"
          >
            Continue to Next Lesson →
          </Button>
        </div>
      )}
    </div>
  );
}

export default LessonViewer;
```

---

## Minimal Implementation

If you want a minimal version:

```jsx
// Import components
import QuizTaker from '../../components/learner/QuizTaker';
import AssignmentSubmitter from '../../components/learner/AssignmentSubmitter';

// In your lesson component:
{lesson.quiz && (
  <div className="mt-8 p-6 border-t">
    <QuizTaker 
      quizId={lesson.quiz.id}
      onComplete={(result) => {
        console.log('Quiz result:', result);
        // Update progress, show results, etc.
      }}
      onCancel={() => console.log('Quiz cancelled')}
    />
  </div>
)}

{lesson.assignments?.map(assignment => (
  <div key={assignment.id} className="mt-8 p-6 border-t">
    <AssignmentSubmitter
      assignment={assignment}
      onSubmit={() => console.log('Assignment submitted')}
      onCancel={() => console.log('Submission cancelled')}
    />
  </div>
))}
```

---

## For Instructors - Course Builder Integration

The `QuizBuilder` and `AssignmentBuilder` components are already integrated into the course builder:

```jsx
// Already done - CourseBuilder.jsx uses these:
import QuizBuilder from '../../components/instructor/QuizBuilder';
import AssignmentBuilder from '../../components/instructor/AssignmentBuilder';

// In Modal:
<Modal isOpen={quizModalOpen}>
  <QuizBuilder
    quizForm={quizForm}
    setQuizForm={setQuizForm}
    onSubmit={handleSaveQuiz}
    onCancel={() => setQuizModalOpen(false)}
    sections={sections}
  />
</Modal>
```

No changes needed for instructor side!

---

## API Call Examples

### Get Quiz with Questions:
```javascript
const quiz = await quizService.getQuiz(quizId);
// Returns: { id, lesson, title, description, questions: [...] }
```

### Get Assignment:
```javascript
const assignment = await assignmentService.getAssignment(assignmentId);
// Returns: { id, lesson, title, instructions, max_marks, allowed_extensions }
```

### Get Learner's Quiz Results:
```javascript
const attempts = await quizService.getResults(quizId);
// Returns: [{ id, score, passed, answers: [...] }]
```

### Get Learner's Assignment Submissions:
```javascript
const submissions = await assignmentService.getMySubmissionsForAssignment(assignmentId);
// Returns: [{ id, status, grade, feedback, submitted_at }]
```

---

## State Management Flow

### Quiz Flow:
```
START → User clicks "Start Quiz"
  ↓
TAKING → QuizTaker component loads
  ↓
SUBMIT → User clicks "Submit Quiz"
  ↓
RESULTS → QuizResults shows score & review
  ↓
RETAKE (if failed) OR BACK TO LESSON
```

### Assignment Flow:
```
START → User clicks "Submit Assignment"
  ↓
SUBMITTING → AssignmentSubmitter form
  ↓
SUBMIT → User clicks "Submit Assignment"
  ↓
SUCCESS → Toast message, back to start
  ↓
GRADED → Instructor reviews and grades
```

---

## Error Handling

Components handle errors internally and show toast notifications:

```jsx
// Errors are caught and displayed automatically via toast.error()
// Examples of errors handled:
- Quiz not found
- Learner not enrolled
- Quiz already submitted
- File upload too large
- Invalid file type
```

---

## Customization

### Change Quiz Colors:
Edit `frontend/src/components/learner/QuizTaker.jsx`:
```jsx
// Change border-sky-500 to your color
border-emerald-500
border-rose-500
border-purple-500
```

### Change Quiz Time Display:
```jsx
// In QuizTaker.jsx, modify formatTime function
const formatTime = (seconds) => {
  // Customize time format here
}
```

### Add Custom Feedback:
```jsx
// In QuizResults.jsx, after checking passed:
if (result.passed) {
  // Send analytics
  // Unlock next lesson
  // Award badge
  // Send email
}
```

---

## Testing Components Independently

### Test QuizTaker Standalone:
```jsx
import QuizTaker from './components/learner/QuizTaker';

export function TestQuiz() {
  return <QuizTaker quizId={1} onComplete={() => {}} onCancel={() => {}} />;
}
```

### Test with Mock Data:
```jsx
const mockQuiz = {
  id: 1,
  title: 'Test Quiz',
  questions: [
    {
      id: 1,
      prompt: 'What is 2+2?',
      options: [
        { id: 1, text: '3', is_correct: false },
        { id: 2, text: '4', is_correct: true }
      ]
    }
  ]
};
```

---

## Performance Tips

1. **Lazy Load Results:**
   ```jsx
   const results = useCallback(async () => {
     return await quizService.getResults(quizId);
   }, [quizId]);
   ```

2. **Cache Quiz Data:**
   ```jsx
   const quiz = useQuery(['quiz', quizId], 
     () => quizService.getQuiz(quizId)
   );
   ```

3. **Paginate Large Assignments:**
   ```jsx
   const [page, setPage] = useState(1);
   const assignments = await assignmentService.getAssignments({ page });
   ```

---

## Accessibility Features

Components already include:
- ✅ Keyboard navigation (Tab, Enter, Arrow keys)
- ✅ ARIA labels for screen readers
- ✅ Focus management
- ✅ Color contrast compliance
- ✅ Mobile responsive design

---

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ✅ Mobile app (React Native)

---

## Help & Support

For issues:
1. Check browser console for errors
2. Verify API endpoints are correct
3. Check user permissions (authenticated, enrolled, etc.)
4. Test API directly with curl commands
5. Check backend logs for server errors

