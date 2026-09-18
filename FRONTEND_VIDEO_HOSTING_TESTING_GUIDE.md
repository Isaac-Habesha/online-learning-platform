# Frontend Video Hosting Testing Guide

This guide explains how to test and verify that the video hosting logic works correctly in the frontend based on the implemented project.

## Prerequisites

1. Backend server running on `http://127.0.0.1:8000/`
2. Frontend development server running on `http://localhost:5173/`
3. Valid instructor account with a published course
4. Valid learner account for testing playback
5. Test video file (MP4, WebM, MOV, AVI, or MKV, under 2GB)

## Component Integration

### Step 1: Import Video Components

In your lesson management page or course editor, import the video components:

```jsx
import VideoManagement from '../components/instructor/VideoManagement';
import VideoPlayer from '../components/lessons/VideoPlayer';
```

### Step 2: Add Video Management to Lesson Editor

For instructors managing lessons, add the VideoManagement component:

```jsx
// In your lesson edit/create page
<VideoManagement
  lesson={lesson}
  onUpdate={() => {
    // Refresh lesson data after video upload/delete
    fetchLessonDetails();
  }}
/>
```

### Step 3: Add Video Player to Lesson View

For learners viewing lessons, add the VideoPlayer component:

```jsx
// In your lesson detail page
<VideoPlayer
  lesson={lesson}
  enrollment={enrollment}
/>
```

## Testing Scenarios

### Test 1: Instructor Video Upload

**Objective**: Verify instructors can upload videos to their lessons

**Steps**:
1. Login as an instructor with a published course
2. Navigate to a lesson in your course
3. Click "Upload Video" or switch video type to "Hosted Video"
4. Select a valid video file (MP4, WebM, etc.)
5. Click "Upload Video"
6. Monitor upload progress

**Expected Results**:
- File validation should pass (size, type, format)
- Upload progress indicator should show
- After upload, video status should show "UPLOADING" → "UPLOADED" → "READY"
- Lesson video_type should be set to "HOSTED"
- Video details should display (filename, size, status)

**API Calls to Verify**:
- `POST /api/courses/lessons/{lesson_id}/video/upload/`
- `GET /api/courses/lessons/{lesson_id}/` (to verify video_type updated)

### Test 2: Video Type Selection

**Objective**: Verify instructors can switch between video types

**Steps**:
1. Navigate to a lesson
2. Try switching video type to "External URL"
3. Try switching video type to "Hosted Video"
4. Try switching video type to "No Video"

**Expected Results**:
- Radio buttons should work correctly
- External URL input should appear when EXTERNAL selected
- Upload interface should appear when HOSTED selected
- No video interface should appear when NONE selected

### Test 3: File Validation

**Objective**: Verify file validation works correctly

**Steps**:
1. Try uploading a file larger than 2GB
2. Try uploading an invalid file type (e.g., .txt, .pdf)
3. Try uploading a valid video file

**Expected Results**:
- Large files should show error: "File size exceeds maximum allowed size"
- Invalid file types should show error: "File type not allowed"
- Valid video files should pass validation

### Test 4: Video Replacement

**Objective**: Verify instructors can replace existing videos

**Steps**:
1. Upload a video to a lesson
2. Wait for it to reach READY status
3. Click "Replace Video"
4. Select a different video file
5. Upload the new video

**Expected Results**:
- Replace interface should appear for READY videos
- Old video should be deleted after successful replacement
- New video should upload and process
- Lesson should link to the new video

**API Calls to Verify**:
- `POST /api/courses/lessons/{lesson_id}/video/replace/`
- `DELETE /api/courses/videos/{video_id}/` (old video)

### Test 5: Video Deletion

**Objective**: Verify instructors can delete videos

**Steps**:
1. Upload a video to a lesson
2. Wait for it to reach READY status
3. Click "Delete Video"
4. Confirm deletion

**Expected Results**:
- Delete button should be available
- Confirmation dialog should appear
- Video should be deleted from storage
- Lesson video_type should revert to NONE
- Video management interface should show "No hosted video uploaded"

**API Calls to Verify**:
- `DELETE /api/courses/videos/{video_id}/`
- `GET /api/courses/lessons/{lesson_id}/` (to verify video_type reverted)

### Test 6: Learner Video Playback - Hosted Video

**Objective**: Verify enrolled learners can access hosted videos

**Steps**:
1. Login as a learner
2. Enroll in a course with a hosted video lesson
3. Navigate to the lesson
4. Verify video player appears
5. Play the video

**Expected Results**:
- VideoPlayer component should render
- Video should load and play
- No access errors should occur
- Video controls should work (play, pause, seek, volume)

**API Calls to Verify**:
- `GET /api/courses/lessons/{lesson_id}/video/playback/`
- Response should include: playback_url, thumbnail_url, duration, status

### Test 7: Learner Video Playback - External Video

**Objective**: Verify external videos still work

**Steps**:
1. Login as a learner
2. Navigate to a lesson with external video URL
3. Verify video player appears
4. Play the video

**Expected Results**:
- VideoPlayer should render external video player
- YouTube/Vimeo embeds should work
- HTML5 video player should work for direct URLs
- Video should play correctly

### Test 8: Access Control - Non-Enrolled Learner

**Objective**: Verify non-enrolled learners cannot access hosted videos

**Steps**:
1. Login as a learner
2. Navigate to a lesson with hosted video (not enrolled)
3. Verify access is denied

**Expected Results**:
- VideoPlayer should show "Video unavailable" error
- API call to playback endpoint should return 403
- No video should be accessible

**API Calls to Verify**:
- `GET /api/courses/lessons/{lesson_id}/video/playback/`
- Should return 403 Forbidden

### Test 9: Video Status Display

**Objective**: Verify video status is correctly displayed

**Steps**:
1. Upload a video
2. Monitor the status display during processing

**Expected Results**:
- Status badges should show: PENDING, UPLOADING, UPLOADED, PROCESSING, READY, FAILED
- Color coding should match status (yellow for pending, green for ready, red for failed)
- Error messages should display for FAILED status

### Test 10: Free Preview Lesson

**Objective**: Verify free preview lessons bypass enrollment

**Steps**:
1. Mark a lesson as free preview
2. Login as a non-enrolled learner
3. Navigate to the lesson
4. Try to access hosted video

**Expected Results**:
- Video should be accessible without enrollment
- VideoPlayer should render and play
- No access errors should occur

## Manual Testing Checklist

### Instructor Testing
- [ ] Can upload video to own lesson
- [ ] Cannot upload to other instructor's lesson
- [ ] File validation works (size, type, format)
- [ ] Upload progress displays correctly
- [ ] Video status updates correctly
- [ ] Can replace existing video
- [ ] Can delete video
- [ ] Can switch between video types
- [ ] External URL input works
- [ ] Video details display correctly

### Learner Testing
- [ ] Can play hosted video when enrolled
- [ ] Cannot play hosted video when not enrolled
- [ ] Can play external video (YouTube, Vimeo, etc.)
- [ ] Free preview videos work without enrollment
- [ ] Video player controls work correctly
- [ ] Video loads and plays smoothly

### Error Handling
- [ ] Large file error displays correctly
- [ ] Invalid file type error displays correctly
- [ ] Network error handling works
- [ ] Upload failure shows appropriate message
- [ ] Playback failure shows appropriate message

## Browser Console Testing

Open browser DevTools Console to verify:

### Network Requests
Check that the following API calls are made:
- Upload: `POST /api/courses/lessons/{id}/video/upload/`
- Replace: `POST /api/courses/lessons/{id}/video/replace/`
- Playback: `GET /api/courses/lessons/{id}/video/playback/`
- Delete: `DELETE /api/courses/videos/{id}/`

### Console Logs
Check for any JavaScript errors:
- No undefined component errors
- No API call failures
- No validation errors in console

### Video Player
Check HTML5 video player:
- Video element loads correct source
- Video metadata loads (duration, dimensions)
- No CORS errors
- No 404 errors for video files

## Integration Testing

### Test with Existing Lesson Flow

1. **Create Course**: Create a new course as instructor
2. **Add Section**: Add a section to the course
3. **Create Lesson**: Create a lesson in the section
4. **Upload Video**: Upload a video to the lesson
5. **Publish Course**: Publish the course
6. **Enroll as Learner**: Enroll in the course as a learner
7. **Access Lesson**: Navigate to the lesson
8. **Play Video**: Verify video plays correctly

### Test with External Video Flow

1. **Create Lesson**: Create a lesson with external video URL
2. **Verify Migration**: Verify video_type is EXTERNAL
3. **Access as Learner**: Navigate to lesson as enrolled learner
4. **Play Video**: Verify external video plays
5. **Switch to Hosted**: Switch lesson to hosted video
6. **Upload Video**: Upload a hosted video
7. **Verify Playback**: Verify hosted video plays

## Performance Testing

### Upload Performance
- Test with small video (<10MB): Should upload quickly
- Test with medium video (~100MB): Should upload reasonably
- Test with large video (~1GB): Should upload within acceptable time

### Playback Performance
- Test video loading time
- Test video seeking performance
- Test video buffering behavior
- Test on slow network connections

## Cross-Browser Testing

Test the video hosting functionality in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Video Upload Fails
- Check browser console for errors
- Verify backend server is running
- Check network tab for failed API calls
- Verify file size is under 2GB
- Verify file type is supported

### Video Playback Fails
- Check enrollment status
- Verify video status is READY
- Check browser console for errors
- Verify playback URL is accessible
- Check for CORS errors

### Video Player Not Rendering
- Verify VideoPlayer component is imported
- Check that lesson data is loaded
- Verify enrollment data is passed
- Check browser console for React errors

## Success Criteria

The frontend video hosting logic is working correctly when:
1. Instructors can successfully upload videos to their lessons
2. File validation prevents invalid uploads
3. Video status updates correctly during processing
4. Enrolled learners can play hosted videos
5. Non-enrolled learners cannot access hosted videos
6. External videos continue to work
7. Video player controls function correctly
8. No console errors during normal operation
9. API calls complete successfully
10. Error messages display appropriately

## Next Steps

After successful testing:
1. Integrate components into production lesson management pages
2. Add video upload to lesson creation/edit forms
3. Add video player to lesson detail pages
4. Test with real users
5. Monitor for any issues in production
6. Implement any additional features based on feedback
