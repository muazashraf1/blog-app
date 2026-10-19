from rest_framework import generics, status, permissions

from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .serializers import (
    UserSerializer,
    UserRegisterSerializer,
    CustomTokenObtainPairSerializer,
    AdminUserUpdateSerializer
)
from .permissions import IsAdminUserRole

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    POST /api/v1/auth/register/
    Public endpoint: Allows visitors to register with email, username, and password.
    Default role assigned is 'reader'.
    """
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "User registered successfully.",
                "user": UserSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )


class CustomLoginView(TokenObtainPairView):
    """
    POST /api/v1/auth/login/
    Public endpoint: Returns JWT access & refresh tokens along with user profile.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class CurrentUserView(APIView):
    """
    GET /api/v1/auth/me/
    Authenticated endpoint: Returns details of the currently logged-in user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserListView(generics.ListAPIView):
    """
    GET /api/v1/admin/users/
    Admin-only endpoint: Lists all registered users in the platform.
    """
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]


class AdminUserDetailView(generics.UpdateAPIView):
    """
    PATCH /api/v1/admin/users/{id}/
    Admin-only endpoint: Change user role (e.g., promote to 'author') or toggle is_active.
    """
    queryset = User.objects.all()
    serializer_class = AdminUserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]
    http_method_names = ['patch', 'head', 'options']

    def patch(self, request, *args, **kwargs):
        user_to_update = self.get_object()
        serializer = self.get_serializer(user_to_update, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                "message": f"User {user_to_update.username} updated successfully.",
                "user": UserSerializer(user_to_update).data
            },
            status=status.HTTP_200_OK
        )
