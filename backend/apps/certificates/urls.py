from django.urls import path
from .views import (
    LearnerCourseCertificateView,
    PublicVerifyCertificateView,
    CertificateDownloadView,
)

urlpatterns = [
    path("course/<int:course_id>/", LearnerCourseCertificateView.as_view(), name="course-certificate"),
    path("verify/<str:certificate_code>/", PublicVerifyCertificateView.as_view(), name="verify-certificate"),
    path("download/<str:certificate_code>/", CertificateDownloadView.as_view(), name="download-certificate"),
]
