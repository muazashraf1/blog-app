"""
URL configuration for Blog Platform project.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Django Admin Panel
    path('admin/', admin.site.urls),

    # OpenAPI 3 Documentation Endpoints
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API v1 Modular Routes
    path('api/v1/', include('apps.users.urls')),
    path('api/v1/', include('apps.blog.urls')),
    path('api/v1/', include('apps.comments.urls')),

]
