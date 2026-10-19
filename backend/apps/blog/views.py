from rest_framework import generics, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, NotFound
from django.db.models import Q
from django.utils import timezone

from .models import Category, Post
from .serializers import (
    CategorySerializer,
    PostListSerializer,
    PostDetailSerializer,
    PostCreateUpdateSerializer
)

from apps.users.permissions import (
    IsAdminUserRole,
    IsAuthorOrAdmin,
    IsPostOwnerOrAdmin
)


# ==============================================================================
# CATEGORY VIEWS
# ==============================================================================

class CategoryListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/categories/      -> Public (List all categories)
    POST /api/v1/categories/      -> Admin only (Create category)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsAdminUserRole()]
        return [permissions.AllowAny()]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    PATCH  /api/v1/categories/{id}/ -> Admin only (Update category)
    DELETE /api/v1/categories/{id}/ -> Admin only (Delete category)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']


# ==============================================================================
# POST VIEWS
# ==============================================================================

class PostListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/posts/ -> Public feed of published posts (?search= & ?category= & ?page=)
    POST /api/v1/posts/ -> Author or Admin only (Create draft post)
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsAuthorOrAdmin()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PostCreateUpdateSerializer
        return PostListSerializer

    def get_queryset(self):
        # Public feed only returns PUBLISHED posts (AC3 & AC7)
        queryset = Post.objects.filter(status=Post.STATUS_PUBLISHED).select_related('author', 'category')
        
        # 1. Filter by category slug if provided: ?category=tech
        category_slug = self.request.query_params.get('category', None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        # 2. Full-text search across Title and Markdown Body: ?search=django
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) | Q(body__icontains=search_query)
            )

        return queryset

    def perform_create(self, serializer):
        # Automatically assign logged-in user as author; status defaults to draft
        serializer.save(author=self.request.user, status=Post.STATUS_DRAFT)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/posts/{slug}/ -> Public if published; Author/Admin if draft (AC2, AC3)
    PATCH  /api/v1/posts/{slug}/ -> Post Author or Admin only (AC4)
    DELETE /api/v1/posts/{slug}/ -> Post Author or Admin only
    """
    queryset = Post.objects.all().select_related('author', 'category')
    lookup_field = 'slug'
    lookup_url_kwarg = 'slug'
    permission_classes = [IsPostOwnerOrAdmin]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PostCreateUpdateSerializer
        return PostDetailSerializer

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        from django.shortcuts import get_object_or_404
        obj = get_object_or_404(queryset, **filter_kwargs)

        # Security (AC2): If post is draft and requester is NOT author or admin, return 404 (Hide existence)
        if obj.status == Post.STATUS_DRAFT:
            user = self.request.user
            if not user.is_authenticated or (obj.author != user and getattr(user, 'role', None) != 'admin'):
                raise NotFound("Post not found.")

        self.check_object_permissions(self.request, obj)
        return obj



class PostPublishView(APIView):
    """
    POST /api/v1/posts/{slug}/publish/
    Author or Admin: Moves post from draft to published, sets published_at timestamp.
    """
    permission_classes = [permissions.IsAuthenticated, IsPostOwnerOrAdmin]

    def post(self, request, slug):
        try:
            post = Post.objects.get(slug=slug)
        except Post.DoesNotExist:
            raise NotFound("Post not found.")

        self.check_object_permissions(request, post)

        post.status = Post.STATUS_PUBLISHED
        post.published_at = timezone.now()
        post.save()

        return Response(
            {
                "message": f"Post '{post.title}' published successfully.",
                "post": PostDetailSerializer(post).data
            },
            status=status.HTTP_200_OK
        )


class PostUnpublishView(APIView):
    """
    POST /api/v1/posts/{slug}/unpublish/
    Author or Admin: Moves post from published back to draft.
    """
    permission_classes = [permissions.IsAuthenticated, IsPostOwnerOrAdmin]

    def post(self, request, slug):
        try:
            post = Post.objects.get(slug=slug)
        except Post.DoesNotExist:
            raise NotFound("Post not found.")

        self.check_object_permissions(request, post)

        post.status = Post.STATUS_DRAFT
        post.published_at = None
        post.save()

        return Response(
            {
                "message": f"Post '{post.title}' unpublished back to draft.",
                "post": PostDetailSerializer(post).data
            },
            status=status.HTTP_200_OK
        )


class MyPostsListView(generics.ListAPIView):
    """
    GET /api/v1/me/posts/
    Author/Admin only: Lists all posts (both drafts and published) authored by logged-in user.
    """
    serializer_class = PostListSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuthorOrAdmin]

    def get_queryset(self):
        return Post.objects.filter(author=self.request.user).select_related('author', 'category').order_by('-created_at')
