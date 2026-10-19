import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from apps.blog.models import Post
from apps.comments.models import Comment

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def author_user(db):
    return User.objects.create_user(
        email="author_c@example.com",
        username="author_c",
        password="Password123!",
        role="author"
    )


@pytest.fixture
def reader_user_1(db):
    return User.objects.create_user(
        email="reader1_c@example.com",
        username="reader1_c",
        password="Password123!",
        role="reader"
    )


@pytest.fixture
def reader_user_2(db):
    return User.objects.create_user(
        email="reader2_c@example.com",
        username="reader2_c",
        password="Password123!",
        role="reader"
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        email="admin_c@example.com",
        username="admin_c",
        password="AdminPassword123!",
    )


@pytest.fixture
def published_post(db, author_user):
    return Post.objects.create(
        author=author_user,
        title="Discussion Post",
        body="Leave your thoughts below.",
        status=Post.STATUS_PUBLISHED
    )


@pytest.fixture
def sample_comment(db, reader_user_1, published_post):
    return Comment.objects.create(
        post=published_post,
        user=reader_user_1,
        body="Great article! Really enjoyed reading it."
    )


@pytest.mark.django_db
class TestCommentsEngine:

    # --- POSITIVE COMMENT POSTING ---
    def test_tc27_reader_can_add_comment(self, api_client, reader_user_1, published_post):
        """TC-27: Logged-in reader can comment on published post (AC6)"""
        api_client.force_authenticate(user=reader_user_1)
        payload = {"body": "Insightful post, thanks for sharing!"}
        response = api_client.post(f"/api/v1/posts/{published_post.slug}/comments/", payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["comment"]["body"] == "Insightful post, thanks for sharing!"
        assert response.data["comment"]["user"]["username"] == reader_user_1.username

    # --- NEGATIVE PERMISSION TESTS ---
    def test_tc28_visitor_cannot_comment(self, api_client, published_post):
        """TC-28: Unauthenticated visitor receives 401 Unauthorized when commenting (AC6)"""
        payload = {"body": "Anonymous comment attempt"}
        response = api_client.post(f"/api/v1/posts/{published_post.slug}/comments/", payload)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_tc29_comment_empty_body_fails(self, api_client, reader_user_1, published_post):
        """TC-29: Empty comment body returns 400 Bad Request (AC8)"""
        api_client.force_authenticate(user=reader_user_1)
        payload = {"body": "   "}
        response = api_client.post(f"/api/v1/posts/{published_post.slug}/comments/", payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # --- EDIT & DELETE OWNERSHIP ---
    def test_tc30_owner_can_edit_comment(self, api_client, reader_user_1, sample_comment):
        """TC-30: Comment owner can edit their own comment (AC6)"""
        api_client.force_authenticate(user=reader_user_1)
        payload = {"body": "Updated comment text."}
        response = api_client.patch(f"/api/v1/comments/{sample_comment.id}/", payload)
        assert response.status_code == status.HTTP_200_OK
        sample_comment.refresh_from_db()
        assert sample_comment.body == "Updated comment text."

    def test_tc31_non_owner_cannot_edit_comment(self, api_client, reader_user_2, sample_comment):
        """TC-31: Non-owner receives 403 Forbidden when trying to edit someone else's comment"""
        api_client.force_authenticate(user=reader_user_2)
        payload = {"body": "Unauthorized edit attempt"}
        response = api_client.patch(f"/api/v1/comments/{sample_comment.id}/", payload)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_tc32_owner_can_delete_own_comment(self, api_client, reader_user_1, sample_comment):
        """TC-32: Comment owner can delete their own comment"""
        api_client.force_authenticate(user=reader_user_1)
        response = api_client.delete(f"/api/v1/comments/{sample_comment.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert not Comment.objects.filter(id=sample_comment.id).exists()

    # --- ADMIN MODERATION & CASCADE DELETION ---
    def test_tc33_admin_can_delete_inappropriate_comment(self, api_client, admin_user, sample_comment):
        """TC-33: Admin can delete any inappropriate comment (End-to-End Journey Step 8)"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.delete(f"/api/v1/comments/{sample_comment.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert not Comment.objects.filter(id=sample_comment.id).exists()

    def test_tc34_delete_post_cascades_comments(self, db, author_user, published_post, sample_comment):
        """TC-34: Deleting a post cascades and removes all associated comments (Data Integrity)"""
        comment_id = sample_comment.id
        published_post.delete()
        assert not Comment.objects.filter(id=comment_id).exists()
