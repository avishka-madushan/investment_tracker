"""
Local development settings.
"""
from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

# Use simpler static file storage in development
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

