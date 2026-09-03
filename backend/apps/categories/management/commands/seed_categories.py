from django.core.management.base import BaseCommand
from apps.categories.models import Category


class Command(BaseCommand):
    help = 'Seed the database with default course categories'

    def handle(self, *args, **options):
        categories_data = [
            {
                'name': 'Programming',
                'description': 'Learn programming languages and development frameworks',
                'display_order': 1,
            },
            {
                'name': 'Web Development',
                'description': 'Master web development with modern tools and frameworks',
                'display_order': 2,
            },
            {
                'name': 'Mobile Development',
                'description': 'Build mobile applications for iOS and Android',
                'display_order': 3,
            },
            {
                'name': 'Data Science',
                'description': 'Learn data analysis, machine learning, and AI',
                'display_order': 4,
            },
            {
                'name': 'Design',
                'description': 'UI/UX design, graphic design, and creative tools',
                'display_order': 5,
            },
            {
                'name': 'Business',
                'description': 'Business management, marketing, and entrepreneurship',
                'display_order': 6,
            },
            {
                'name': 'Languages',
                'description': 'Learn foreign languages and communication skills',
                'display_order': 7,
            },
        ]

        created_count = 0
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'display_order': cat_data['display_order'],
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created category: {category.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⊘ Category already exists: {category.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Seed completed! {created_count} new categories created.')
        )
