# 🚀 Quick Start Guide (5 Minutes)

## Step 1: Start Your Servers

### Backend:
```bash
cd backend
python manage.py runserver
# Should show: "Starting development server at http://127.0.0.1:8000/"
```

### Frontend:
```bash
# In new terminal
cd frontend
npm run dev
# Should show: "Local:   http://localhost:5173"
```

---

## Step 2: Test Email Verification (2 min)

1. Go to `http://localhost:5173/register`
2. Register a new account:
   ```
   Email: test@example.com
   Password: TestPass123!
   First Name: Test
   Last Name: User
   Role: Learner
   ```
3. Check `backend/sent_emails/` folder
4. Open the email file
5. Copy the verification token (long string)
6. Go to `http://localhost:5173/verify-email`
7. Paste token and verify

✅ Email verification working!

---

## Step 3: Create a Quiz (3 min)

1. Login as instructor:
   ```
   Email: instructor@example.com
   Password: InstructorPass123!
   ```

2. Create/Select a course

3. Go to **Assessments** tab

4. Click **"Create Quiz"**

5. Fill in:
   - **Lesson:** Select any lesson
   - **Title:** "Python Basics Quiz"
   - **Description:** "Test your Python knowledge"
   - **Passing Score:** 70
   - **Time Limit:** 15 min
   - **Max Attempts:** 3

6. **Add Question 1:**
   - Question: "What is Python?"
   - Type: Multiple Choice
   - Points: 5
   - Options:
     - [ ] Snake type
     - [x] Programming Language
     - [ ] Computer brand
   - Explanation: "Python is a popular programming language"

7. **Add Question 2:**
   - Question: "Is Python interpreted?"
   - Type: True/False
   - Options:
     - [x] True
     - [ ] False

8. Click **"Save Quiz with Questions"**

✅ Quiz created!

---

## Step 4: Take Quiz as Learner (2 min)

1. Logout (if logged in)

2. Login as learner:
   ```
   Email: learner@example.com
   Password: LearnerPass123!
   ```

3. Enroll in the course (should see enroll button)

4. Go to the lesson with your quiz

5. Click **"Start Quiz"**

6. Answer Question 1: Select "Programming Language"

7. Click **"Next"**

8. Answer Question 2: Select "True"

9. Click **"Submit Quiz"**

10. See results:
    - Score: 100%
    - Grade: A
    - Status: PASSED ✓

11. Expand each answer to see explanation

✅ Quiz taking works!

---

## Step 5: Create Assignment (1 min)

1. Login as instructor again

2. Go to Assessments tab

3. Click **"Create Assignment"**

4. Fill in:
   - **Lesson:** Select a lesson
   - **Title:** "Build Python Calculator"
   - **Instructions:** "Create a calculator that can add, subtract, multiply, divide"
   - **Max Marks:** 100
   - **Allowed Extensions:** zip,pdf,doc,py

5. Click **"Create Assignment"**

✅ Assignment created!

---

## Step 6: Submit Assignment (1 min)

1. Logout → Login as learner

2. Go to lesson with assignment

3. Click **"Submit Assignment"**

4. Either:
   - Enter text: "Here's my calculator code..."
   - Upload file: Select a .py or .zip file
   - Or both!

5. Click **"Submit Assignment"**

✅ Assignment submitted!

---

## 🎉 Everything Works!

You've now tested:
- ✅ Email verification
- ✅ Quiz creation with questions
- ✅ Quiz taking with results
- ✅ Assignment creation
- ✅ Assignment submission

---

## 📚 Next: Integration

To add quizzes to your lesson viewer, see: **INTEGRATION_GUIDE.md**

---

## 🆘 Troubleshooting

### "Quiz Creation Failed"
- [ ] Check all questions have correct answer marked
- [ ] Check all questions have 2+ options
- [ ] Check browser console (F12)

### "Quiz Not Showing"
- [ ] Quiz must be published
- [ ] Learner must be enrolled in course
- [ ] Lesson must exist

### "Email Not Found"
- [ ] Check `backend/sent_emails/` folder exists
- [ ] Look for most recent file
- [ ] Copy the token string

### "Port 8000 already in use"
```bash
# Kill process on port 8000
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### "npm: command not found"
```bash
# Install Node.js from nodejs.org
# Then try again
node --version
npm --version
```

---

## 📖 Full Documentation

- **QUIZ_ASSIGNMENT_GUIDE.md** - Complete features
- **IMPLEMENTATION_COMPLETE.md** - What was done
- **INTEGRATION_GUIDE.md** - Add to lesson viewer
- **FINAL_SUMMARY.md** - All details
- **CHECKLIST_AND_NEXT_STEPS.md** - Verification steps

---

## 🎯 What Was Fixed

| Issue | Status |
|-------|--------|
| Email verification not sending | ✅ FIXED |
| No quiz builder UI | ✅ CREATED |
| Quiz creation failing | ✅ FIXED |
| No quiz taking interface | ✅ CREATED |
| No results display | ✅ CREATED |
| Assignment not working | ✅ IMPLEMENTED |
| File upload | ✅ IMPLEMENTED |
| Form validation | ✅ IMPLEMENTED |

---

**That's it! Everything is working. Start testing and integrating! 🚀**

