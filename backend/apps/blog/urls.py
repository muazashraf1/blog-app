from django.urls import path
from .views import (
    CategoryListCreateView,
    CategoryDetailView,
    PostListCreateView,
    PostDetailView,
    PostPublishView,
    PostUnpublishView,
    MyPostsListView,
)

urlpatterns = [
    # Categories endpoints
    path('categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),

    # Author dashboard posts endpoint
    path('me/posts/', MyPostsListView.as_view(), name='my-posts-list'),

    # Post Publish/Unpublish specific actions
    path('posts/<slug:slug>/publish/', PostPublishView.as_view(), name='post-publish'),
    path('posts/<slug:slug>/unpublish/', PostUnpublishView.as_view(), name='post-unpublish'),

    # General Post endpoints
    path('posts/', PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<slug:slug>/', PostDetailView.as_view(), name='post-detail'),
]
