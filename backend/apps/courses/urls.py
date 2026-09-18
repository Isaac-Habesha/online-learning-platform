from django.urls import path

from .views import (
    CourseArchiveView,
    CourseDetailView,
    CourseListCreateView,
    CoursePublishView,
    CourseSectionDetailView,
    CourseSectionListCreateView,
    LessonDetailView,
    LessonListCreateView,
    CourseCurriculumView,
    CourseAnnouncementListCreateView,
    CourseAnnouncementDetailView,
    CourseStudentsView,
)
from .bookmark_views import (
    CourseBookmarkListView,
    CourseBookmarkToggleView,
)
from .video_views import (
    VideoUploadView,
    VideoDetailView,
    VideoReplaceView,
    VideoPlaybackView,
)


app_name = "courses"


urlpatterns = [
    path(
        "",
        CourseListCreateView.as_view(),
        name="course-list-create",
    ),

    path(
        "<int:pk>/",
        CourseDetailView.as_view(),
        name="course-detail",
    ),
    path(
        "<int:pk>/students/",
        CourseStudentsView.as_view(),
        name="course-students",
    ),
    path(
        "<int:pk>/publish/",
        CoursePublishView.as_view(),
        name="course-publish",
),

    path(
        "<int:pk>/archive/",
        CourseArchiveView.as_view(),
        name="course-archive",
    ),
    path(
        "<int:course_id>/sections/",
        CourseSectionListCreateView.as_view(),
        name="section-list-create",
    ),

    path(
        "sections/<int:pk>/",
        CourseSectionDetailView.as_view(),
        name="section-detail",
    ),
    path(
    "sections/<int:section_id>/lessons/",
    LessonListCreateView.as_view(),
    name="lesson-list-create",
),

    path(
        "lessons/<int:pk>/",
        LessonDetailView.as_view(),
        name="lesson-detail",
    ),
    path(
        "<int:pk>/curriculum/",
        CourseCurriculumView.as_view(),
        name="course-curriculum",
    ),
    path(
        "<int:course_id>/announcements/",
        CourseAnnouncementListCreateView.as_view(),
        name="course-announcement-list-create",
    ),
    path(
        "announcements/<int:announcement_id>/",
        CourseAnnouncementDetailView.as_view(),
        name="course-announcement-detail",
    ),
    path(
        "bookmarks/",
        CourseBookmarkListView.as_view(),
        name="course-bookmarks-list",
    ),
    path(
        "<int:course_id>/bookmark/",
        CourseBookmarkToggleView.as_view(),
        name="course-bookmark-toggle",
    ),
    # Video management endpoints
    path(
        "lessons/<int:lesson_id>/video/upload/",
        VideoUploadView.as_view(),
        name="video-upload",
    ),
    path(
        "lessons/<int:lesson_id>/video/replace/",
        VideoReplaceView.as_view(),
        name="video-replace",
    ),
    path(
        "lessons/<int:lesson_id>/video/playback/",
        VideoPlaybackView.as_view(),
        name="video-playback",
    ),
    path(
        "videos/<int:video_id>/",
        VideoDetailView.as_view(),
        name="video-detail",
    ),
]