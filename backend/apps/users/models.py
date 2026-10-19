from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone



class UserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifier for auth
    instead of usernames.
    """
    def create_user(self, email, username, password=None, role='reader', **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not username:
            raise ValueError('The Username field must be set')

        email = self.normalize_email(email)
        user = self.model(email=email, username=username, role=role, **extra_fields)
        user.set_password(password)  # Hashes the password securely with PBKDF2/Argon2
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('role') != 'admin':
            raise ValueError('Superuser must have role=admin.')

        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model matching FalconXoft Blog requirements:
    Roles:
      - reader: Can view posts, search, write & manage own comments (default).
      - author: Can create/edit/delete/publish/unpublish own posts.
      - admin: Full control over posts, comments, categories, and user roles.
    """
    ROLE_READER = 'reader'
    ROLE_AUTHOR = 'author'
    ROLE_ADMIN = 'admin'

    ROLE_CHOICES = (
        (ROLE_READER, 'Reader'),
        (ROLE_AUTHOR, 'Author'),
        (ROLE_ADMIN, 'Admin'),
    )

    email = models.EmailField(max_length=254, unique=True, db_index=True)
    username = models.CharField(max_length=50, unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_READER)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    # Login with email
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_reader(self):
        return self.role == self.ROLE_READER

    @property
    def is_author(self):
        return self.role == self.ROLE_AUTHOR

    @property
    def is_admin(self):
        return self.role == self.ROLE_ADMIN or self.is_superuser
