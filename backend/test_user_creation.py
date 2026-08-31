import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.accounts.services import create_user

print("Testing user registration with email backend set to console...\n")

try:
    user = create_user(
        email="hugeboss171@gmail.com",
        password="biruk123",
        first_name="Biruk",
        last_name="Tamirat",
        role="LEARNER"
    )
    print(f"✓ User created successfully!")
    print(f"  ID: {user.id}")
    print(f"  Email: {user.email}")
    print(f"  Name: {user.first_name} {user.last_name}")
    print(f"  Role: {user.role}")
    print(f"  Active: {user.is_active}")
except Exception as e:
    print(f"✗ Registration failed: {e}")
    import traceback
    traceback.print_exc()
