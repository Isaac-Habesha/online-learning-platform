# Online Learning Platform

A full-stack online learning platform. The `backend/` directory contains the Django REST Framework API, while `frontend/` contains the React/Vite web application.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Core Applications](#core-applications)
  - [Accounts](#accounts)
  - [Categories](#categories)
  - [Courses](#courses)
  - [Enrollments](#enrollments)
  - [Progress](#progress)
  - [Quizzes](#quizzes)
  - [Assignments](#assignments)
  - [Reviews](#reviews)
- [Authentication & Authorization](#authentication--authorization)
- [Access Control Logic](#access-control-logic)
- [Testing](#testing)
- [Deployment](#deployment)

## 🎯 Overview

This backend provides a complete REST API for an online learning platform with the following features:

- **User Management**: Multi-role authentication (Learner, Instructor, Admin)
- **Course Management**: Create, publish, and manage courses with sections and lessons
- **Category System**: Hierarchical category organization
- **Enrollment System**: Track learner enrollments with status management
- **Access Control**: Lesson access based on enrollment status and free preview settings
- **Email Verification**: Secure email verification for new accounts
- **Password Reset**: Secure password reset functionality
- **Google OAuth**: Social authentication via Google
- **JWT Authentication**: Token-based authentication with refresh tokens
- **Progress Tracking**: Track learner progress through courses and lessons
- **Quizzes**: Create, take, submit, and review quizzes
- **Assignments**: Create assignments, submit work, and grade submissions
- **Reviews**: Rate and review courses

## 🛠 Tech Stack

- **Backend**: Django and Django REST Framework
- **Frontend**: React 18 with Vite
- **API Framework**: Django REST Framework
- **Authentication**: JWT (djangorestframework_simplejwt 5.5.1)
- **API Documentation**: drf-spectacular 0.30.0 (OpenAPI 3.0)
- **Database**: PostgreSQL (via psycopg 3.2.3)
- **Task Queue**: Celery 5.6.3 with Redis
- **Email**: Gmail SMTP
- **Social Auth**: django-allauth 65.19.0 (Google OAuth)
- **Frontend Styling**: Tailwind CSS
- **HTTP Client**: Axios

## 📁 Project Structure

```
repository-root/
├── backend/
│   ├── apps/
│   │   ├── accounts/      # Users, profiles, authentication, and verification
│   │   ├── assignments/   # Assignments, submissions, and grading
│   │   ├── categories/    # Course categories
│   │   ├── courses/       # Courses, sections, and lessons
│   │   ├── enrollments/   # Enrollments and lesson access control
│   │   ├── progress/      # Learner course and lesson progress
│   │   ├── quizzes/       # Quizzes, questions, attempts, and results
│   │   └── reviews/       # Course ratings and reviews
│   ├── config/
│   │   ├── settings/      # Base, development, and production settings
│   │   ├── urls.py        # Admin, API, OAuth, and documentation routes
│   │   ├── asgi.py
│   │   ├── celery.py
│   │   └── wsgi.py
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # Shared, learner, and instructor UI
│   │   ├── contexts/      # React context providers
│   │   ├── layouts/       # Application layouts
│   │   ├── pages/         # Route-level screens
│   │   ├── routes/        # Frontend route definitions
│   │   └── services/      # API clients and frontend services
│   ├── package.json
│   └── vite.config.js
├── media/                 # Uploaded profile and course media
├── courses/thumbnails/    # Course thumbnail assets
└── sent_emails/           # Development email output
```

## 🚀 Setup Instructions

### Prerequisites

- Python 3.12+
- PostgreSQL database
- Redis server (for Celery)
- Gmail account (for email services)

### Installation Steps

1. **Install backend dependencies**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

2. **Configure environment variables**
```bash
copy .env.example .env  # Windows
# cp .env.example .env  # macOS/Linux
# Edit .env with your local configuration
```

3. **Run migrations and start the API**
```bash
python manage.py migrate
python manage.py runserver
```

4. **Install and start the frontend** (in a second terminal)
```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173/` and the API runs at `http://127.0.0.1:8000/`.

5. **Create an administrator** (optional)
```bash
cd backend
python manage.py createsuperuser
```

6. **Start Celery worker** (optional, for background tasks)
```bash
cd backend
celery -A config worker -l info
```

### Environment Variables

Required environment variables in `.env`:

```env
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True

# PostgreSQL Database
POSTGRES_DB=your-database-name
POSTGRES_USER=your-database-username
POSTGRES_PASSWORD=your-database-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=Online Learning Platform <your-gmail@gmail.com>

# Celery Configuration
CELERY_BROKER_URL=redis://127.0.0.1:6379/0
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/1

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/accounts/google/login/callback/

# Database URL (alternative to individual POSTGRES_* vars)
DATABASE_URL=postgresql://user:password@host:port/database
```

## 📚 API Documentation

The API documentation is available via Swagger UI at:

```
http://localhost:8000/api/docs/
```

The OpenAPI schema is available at:

```
http://localhost:8000/api/schema/
```

## 🏗 Core Applications

### Accounts

**Purpose**: User authentication, registration, and profile management

#### Models

- **User**: Custom user model with roles (LEARNER, INSTRUCTOR, ADMIN)
- **LearnerProfile**: Extended profile for learners
- **InstructorProfile**: Extended profile for instructors
- **EmailVerificationToken**: Tokens for email verification
- **PasswordResetToken**: Tokens for password reset

#### Key Features

- Multi-role authentication system
- Email verification required for learners and instructors
- Admin login without email verification
- Google OAuth integration
- JWT token authentication with refresh tokens
- Profile management for learners and instructors

#### API Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/api/accounts/register/` | Register new user | No |
| POST | `/api/accounts/login/` | Login with email/password | No |
| POST | `/api/accounts/admin/login/` | Admin login (no email verification) | No |
| POST | `/api/accounts/google/` | Login or sign up with Google OAuth | No |
| POST | `/api/accounts/logout/` | Logout and blacklist token | Yes |
| GET | `/api/accounts/me/` | Get current user info | Yes |
| GET/PATCH | `/api/accounts/profile/` | Get or update user profile | Yes |
| POST | `/api/accounts/verify-email/` | Verify email address | No |
| POST | `/api/accounts/resend-verification/` | Resend verification email | No |
| POST | `/api/accounts/password-reset/` | Request password reset | No |
| POST | `/api/accounts/password-reset-confirm/` | Confirm password reset | No |

#### Email Verification Flow

Public registration creates an email verification token. Learners and instructors must verify their email before they can log in; administrator accounts are created separately with `createsuperuser`.

1. Register with `POST /api/accounts/register/` using the fields `email`, `first_name`, `last_name`, `role`, `password`, and `password_confirm`.
2. In development, open the newest email file in `backend/sent_emails/` and copy the complete token from the verification link.
3. Open the link in this format, or visit the page and paste the token manually:
   `http://localhost:5173/verify-email?token=YOUR_TOKEN`
4. The frontend submits the token to `POST /api/accounts/verify-email/`:

```json
{
  "token": "YOUR_TOKEN"
}
```

5. After a successful `200 OK` response, log in through `POST /api/accounts/login/`.

Tokens are stored as hashes, expire after 24 hours, and can only be used once. To issue a new token, submit the account email to `POST /api/accounts/resend-verification/`:

```json
{
  "email": "learner@example.com"
}
```

#### User Roles

- **LEARNER**: Can enroll in courses, view lessons, manage profile
- **INSTRUCTOR**: Can create courses, manage sections and lessons, manage profile
- **ADMIN**: Full system access, can manage categories, view all data

---

### Categories

**Purpose**: Hierarchical category organization for courses

#### Models

- **Category**: Categories with parent-child relationships

#### Key Features

- Hierarchical category structure (parent-child relationships)
- Active/inactive status management
- Display order control
- Image support for categories
- Protected deletion (cannot delete if used by courses)

#### API Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/api/categories/` | List all active categories | No |
| POST | `/api/categories/` | Create new category | Admin only |
| GET | `/api/categories/{id}/` | Get category details | Yes |
| PATCH | `/api/categories/{id}/` | Update category | Admin only |
| DELETE | `/api/categories/{id}/` | Delete category | Admin only |

#### Category Fields

- `name`: Category name (required)
- `slug`: URL-friendly identifier (auto-generated)
- `description`: Category description
- `parent`: Parent category (for hierarchy)
- `image`: Category image
- `is_active`: Active status
- `display_order`: Display order for sorting

---

### Courses

**Purpose**: Course, section, and lesson management

#### Models

- **Course**: Main course entity
- **CourseSection**: Sections within a course
- **Lesson**: Individual lessons within sections

#### Key Features

- Course lifecycle management (Draft → Published → Archived)
- Multi-section course structure
- Multiple lesson content types (Video, Article, Document, External)
- Free preview lesson support
- Course filtering and search
- Instructor ownership management
- Course publishing workflow

#### API Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/api/courses/` | List published courses (with filters) | No |
| POST | `/api/courses/` | Create new course | Instructor only |
| GET | `/api/courses/{id}/` | Get course details | No (published) / Yes (owner) |
| PATCH | `/api/courses/{id}/` | Update course | Owner/Admin only |
| DELETE | `/api/courses/{id}/` | Delete course | Owner/Admin only |
| POST | `/api/courses/{id}/publish/` | Publish course | Owner/Admin only |
| POST | `/api/courses/{id}/archive/` | Archive course | Owner/Admin only |
| GET | `/api/courses/{id}/curriculum/` | Get course curriculum | No |
| GET | `/api/courses/{course_id}/sections/` | List course sections | Yes |
| POST | `/api/courses/{course_id}/sections/` | Create section | Owner/Admin only |
| GET | `/api/courses/sections/{id}/` | Get section details | Yes |
| PATCH | `/api/courses/sections/{id}/` | Update section | Owner/Admin only |
| DELETE | `/api/courses/sections/{id}/` | Delete section | Owner/Admin only |
| GET | `/api/courses/sections/{section_id}/lessons/` | List lessons | Yes |
| POST | `/api/courses/sections/{section_id}/lessons/` | Create lesson | Owner/Admin only |
| GET | `/api/courses/lessons/{id}/` | Get lesson details | Yes |
| PATCH | `/api/courses/lessons/{id}/` | Update lesson | Owner/Admin only |
| DELETE | `/api/courses/lessons/{id}/` | Delete lesson | Owner/Admin only |

#### Course Status

- **DRAFT**: Course in development (not public)
- **PUBLISHED**: Course live and available to learners
- **ARCHIVED**: Course no longer available for new enrollments

#### Course Filters

- `search`: Search by title or description
- `category`: Filter by category ID
- `category_slug`: Filter by category slug
- `level`: Filter by level (BEGINNER, INTERMEDIATE, ADVANCED)
- `language`: Filter by language
- `is_free`: Filter by free/paid status

#### Lesson Content Types

- **VIDEO**: Video lesson (requires `video_url`)
- **ARTICLE**: Text-based lesson (requires `article_content`)
- **DOCUMENT**: Document upload (requires `document` file)
- **EXTERNAL**: External resource (requires `external_url`)

---

### Enrollments

**Purpose**: Enrollment tracking and lesson access control

#### Models

- **Enrollment**: Links learners to courses with status tracking

#### Key Features

- Enrollment status management (ACTIVE, COMPLETED, CANCELLED)
- Lesson access control based on enrollment
- Free preview lesson support
- Re-enrollment for cancelled courses
- Access control for completed learners

#### API Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/api/enrollments/` | Enroll in a course | Learner only |
| GET | `/api/enrollments/my/` | List my enrollments | Learner only |
| GET | `/api/enrollments/lessons/{id}/` | Access lesson with access control | No (with enrollment check) |

#### Enrollment Status

- **ACTIVE**: Currently enrolled, full access
- **COMPLETED**: Course finished, retains access for review
- **CANCELLED**: Enrollment cancelled, no access

#### Access Control Logic

The enrollment app implements sophisticated access control for lessons:

1. **Free Preview Lessons**: Accessible without enrollment
2. **Private Lessons**: Require enrollment with ACTIVE or COMPLETED status
3. **Admin/Instructor**: Always have access to all lessons
4. **Cancelled Enrollment**: No access to private lessons

#### Access Control Rules

```python
# Free preview lessons
if lesson.is_free_preview:
    return True  # Access granted

# Private lessons - check enrollment
return has_course_access(user=user, course=course)

# Course access includes:
- ACTIVE enrollment → Access ✅
- COMPLETED enrollment → Access ✅ (for review/certificates)
- CANCELLED enrollment → Access ❌
- Admin/Instructor → Access ✅ (always)
```

#### Enrollment Creation Rules

- Only learners can enroll
- Only published courses can be enrolled in
- Cannot enroll if already enrolled (unless re-enrolling cancelled course)
- Cancelled enrollments can be reactivated

### Progress

Tracks lesson starts, lesson completion, personal progress, and progress for a specific course.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/progress/lessons/{lesson_id}/start/` | Start lesson progress |
| POST | `/api/progress/lessons/{lesson_id}/complete/` | Mark a lesson complete |
| GET | `/api/progress/my/` | List the current learner's progress |
| GET | `/api/progress/courses/{course_id}/` | Get progress for a course |

### Quizzes

Provides quiz creation and management, question handling, attempts, submissions, and results at `/api/quizzes/`.

### Assignments

Provides assignment creation and management, learner submissions, and instructor grading at `/api/assignments/assignments/` and `/api/assignments/submissions/`.

### Reviews

Provides course reviews and ratings at `/api/reviews/reviews/`.

## 🔐 Authentication & Authorization

### JWT Authentication

The API uses JWT (JSON Web Tokens) for authentication:

- **Access Token**: Short-lived token (15 minutes) for API requests
- **Refresh Token**: Long-lived token (7 days) for obtaining new access tokens
- **Token Blacklisting**: Refresh tokens are blacklisted on logout

### Authentication Flow

1. **Register**: Create account via `/api/accounts/register/`
2. **Verify Email**: Verify email via `/api/accounts/verify-email/`
3. **Login**: Get tokens via `/api/accounts/login/`
4. **Access API**: Include access token in Authorization header
5. **Refresh**: Use refresh token to get new access token
6. **Logout**: Blacklist refresh token via `/api/accounts/logout/`

### Authorization

- **Role-based**: Different permissions for LEARNER, INSTRUCTOR, ADMIN
- **Resource-based**: Owners can only modify their own resources
- **Status-based**: Only published courses are publicly accessible

## 🎓 Access Control Logic

### Lesson Access Control

The enrollment app implements a robust access control system for lessons:

#### Access Decision Tree

```
Lesson Request
    ↓
Is lesson published in a published course?
    ↓ No → 404 Not Found
    ↓ Yes
Is lesson a free preview?
    ↓ Yes → 200 OK (Access granted)
    ↓ No
Is user authenticated?
    ↓ No → 403 Forbidden
    ↓ Yes
Is user Admin or Instructor?
    ↓ Yes → 200 OK (Access granted)
    ↓ No
Does user have ACTIVE or COMPLETED enrollment?
    ↓ Yes → 200 OK (Access granted)
    ↓ No → 403 Forbidden
```

#### Enrollment Status Impact

| Status | Access to Lessons | Reason |
|--------|------------------|---------|
| ACTIVE | ✅ Full access | Currently enrolled |
| COMPLETED | ✅ Full access | For review and certificates |
| CANCELLED | ❌ No access | Enrollment terminated |

#### Free Preview Logic

- Lessons marked as `is_free_preview: true` are accessible without authentication
- This allows potential learners to preview course content before enrolling
- Free preview lessons bypass all enrollment checks

## 🧪 Testing

### Running Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.accounts
python manage.py test apps.courses
python manage.py test apps.categories
python manage.py test apps.enrollments

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Manual Testing

#### Test Lesson Access Control

```bash
# 1. Start server
python manage.py runserver

# 2. Test free preview (no auth)
curl http://127.0.0.1:8000/api/enrollments/lessons/{lesson_id}/
# Expected: 200 OK (if lesson is free preview)

# 3. Test private lesson (no auth)
curl http://127.0.0.1:8000/api/enrollments/lessons/{lesson_id}/
# Expected: 403 Forbidden

# 4. Test with enrollment
# First, register and login to get token
curl -X POST http://127.0.0.1:8000/api/accounts/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","first_name":"Test","last_name":"User","password":"TestPass123","password_confirm":"TestPass123","role":"LEARNER"}'

# In development, copy the token from the newest file in backend/sent_emails/.
# Verify the account before logging in.
curl -X POST http://127.0.0.1:8000/api/accounts/verify-email/ \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_VERIFICATION_TOKEN"}'

# Login after verification
curl -X POST http://127.0.0.1:8000/api/accounts/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# Enroll in course
curl -X POST http://127.0.0.1:8000/api/enrollments/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"course": 3}'

# Access lesson
curl http://127.0.0.1:8000/api/enrollments/lessons/{lesson_id}/ \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: 200 OK
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `DJANGO_DEBUG=False` in production settings
- [ ] Use strong `DJANGO_SECRET_KEY`
- [ ] Configure production database
- [ ] Set up production Redis server
- [ ] Configure production email service
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for production frontend
- [ ] Set up Celery with production broker
- [ ] Configure static files serving
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Production Settings

```python
# config/settings/production.py
DEBUG = False
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
ALLOWED_HOSTS = ['your-domain.com']

# Database
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL')
    )
}

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

### Deployment Commands

```bash
# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate

# Start Gunicorn server
gunicorn config.wsgi:application --bind 0.0.0.0:8000

# Start Celery worker
celery -A config worker -l info
```

## 📝 API Response Formats

### Success Response

```json
{
  "id": 1,
  "field": "value",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Error Response

```json
{
  "detail": "Error message description"
}
```

### Login Response

```json
{
  "message": "Login successful.",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "LEARNER",
    "email_verified": true
  },
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Migration Errors**
   ```bash
   python manage.py migrate --fake-initial
   ```

2. **Celery Connection Issues**
   ```bash
   # Check Redis is running
   redis-cli ping
   # Should return PONG
   ```

3. **Email Not Sending**
   - Check Gmail app password is correct
   - Ensure less secure apps is enabled or use app-specific password
   - Check firewall settings

4. **CORS Issues**
   - Add frontend URL to `CORS_ALLOWED_ORIGINS` in settings
   - Ensure `corsheaders.middleware.CorsMiddleware` is first in MIDDLEWARE

## 📞 Support

For issues and questions:
- Check API documentation at `/api/docs/`
- Review Django logs for detailed error messages
- Check Celery logs for background task issues

## 📄 License

[Your License Here]

## 👥 Contributors

[Your Team Here]
