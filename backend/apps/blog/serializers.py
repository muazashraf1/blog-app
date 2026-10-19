from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Category, Post

User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Categories.
    Admin creates/updates them; anyone can read.
    """
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']
        read_only_fields = ['id', 'slug']


class AuthorSummarySerializer(serializers.ModelSerializer):
    """
    Minimal user details attached to posts (id and username).
    Keeps API responses clean and lightweight.
    """
    class Meta:
        model = User
        fields = ['id', 'username']


class PostListSerializer(serializers.ModelSerializer):
    """
    Optimized serializer for post feeds (Home page and dashboard lists).
    Includes author and category objects instead of just IDs.
    """
    author = AuthorSummarySerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    excerpt = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id',
            'title',
            'slug',
            'author',
            'category',
            'excerpt',
            'status',
            'published_at',
            'created_at'
        ]

    def get_excerpt(self, obj):
        # First 160 characters of markdown body as preview snippet
        if obj.body:
            return obj.body[:160] + ('...' if len(obj.body) > 160 else '')
        return ''


class PostDetailSerializer(serializers.ModelSerializer):
    """
    Full serializer for reading an individual post.
    Includes full markdown body.
    """
    author = AuthorSummarySerializer(read_only=True)
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Post
        fields = [
            'id',
            'title',
            'slug',
            'author',
            'category',
            'body',
            'status',
            'published_at',
            'created_at',
            'updated_at'
        ]


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and editing posts.
    Accepts category_id to associate a post with a category.
    """
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        required=False,
        allow_null=True
    )

    class Meta:
        model = Post
        fields = ['id', 'title', 'slug', 'body', 'category_id', 'status']
        read_only_fields = ['id', 'slug', 'status']  # Status changed via /publish/ or /unpublish/

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be blank.")
        if len(value) > 200:
            raise serializers.ValidationError("Title cannot exceed 200 characters.")
        return value.strip()

    def validate_body(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Post body cannot be blank.")
        return value
