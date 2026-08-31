import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
import django
django.setup()

from rest_framework.test import APIRequestFactory
from apps.accounts.views import RegisterView

factory = APIRequestFactory()
request = factory.post(
    '/api/accounts/register/',
    {
        'email': 'debuguser123@example.com',
        'first_name': 'Debug',
        'last_name': 'User',
        'role': 'LEARNER',
        'password': 'StrongPass123!',
        'password_confirm': 'StrongPass123!'
    },
    format='json'
)

response = RegisterView.as_view()(request)
print('STATUS:', response.status_code)
print(response.data)
