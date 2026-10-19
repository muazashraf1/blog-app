from rest_framework import serializers
from .models import Comment
from apps.blog.serializers import AuthorSummarySerializer


class CommentSerializer(serializers.ModelSerializer):
    """
    Serializer for listing and reading comments on a post.
    """
    user = AuthorSummarySerializer(read_only=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'user', 'body', 'is_owner', 'created_at', 'updated_at']
        read_only_fields = ['id', 'post', 'user', 'is_owner', 'created_at', 'updated_at']

    def get_is_owner(self, obj):
        request = self.context.get('request', None)
        if request and request.user.is_authenticated:
            return obj.user_id == request.user.id
        return False


class CommentCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and editing comments.
    Enforces 1 to 1000 characters validation.
    """
    class Meta:
        model = Comment
        fields = ['id', 'body']

    def validate_body(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Comment body cannot be blank.")
        if len(value) > 1000:
            raise serializers.ValidationError("Comment cannot exceed 1000 characters.")
        return value.strip()
