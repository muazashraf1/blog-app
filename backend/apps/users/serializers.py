from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Publicly safe representation of a User.
    Never exposes password_hash.
    """
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'role', 'is_active', 'created_at']


class UserRegisterSerializer(serializers.ModelSerializer):
    """
    Handles user registration:
    - Validates email and username uniqueness
    - Enforces Django's strong password validation
    - Automatically sets role to 'reader'
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'password_confirm']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            role=User.ROLE_READER  # Default role is always reader
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Customizes JWT payload to embed essential user information:
    - user_id, email, username, role
    This avoids frequent /me calls from Next.js.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Custom claims added to the JWT
        token['email'] = user.email
        token['username'] = user.username
        token['role'] = user.role

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Include user details directly in login response body
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'role': self.user.role,
        }
        return data


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """
    Used exclusively by Admin to change user roles or deactivate accounts.
    """
    class Meta:
        model = User
        fields = ['role', 'is_active']

    def validate_role(self, value):
        if value not in [User.ROLE_READER, User.ROLE_AUTHOR, User.ROLE_ADMIN]:
            raise serializers.ValidationError("Invalid role provided.")
        return value
