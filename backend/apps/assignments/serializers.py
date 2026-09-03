import os
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Assignment, AssignmentSubmission


class AssignmentSerializer(serializers.ModelSerializer):
    course_id = serializers.IntegerField(source='course.id', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id',
            'lesson',
            'section',
            'course_id',
            'course_title',
            'title',
            'instructions',
            'due_date',
            'max_marks',
            'allowed_extensions',
            'is_published',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        lesson = attrs.get('lesson') or getattr(self.instance, 'lesson', None)
        section = attrs.get('section') or getattr(self.instance, 'section', None)

        if not lesson and not section:
            raise serializers.ValidationError(
                "An assignment must be linked to either a Lesson or a Course Section."
            )

        if lesson and section:
            # If both are passed, ensure the lesson belongs to that exact section
            if lesson.section != section:
                raise serializers.ValidationError(
                    "The selected lesson does not belong to the selected course section."
                )

        return attrs


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    course_id = serializers.IntegerField(source='assignment.course.id', read_only=True)
    course_title = serializers.CharField(source='assignment.course.title', read_only=True)
    max_marks = serializers.IntegerField(source='assignment.max_marks', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    graded_by_email = serializers.EmailField(source='graded_by.email', read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id',
            'assignment',
            'assignment_title',
            'course_id',
            'course_title',
            'max_marks',
            'user',
            'user_email',
            'user_full_name',
            'text_submission',
            'file_submission',
            'status',
            'is_late',
            'grade',
            'feedback',
            'graded_by',
            'graded_by_email',
            'submitted_at',
            'graded_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'status',
            'is_late',
            'grade',
            'feedback',
            'graded_by',
            'submitted_at',
            'graded_at',
            'updated_at',
        ]
        extra_kwargs = {
            'assignment': {'required': False},
        }

    def validate(self, attrs):
        text_submission = attrs.get('text_submission')
        file_submission = attrs.get('file_submission')
        assignment = (
            attrs.get('assignment')
            or getattr(self.instance, 'assignment', None)
            or self.context.get('assignment')
        )
        if assignment and 'assignment' not in attrs:
            attrs['assignment'] = assignment

        # 1. At least one submission type must be provided
        if not text_submission and not file_submission:
            raise serializers.ValidationError(
                "You must provide either a text submission or upload a file."
            )

        # 2. File size & extension validation
        if file_submission and assignment:
            # Check 10MB limit
            max_size_bytes = 10 * 1024 * 1024
            if file_submission.size > max_size_bytes:
                raise serializers.ValidationError(
                    {"file_submission": "File size exceeds the 10MB limit."}
                )

            # Check allowed extensions against assignment configuration
            allowed = [
                ext.strip().lower().lstrip('.')
                for ext in assignment.allowed_extensions.split(',')
                if ext.strip()
            ]
            ext = os.path.splitext(file_submission.name)[1].lower().lstrip('.')
            if allowed and ext not in allowed:
                raise serializers.ValidationError(
                    {"file_submission": f"File type '.{ext}' is not allowed. Allowed types: {', '.join(allowed)}."}
                )

        return attrs


class GradeSubmissionSerializer(serializers.Serializer):
    grade = serializers.IntegerField(min_value=0)
    feedback = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_grade(self, value):
        submission = self.context.get('submission')
        if submission and value > submission.assignment.max_marks:
            raise serializers.ValidationError(
                f"Grade cannot exceed maximum marks ({submission.assignment.max_marks})."
            )
        return value