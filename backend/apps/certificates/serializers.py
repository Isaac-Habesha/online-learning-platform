from rest_framework import serializers
from .models import Certificate


class CertificateSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    verify_url = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            "id",
            "certificate_code",
            "learner_full_name",
            "course_title",
            "instructor_name",
            "issued_at",
            "download_url",
            "verify_url",
        ]
        read_only_fields = fields

    def get_download_url(self, obj):
        request = self.context.get("request")
        url = f"/api/certificates/download/{obj.certificate_code}/"
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_verify_url(self, obj):
        request = self.context.get("request")
        url = f"/api/certificates/verify/{obj.certificate_code}/"
        if request:
            return request.build_absolute_uri(url)
        return url


class CertificatePublicVerifySerializer(serializers.ModelSerializer):
    is_valid = serializers.BooleanField(default=True, read_only=True)

    class Meta:
        model = Certificate
        fields = [
            "is_valid",
            "certificate_code",
            "learner_full_name",
            "course_title",
            "instructor_name",
            "issued_at",
        ]
        read_only_fields = fields
