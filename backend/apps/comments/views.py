from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, PermissionDenied
from django.shortcuts import get_object_or_404

from apps.blog.models import Post
from .models import Comment
from .serializers import CommentSerializer, CommentCreateUpdateSerializer
from apps.users.permissions import IsCommentOwnerOrAdmin


class PostCommentsListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/posts/{slug}/comments/ -> Public (List comments for a post)
    POST /api/v1/posts/{slug}/comments/ -> Logged-in users (Reader, Author, Admin)
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CommentCreateUpdateSerializer
        return CommentSerializer

    def get_post(self):
        slug = self.kwargs.get('slug')
        post = get_object_or_404(Post, slug=slug)
        # If post is a draft, only its author or admin can view/comment
        if post.status == Post.STATUS_DRAFT:
            user = self.request.user
            if not user.is_authenticated or (post.author != user and user.role != 'admin'):
                raise NotFound("Post not found.")
        return post

    def get_queryset(self):
        post = self.get_post()
        return Comment.objects.filter(post=post).select_related('user').order_by('created_at')

    def perform_create(self, serializer):
        post = self.get_post()
        serializer.save(user=self.request.user, post=post)

    def create(self, request, *args, **kwargs):
        post = self.get_post()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(user=request.user, post=post)
        return Response(
            {
                "message": "Comment posted successfully.",
                "comment": CommentSerializer(comment, context={'request': request}).data
            },
            status=status.HTTP_201_CREATED
        )


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    PATCH  /api/v1/comments/{id}/ -> Comment Owner only
    DELETE /api/v1/comments/{id}/ -> Comment Owner OR Admin (moderation)
    """
    queryset = Comment.objects.all().select_related('user', 'post')
    permission_classes = [permissions.IsAuthenticated, IsCommentOwnerOrAdmin]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CommentCreateUpdateSerializer
        return CommentSerializer

    def patch(self, request, *args, **kwargs):
        comment = self.get_object()
        serializer = self.get_serializer(comment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_comment = serializer.save()
        return Response(
            {
                "message": "Comment updated successfully.",
                "comment": CommentSerializer(updated_comment, context={'request': request}).data
            },
            status=status.HTTP_200_OK
        )

    def delete(self, request, *args, **kwargs):
        comment = self.get_object()
        comment.delete()
        return Response(
            {"message": "Comment deleted successfully."},
            status=status.HTTP_200_OK
        )
