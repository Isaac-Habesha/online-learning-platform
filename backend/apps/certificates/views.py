from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from .models import Certificate
from .serializers import CertificatePublicVerifySerializer, CertificateSerializer
from .services import issue_certificate_if_eligible, render_certificate_pdf
from django.core.files.base import ContentFile


class LearnerCourseCertificateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="get_course_certificate",
        description="Retrieve certificate for a completed course",
        responses={200: CertificateSerializer},
    )
    def get(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)
        enrollment = Enrollment.objects.filter(
            learner=request.user,
            course=course,
        ).first()

        if not enrollment:
            return Response(
                {"detail": "You are not enrolled in this course."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if enrollment.status != Enrollment.Status.COMPLETED:
            return Response(
                {
                    "is_completed": False,
                    "detail": "Course is not yet completed. Complete 100% of lessons, quizzes, and assignments to unlock your certificate.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        certificate = issue_certificate_if_eligible(enrollment=enrollment)
        serializer = CertificateSerializer(certificate, context={"request": request})
        return Response(
            {
                "is_completed": True,
                "certificate": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class PublicVerifyCertificateView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="verify_certificate",
        description="Public endpoint to verify authenticity of a certificate by unique code",
        responses={200: CertificatePublicVerifySerializer},
    )
    def get(self, request, certificate_code):
        cert = Certificate.objects.filter(certificate_code__iexact=certificate_code.strip()).first()
        if not cert:
            return Response(
                {
                    "is_valid": False,
                    "detail": f"Certificate with code '{certificate_code}' was not found or is invalid.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CertificatePublicVerifySerializer(cert)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CertificateDownloadView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="download_certificate_pdf",
        description="Download certificate PDF file by certificate code",
    )
    def get(self, request, certificate_code):
        cert = get_object_or_404(Certificate, certificate_code__iexact=certificate_code.strip())
        
        if not cert.pdf_file:
            pdf_bytes = render_certificate_pdf(cert)
            cert.pdf_file.save(
                f"{cert.certificate_code}.pdf",
                ContentFile(pdf_bytes),
                save=True,
            )

        response = FileResponse(
            cert.pdf_file.open("rb"),
            content_type="application/pdf",
        )
        response["Content-Disposition"] = f'attachment; filename="{cert.certificate_code}.pdf"'
        return response
