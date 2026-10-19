from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator, MaxLengthValidator
from apps.blog.models import Post


class Comment(models.Model):
    """
    Comment model matching FalconXoft Blog specs:
    - post_id: FK to Post, ON DELETE CASCADE
    - user_id: FK to User, ON DELETE CASCADE
    - body: TEXT, 1 to 1000 characters
    - Index on (post_id, created_at) for fast chronological retrieval
    """
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    body = models.TextField(
        validators=[
            MinLengthValidator(1, message="Comment cannot be empty."),
            MaxLengthValidator(1000, message="Comment cannot exceed 1000 characters.")
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'comments'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', 'created_at'], name='idx_comments_post_created'),
        ]

    def __str__(self):
        return f"Comment by {self.user.username} on {self.post.title}"
