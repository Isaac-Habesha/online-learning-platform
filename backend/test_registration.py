import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.accounts.serializers import UserRegistrationSerializer

User = get_user_model()

# Check if email exists
email = 'hugeboss171@gmail.com'
if User.objects.filter(email=email).exists():
    print(f"✗ User with email '{email}' already exists!")
else:
    print(f"✓ Email '{email}' is available")

# Test serializer validation
data = {
    "email": "hugeboss171@gmail.com",
    "first_name": "Biruk",
    "last_name": "Tamirat",
    "role": "LEARNER",
    "password": "biruk123",
    "password_confirm": "biruk123"
}

print("\nValidating registration data...")
serializer = UserRegistrationSerializer(data=data)
if serializer.is_valid():
    print("✓ Serializer validation PASSED")
    print(f"  Validated data: {serializer.validated_data}")
else:
    print("✗ Serializer validation FAILED")
    print(f"  Errors: {serializer.errors}")
