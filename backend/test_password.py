import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()
from django.contrib.auth.password_validation import validate_password

print("Testing password: 'biruk123'")
try:
    validate_password('biruk123')
    print('✓ Password validation: PASSED')
except Exception as e:
    print(f'✗ Password validation FAILED:')
    print(f'  {e}')

print("\nTesting password: 'BirukTamirat123!'")
try:
    validate_password('BirukTamirat123!')
    print('✓ Password validation: PASSED')
except Exception as e:
    print(f'✗ Password validation FAILED: {e}')
