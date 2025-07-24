"""
Settings de production pour Railway
"""
from .settings import *
import dj_database_url
import os

# Security
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY', SECRET_KEY)

# Hosts autorisés
ALLOWED_HOSTS = [
    '.railway.app',
    'localhost',
    '127.0.0.1',
]

# Database PostgreSQL depuis DATABASE_URL
DATABASES['default'] = dj_database_url.config(
    default='sqlite:///db.sqlite3',  # Fallback sur SQLite si pas de DATABASE_URL
    conn_max_age=600,
    conn_health_checks=True,
)

# Security settings pour production
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Static files avec WhiteNoise
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Force la collecte des static files
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Logging en production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
    },
}

# CORS si nécessaire (à décommenter si vous utilisez une app frontend séparée)
# CORS_ALLOWED_ORIGINS = [
#     "https://votre-frontend.com",
# ]

# Email configuration (optionnel)
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = os.environ.get('EMAIL_HOST', '')
# EMAIL_PORT = os.environ.get('EMAIL_PORT', 587)
# EMAIL_USE_TLS = True
# EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
# EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')

print("🚀 Settings de production chargés pour Railway")