from django.urls import path
from .views import PostCommentsListCreateView, CommentDetailView

urlpatterns = [
    # List comments on a post and add comment
    path('posts/<slug:slug>/comments/', PostCommentsListCreateView.as_view(), name='post-comments'),

    # Edit (owner) and Delete (owner or admin)
    path('comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),
]
