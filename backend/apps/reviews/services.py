from django.db.models import Avg, Count
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import Review
from apps.enrollments.models import Enrollment

class ReviewService:
    @staticmethod
    def create_review(user, course_id: int, rating: int, comment: str = "") -> Review:
        has_completed = Enrollment.objects.filter(
            user=user, 
            course_id=course_id, 
            status='COMPLETED'
        ).exists()
        
        if not has_completed:
            raise PermissionDenied("You can only review courses you have successfully completed.")

        if Review.objects.filter(user=user, course_id=course_id).exists():
            raise ValidationError("You have already submitted a review for this course.")

        return Review.objects.create(
            user=user,
            course_id=course_id,
            rating=rating,
            comment=comment
        )

    @staticmethod
    def get_course_stats(course_id: int) -> dict:
        reviews = Review.objects.filter(course_id=course_id, is_hidden=False)
        total_reviews = reviews.count()
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0

        distribution = {i: 0 for i in range(1, 6)}
        counts = reviews.values('rating').annotate(total=Count('rating'))
        for item in counts:
            distribution[item['rating']] = item['total']

        return {
            "average_rating": round(avg_rating, 2),
            "total_reviews": total_reviews,
            "rating_distribution": distribution
        }