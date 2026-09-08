import io
import uuid
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas

from .models import Certificate


def generate_certificate_code():
    """Generates a clean, unique verifiable certificate code."""
    random_part = uuid.uuid4().hex[:10].upper()
    return f"CERT-{random_part}"


def render_certificate_pdf(certificate):
    """
    Renders an elegant, high-resolution landscape certificate PDF
    using ReportLab vector drawing.
    """
    buffer = io.BytesIO()
    
    # Standard Letter in Landscape: 792 wide x 612 tall points
    width, height = landscape(letter)
    c = canvas.Canvas(buffer, pagesize=(width, height))
    
    # 1. Background fill (subtle warm parchment / clean white)
    c.setFillColor(colors.HexColor("#fcfcfc"))
    c.rect(0, 0, width, height, fill=True, stroke=False)
    
    # 2. Outer decorative frame (Navy Blue)
    c.setStrokeColor(colors.HexColor("#0f172a"))
    c.setLineWidth(6)
    c.rect(24, 24, width - 48, height - 48, fill=False, stroke=True)
    
    # 3. Inner decorative border (Warm Gold / Amber)
    c.setStrokeColor(colors.HexColor("#d97706"))
    c.setLineWidth(2)
    c.rect(34, 34, width - 68, height - 68, fill=False, stroke=True)
    
    # Corner accent accents
    accent_len = 30
    c.setStrokeColor(colors.HexColor("#b45309"))
    c.setLineWidth(3)
    # Top-Left
    c.line(34, height - 34 - accent_len, 34 + accent_len, height - 34)
    # Top-Right
    c.line(width - 34 - accent_len, height - 34, width - 34, height - 34 - accent_len)
    # Bottom-Left
    c.line(34, 34 + accent_len, 34 + accent_len, 34)
    # Bottom-Right
    c.line(width - 34 - accent_len, 34, width - 34, 34 + accent_len)
    
    # 4. Top Ribbon / Organization Name
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width / 2.0, height - 75, "ONLINE LEARNING ACADEMY")
    
    # 5. Main Title: "CERTIFICATE OF COMPLETION"
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(width / 2.0, height - 120, "CERTIFICATE OF COMPLETION")
    
    # Subtle decorative divider below title
    c.setStrokeColor(colors.HexColor("#d97706"))
    c.setLineWidth(2)
    c.line(width / 2.0 - 120, height - 132, width / 2.0 + 120, height - 132)
    
    # 6. Presentation text
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2.0, height - 165, "PROUDLY PRESENTED TO")
    
    # 7. Learner Full Name
    c.setFillColor(colors.HexColor("#0284c7")) # Bright Sky Blue
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(width / 2.0, height - 215, certificate.learner_full_name.upper())
    
    # Underline for name
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setLineWidth(1)
    c.line(width / 2.0 - 200, height - 225, width / 2.0 + 200, height - 225)
    
    # 8. Achievement description
    c.setFillColor(colors.HexColor("#334155"))
    c.setFont("Helvetica", 13)
    c.drawCentredString(
        width / 2.0,
        height - 265,
        "for successfully fulfilling all curriculum requirements and completing the course",
    )
    
    # 9. Course Title
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(width / 2.0, height - 310, f"\"{certificate.course_title}\"")
    
    # 10. Bottom Details: Instructor and Date
    # Left: Instructor
    c.setStrokeColor(colors.HexColor("#94a3b8"))
    c.setLineWidth(1)
    c.line(80, 120, 280, 120)
    
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(180, 105, certificate.instructor_name or "Course Instructor")
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(180, 90, "Instructor")
    
    # Right: Date Issued
    c.line(width - 280, 120, width - 80, 120)
    issued_date_str = certificate.issued_at.strftime("%B %d, %Y")
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width - 180, 105, issued_date_str)
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(width - 180, 90, "Date Issued")
    
    # Center: Seal / Certificate ID
    c.setFillColor(colors.HexColor("#d97706"))
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(width / 2.0, 110, f"CERTIFICATE ID: {certificate.certificate_code}")
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.setFont("Helvetica", 8)
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    verify_url = f"{frontend_url}/verify/{certificate.certificate_code}"
    c.drawCentredString(width / 2.0, 95, f"Verify authenticity: {verify_url}")
    
    # Finalize PDF
    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer.getvalue()


@transaction.atomic
def issue_certificate_if_eligible(*, enrollment):
    """
    Checks if enrollment is eligible for a certificate and issues one if not already issued.
    Snapshot data is frozen at the moment of issuance.
    """
    # Check if certificate already exists
    existing_cert = Certificate.objects.filter(
        enrollment=enrollment
    ).first()
    if existing_cert:
        # If PDF wasn't generated for some reason, generate it now
        if not existing_cert.pdf_file:
            pdf_bytes = render_certificate_pdf(existing_cert)
            existing_cert.pdf_file.save(
                f"{existing_cert.certificate_code}.pdf",
                ContentFile(pdf_bytes),
                save=True,
            )
        return existing_cert

    learner = enrollment.learner
    course = enrollment.course

    # Snapshot calculations
    learner_full_name = f"{learner.first_name} {learner.last_name}".strip()
    if not learner_full_name:
        learner_full_name = learner.email

    course_title = course.title
    
    instructor = course.instructor
    instructor_name = f"{instructor.first_name} {instructor.last_name}".strip() if instructor else "Academy Instructor"

    certificate_code = generate_certificate_code()
    # Guarantee uniqueness of code
    while Certificate.objects.filter(certificate_code=certificate_code).exists():
        certificate_code = generate_certificate_code()

    cert = Certificate.objects.create(
        enrollment=enrollment,
        learner=learner,
        course=course,
        certificate_code=certificate_code,
        learner_full_name=learner_full_name,
        course_title=course_title,
        instructor_name=instructor_name,
    )

    # Render vector PDF and save to storage
    pdf_bytes = render_certificate_pdf(cert)
    cert.pdf_file.save(
        f"{cert.certificate_code}.pdf",
        ContentFile(pdf_bytes),
        save=True,
    )

    return cert
