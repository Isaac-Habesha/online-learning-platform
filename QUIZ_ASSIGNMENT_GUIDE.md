# Quiz & Assignment Implementation Guide

## 🎯 What's Been Fixed and Implemented

### 1. ✅ Email Verification (Fixed)
**Problem:** Verification emails weren't being sent
**Solution:** 
- Changed email backend in `backend/config/settings/development.py`
- Emails now saved to `backend/sent_emails/` directory
- Can be configured to send real emails via SMTP

**To test:**
1. Register a new user
2. Check `backend/sent_emails/` for the verification email
3. Copy the token and use it to verify email

---

### 2. ✅ Quiz Creation for Instructors

#### Frontend Components Created:

**QuizBuilder.jsx** - Full featured quiz builder
- Create quizzes with title, description, passing score, time limit
- Add multiple questions with different types (MCQ, True/False)
- For each question:
  - Add multiple options/answers
  - Mark correct answer(s)
  - Add points value
  - Add explanation text shown after attempt

#### How Instructors Create Quizzes:

1. Go to Course Builder → Assessments tab
2. Click "Create Quiz" button
3. Select lesson to attach quiz to
4. Fill in quiz details:
   - Title
   - Description
   - Passing score (%)
   - Time limit (minutes) - 0 = no limit
   - Max attempts allowed
5. Add questions:
   - Click "Add Question"
   - Enter question text
   - Select question type (MCQ or True/False)
   - Add answer options
   - Check checkbox next to correct answer
   - Add explanation (optional)
   - Set points for this question
6. Click "Save Quiz with Questions"

#### Quiz API Endpoint:
```bash
POST /api/quizzes/quizzes/
Content-Type: application/json

{
  "lesson": 1,
  "title": "Chapter 1 Quiz",
  "description": "Test your knowledge",
  "passing_score": 70,
  "time_limit_minutes": 20,
  "max_attempts": 3,
  "is_published": true,
  "questions": [
    {
      "prompt": "What is 2 + 2?",
      "question_type": "MCQ",
      "points": 5,
      "order": 1,
      "explanation": "Basic arithmetic",
      "options": [
        {"text": "3", "order": 1, "is_correct": false},
        {"text": "4", "order": 2, "is_correct": true},
        {"text": "5", "order": 3, "is_correct": false}
      ]
    }
  ]
}
```

---

### 3. ✅ Quiz Taking for Learners

#### Frontend Components Created:

**QuizTaker.jsx** - Full quiz interface
- Display quiz information
- Show all questions sequentially
- Single-choice selection for MCQ (radio buttons)
- Question progress tracker
- Timer with countdown (if quiz has time limit)
- Question overview grid to jump to any question
- Submit quiz button

**QuizResults.jsx** - Results display
- Show final score with percentage
- Display grade (A/B/C/D/F)
- Show points earned vs total
- Pass/Fail status with trophy icon
- Review all answers with:
  - Your selected answer
  - Correct answer (if wrong)
  - Explanation for each question
- Option to retake if failed

#### How Learners Take Quizzes:

1. Go to lesson that has a quiz
2. Click "Start Quiz"
3. Read question and select one answer (radio button)
4. Click "Next" or use question number grid to navigate
5. When at last question, click "Submit Quiz"
6. See instant results:
   - If passed: Shows congratulations and unlocks next lesson
   - If failed: Can retake quiz (up to max attempts)
7. Review answers with explanations

#### Quiz Attempt API Endpoints:
```bash
# Start quiz attempt
POST /api/quizzes/quizzes/{id}/start/
Response: { attempt_id, attempt_number, started_at, time_limit_minutes }

# Submit quiz answers
POST /api/quizzes/quizzes/{id}/submit/
{
  "answers": [
    {"question_id": 1, "selected_option_id": 2},
    {"question_id": 2, "selected_option_id": 4}
  ]
}
Response: 
{
  "id": 1,
  "score": 85.5,
  "passed": true,
  "answers": [...]
}

# Get quiz results
GET /api/quizzes/quizzes/{id}/results/
```

---

### 4. ✅ Assignments for Both Instructor and Learner

#### Frontend Components Created:

**AssignmentBuilder.jsx** - For instructors to create assignments
**AssignmentSubmitter.jsx** - For learners to submit work

#### How Instructors Create Assignments:

1. Go to Course Builder → Assessments tab
2. Click "Create Assignment"
3. Select lesson to attach assignment to
4. Fill in assignment details:
   - Title
   - Detailed instructions (what to do)
   - Max marks
   - Allowed file extensions (pdf, doc, docx, etc.)
5. Publish immediately (checkbox)
6. Click "Create Assignment"

#### How Learners Submit Assignments:

1. Go to lesson with assignment
2. Click "Submit Assignment"
3. Choose submission type:
   - **Text submission**: Write directly in text area
   - **File upload**: Upload file (PDF, doc, zip, png, jpg, etc.)
   - **Both**: Provide text AND upload file
4. File validation:
   - Max 10MB size
   - Only allowed extensions
5. Click "Submit Assignment"
6. Instructor will grade and provide feedback

#### Assignment API Endpoints:
```bash
# Create assignment (instructor)
POST /api/assignments/assignments/
{
  "lesson": 1,
  "title": "Build E-Commerce Cart",
  "instructions": "Create a shopping cart component...",
  "max_marks": 100,
  "allowed_extensions": "pdf,zip,doc,docx",
  "is_published": true
}

# Submit assignment (learner) - supports FormData
POST /api/assignments/assignments/{id}/submit/
multipart/form-data:
  - text_submission: "My solution..."
  - file_submission: <file>

# Get learner's submissions
GET /api/assignments/assignments/{id}/my_submissions/

# Grade submission (instructor)
POST /api/assignments/submissions/{id}/grade/
{
  "grade": 85,
  "feedback": "Great work! Well structured..."
}
```

---

## 🔄 How to Integrate Into Lesson Page

To show quiz/assignment in the lesson view, add code like:

```jsx
import QuizTaker from './components/learner/QuizTaker';
import QuizResults from './components/learner/QuizResults';
import AssignmentSubmitter from './components/learner/AssignmentSubmitter';

export function LessonPage() {
  const [quizState, setQuizState] = useState('start'); // start, taking, results
  const [quizAttempt, setQuizAttempt] = useState(null);
  
  // In your lesson content section:
  if (lesson.quiz) {
    if (quizState === 'taking') {
      return (
        <QuizTaker 
          quizId={lesson.quiz.id}
          onComplete={(attempt) => {
            setQuizAttempt(attempt);
            setQuizState('results');
          }}
          onCancel={() => setQuizState('start')}
        />
      );
    }
    
    if (quizState === 'results') {
      return (
        <QuizResults 
          attempt={quizAttempt}
          quiz={lesson.quiz}
          onRetake={() => setQuizState('taking')}
          onBack={() => setQuizState('start')}
        />
      );
    }
    
    // Start state
    return (
      <div>
        <Button onClick={() => setQuizState('taking')}>
          Start Quiz
        </Button>
      </div>
    );
  }
}
```

---

## 📊 Progress Tracking (TODO - Not Yet Implemented)

For automatic lesson unlock when quiz is passed:

1. **Backend**: Need to add endpoint to update learner progress
2. **Progress Model**: Track which lessons learner has passed
3. **Frontend**: Check progress before allowing access to next lesson

```jsx
// Future implementation
if (!canAccessLesson(lesson, userProgress)) {
  return (
    <div>Pass previous lesson quiz to unlock</div>
  );
}
```

---

## 🐛 Troubleshooting

### Quiz Creation Fails
- **Check**: All questions have at least one correct answer
- **Check**: All questions have at least 2 options
- **Check**: Lesson is selected
- **Check**: Quiz title is not empty

### Learner Can't See Quiz
- **Check**: Quiz is published (`is_published: true`)
- **Check**: Learner is enrolled in course
- **Check**: Lesson is free preview OR learner is enrolled
- **Check**: Visit `/api/quizzes/quizzes/` to see available quizzes

### Email Not Sending
- **Current**: Using file backend (saves to `backend/sent_emails/`)
- **To use SMTP**: Uncomment EMAIL_BACKEND config in `development.py`

### File Upload Fails
- **Check**: File size < 10MB
- **Check**: File extension is in allowed list
- **Check**: Use FormData to send file

---

## 📚 API Documentation

### Quiz Service Methods
```javascript
// frontend/src/services/quizService.js
quizService.getQuizzes()          // Get all quizzes
quizService.getQuiz(id)           // Get specific quiz with questions
quizService.createQuiz(data)      // Create with questions (nested)
quizService.updateQuiz(id, data)  // Update quiz
quizService.deleteQuiz(id)        // Delete quiz
quizService.startAttempt(id)      // Start taking quiz
quizService.submitAttempt(id, answers) // Submit and get results
quizService.getResults(id)        // Get all results (instructor) or own (learner)
```

### Assignment Service Methods
```javascript
// frontend/src/services/assignmentService.js
assignmentService.getAssignments()              // Get all
assignmentService.getAssignment(id)             // Get specific
assignmentService.createAssignment(data)       // Create
assignmentService.updateAssignment(id, data)   // Update
assignmentService.deleteAssignment(id)         // Delete
assignmentService.submitAssignment(id, formData) // Submit work
assignmentService.getMySubmissionsForAssignment(id) // Learner's own
assignmentService.getAllSubmissions()          // For instructor
assignmentService.gradeSubmission(id, grade, feedback) // Grade work
```

---

## ✨ Next Steps

1. ✅ Email verification - DONE
2. ✅ Quiz creation - DONE  
3. ✅ Quiz taking - DONE
4. ✅ Quiz results - DONE
5. ✅ Assignments - DONE
6. ⏳ Progress tracking - TODO
7. ⏳ Lesson unlock on quiz pass - TODO
8. ⏳ Dashboard with quiz/assignment status - TODO
9. ⏳ Instructor grading dashboard - TODO
10. ⏳ Unit tests - TODO

