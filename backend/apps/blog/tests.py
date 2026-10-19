import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from apps.blog.models import Category, Post

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        email="admin_blog@example.com",
        username="admin_blog",
        password="AdminPassword123!",
    )


@pytest.fixture
def author_user_1(db):
    return User.objects.create_user(
        email="author1@example.com",
        username="author1",
        password="Password123!",
        role="author"
    )


@pytest.fixture
def author_user_2(db):
    return User.objects.create_user(
        email="author2@example.com",
        username="author2",
        password="Password123!",
        role="author"
    )


@pytest.fixture
def reader_user(db):
    return User.objects.create_user(
        email="reader_blog@example.com",
        username="reader_blog",
        password="Password123!",
        role="reader"
    )


@pytest.fixture
def category_tech(db):
    return Category.objects.create(name="Technology", slug="technology")


@pytest.fixture
def category_design(db):
    return Category.objects.create(name="Design", slug="design")


@pytest.fixture
def published_post(db, author_user_1, category_tech):
    return Post.objects.create(
        author=author_user_1,
        category=category_tech,
        title="Django REST Architecture",
        body="Deep dive into clean architecture with Django and Python.",
        status=Post.STATUS_PUBLISHED
    )


@pytest.fixture
def draft_post(db, author_user_1, category_tech):
    return Post.objects.create(
        author=author_user_1,
        category=category_tech,
        title="Secret Draft Article",
        body="Draft content not meant for public eyes yet.",
        status=Post.STATUS_DRAFT
    )


@pytest.mark.django_db
class TestBlogPostsAndCategories:

    # --- CATEGORY TESTS ---
    def test_tc12_admin_can_create_category(self, api_client, admin_user):
        """TC-12: Admin can create new category (AC5)"""
        api_client.force_authenticate(user=admin_user)
        payload = {"name": "Artificial Intelligence"}
        response = api_client.post("/api/v1/categories/", payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["slug"] == "artificial-intelligence"

    def test_tc13_non_admin_cannot_create_category(self, api_client, author_user_1):
        """TC-13: Author or Reader cannot create category (returns 403 Forbidden) (AC5)"""
        api_client.force_authenticate(user=author_user_1)
        payload = {"name": "Hacking"}
        response = api_client.post("/api/v1/categories/", payload)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    # --- POST CREATION & RBAC TESTS ---
    def test_tc14_author_creates_draft_post(self, api_client, author_user_1, category_tech):
        """TC-14: Author creates post in Draft status with category (AC2)"""
        api_client.force_authenticate(user=author_user_1)
        payload = {
            "title": "Getting Started with Next.js",
            "body": "Next.js brings SSR to React applications.",
            "category_id": category_tech.id
        }
        response = api_client.post("/api/v1/posts/", payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["status"] == "draft"
        assert response.data["slug"] == "getting-started-with-nextjs"

    def test_tc15_reader_cannot_create_post(self, api_client, reader_user):
        """TC-15: Reader attempting to create post is denied with 403 Forbidden (AC4)"""
        api_client.force_authenticate(user=reader_user)
        payload = {
            "title": "Spam Article",
            "body": "Should be blocked"
        }
        response = api_client.post("/api/v1/posts/", payload)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_tc16_post_slug_collision_resolution(self, api_client, author_user_1):
        """TC-16: Duplicate titles generate unique sequential slugs (slug-1, slug-2)"""
        post1 = Post.objects.create(author=author_user_1, title="Hello World", body="Test")
        post2 = Post.objects.create(author=author_user_1, title="Hello World", body="Test")
        assert post1.slug == "hello-world"
        assert post2.slug == "hello-world-1"

    # --- PUBLISH & UNPUBLISH WORKFLOW ---
    def test_tc17_author_publishes_draft_post(self, api_client, author_user_1, draft_post):
        """TC-17: Author publishes draft post; status becomes published and published_at is set"""
        api_client.force_authenticate(user=author_user_1)
        response = api_client.post(f"/api/v1/posts/{draft_post.slug}/publish/")
        assert response.status_code == status.HTTP_200_OK
        draft_post.refresh_from_db()
        assert draft_post.status == Post.STATUS_PUBLISHED
        assert draft_post.published_at is not None

    def test_tc18_author_unpublishes_post(self, api_client, author_user_1, published_post):
        """TC-18: Author unpublishes post back to draft"""
        api_client.force_authenticate(user=author_user_1)
        response = api_client.post(f"/api/v1/posts/{published_post.slug}/unpublish/")
        assert response.status_code == status.HTTP_200_OK
        published_post.refresh_from_db()
        assert published_post.status == Post.STATUS_DRAFT
        assert published_post.published_at is None

    # --- FEED VISIBILITY & SEARCH ---
    def test_tc19_visitor_sees_published_posts_only(self, api_client, published_post, draft_post):
        """TC-19: Public feed contains published posts, hides drafts (AC2, AC3)"""
        response = api_client.get("/api/v1/posts/")
        assert response.status_code == status.HTTP_200_OK
        slugs = [p["slug"] for p in response.data["results"]]
        assert published_post.slug in slugs
        assert draft_post.slug not in slugs

    def test_tc20_visitor_draft_access_returns_404(self, api_client, draft_post):
        """TC-20: Unauthenticated access to draft returns 404 (Hides existence) (AC2)"""
        response = api_client.get(f"/api/v1/posts/{draft_post.slug}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_tc21_author_can_view_own_draft(self, api_client, author_user_1, draft_post):
        """TC-21: Author can view their own draft post"""
        api_client.force_authenticate(user=author_user_1)
        response = api_client.get(f"/api/v1/posts/{draft_post.slug}/")
        assert response.status_code == status.HTTP_200_OK

    def test_tc22_search_posts_by_keyword(self, api_client, published_post):
        """TC-22: Full-text search returns published posts matching keyword in body (AC7)"""
        response = api_client.get("/api/v1/posts/?search=Architecture")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["slug"] == published_post.slug

    def test_tc23_filter_posts_by_category(self, api_client, published_post, category_tech):
        """TC-23: Category filter returns matching posts only"""
        response = api_client.get(f"/api/v1/posts/?category={category_tech.slug}")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1

    # --- EDIT & DELETE OWNERSHIP PERMISSIONS ---
    def test_tc24_author_cannot_edit_other_authors_post(self, api_client, author_user_2, published_post):
        """TC-24: Author cannot edit another author's post (403 Forbidden) (AC4)"""
        api_client.force_authenticate(user=author_user_2)
        payload = {"title": "Malicious Hijack"}
        response = api_client.patch(f"/api/v1/posts/{published_post.slug}/", payload)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_tc25_admin_can_edit_any_post(self, api_client, admin_user, published_post):
        """TC-25: Admin can edit any post regardless of author"""
        api_client.force_authenticate(user=admin_user)
        payload = {"title": "Admin Edited Title"}
        response = api_client.patch(f"/api/v1/posts/{published_post.slug}/", payload)
        assert response.status_code == status.HTTP_200_OK
        published_post.refresh_from_db()
        assert published_post.title == "Admin Edited Title"

    def test_tc26_my_posts_returns_all_statuses(self, api_client, author_user_1, published_post, draft_post):
        """TC-26: /me/posts/ returns both published and draft posts for logged-in author"""
        api_client.force_authenticate(user=author_user_1)
        response = api_client.get("/api/v1/me/posts/")
        assert response.status_code == status.HTTP_200_OK
        slugs = [p["slug"] for p in response.data["results"]]
        assert published_post.slug in slugs
        assert draft_post.slug in slugs
