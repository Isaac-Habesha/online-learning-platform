from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import Course, CourseBookmark
from .serializers import CourseSerializer


class CourseBookmarkToggleView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="add_course_bookmark",
        description="Add a course to user's saved bookmarks",
    )
    def post(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)
        bookmark, created = CourseBookmark.objects.get_or_create(
            user=request.user,
            course=course,
        )
        return Response({"bookmarked": True, "course_id": course.id}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @extend_schema(
        operation_id="remove_course_bookmark",
        description="Remove a course from user's saved bookmarks",
    )
    def delete(self, request, course_id):
        deleted, _ = CourseBookmark.objects.filter(
            user=request.user,
            course_id=course_id,
        ).delete()
        return Response({"bookmarked": False, "course_id": course_id}, status=status.HTTP_200_OK)


class CourseBookmarkListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="list_bookmarked_courses",
        description="Retrieve full course cards for all courses bookmarked by the current user",
        responses={200: CourseSerializer(many=True)},
    )
    def get(self, request):
        bookmarked_course_ids = CourseBookmark.objects.filter(
            user=request.user
        ).values_list("course_id", flat=True)

        courses = Course.objects.filter(
            id__in=bookmarked_course_ids,
            status=Course.Status.PUBLISHED,
        ).select_related("instructor", "category")

        serializer = CourseSerializer(courses, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
