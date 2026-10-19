import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def reader_user(db):
    return User.objects.create_user(
        email="reader@example.com",
        username="testreader",
        password="StrongPassword123!",
        role="reader"
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        email="admin@example.com",
        username="siteadmin",
        password="AdminPassword123!",
    )


@pytest.mark.django_db
class TestAuthenticationAndRoles:

    # --- POSITIVE TEST CASES ---
    def test_tc01_user_registration_success(self, api_client):
        """TC-01: Verify a visitor can successfully register (AC1)"""
        payload = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!"
        }
        response = api_client.post("/api/v1/auth/register/", payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["user"]["email"] == "newuser@example.com"
        assert response.data["user"]["role"] == "reader"  # Default role is reader

    def test_tc02_user_login_success(self, api_client, reader_user):
        """TC-02: Verify registered user can login and receive JWT tokens with claims (AC1)"""
        payload = {
            "email": "reader@example.com",
            "password": "StrongPassword123!"
        }
        response = api_client.post("/api/v1/auth/login/", payload)
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["user"]["role"] == "reader"

    def test_tc03_get_current_user_profile(self, api_client, reader_user):
        """TC-03: Verify authenticated user can fetch their profile via /auth/me/"""
        api_client.force_authenticate(user=reader_user)
        response = api_client.get("/api/v1/auth/me/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == reader_user.email
        assert response.data["role"] == "reader"

    # --- NEGATIVE TEST CASES ---
    def test_tc04_register_duplicate_email_fails(self, api_client, reader_user):
        """TC-04: Duplicate email registration returns 400 Bad Request (AC8)"""
        payload = {
            "email": "reader@example.com",  # Duplicate
            "username": "anothername",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!"
        }
        response = api_client.post("/api/v1/auth/register/", payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data

    def test_tc05_register_password_mismatch_fails(self, api_client):
        """TC-05: Non-matching passwords fail with 400 Bad Request"""
        payload = {
            "email": "mismatch@example.com",
            "username": "mismatchuser",
            "password": "StrongPassword123!",
            "password_confirm": "DifferentPassword456!"
        }
        response = api_client.post("/api/v1/auth/register/", payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_tc06_login_wrong_password_fails(self, api_client, reader_user):
        """TC-06: Wrong password returns 401 Unauthorized (AC8)"""
        payload = {
            "email": "reader@example.com",
            "password": "WrongPassword999!"
        }
        response = api_client.post("/api/v1/auth/login/", payload)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_tc07_unauthenticated_cannot_access_profile(self, api_client):
        """TC-07: Unauthenticated request to /auth/me/ returns 401 Unauthorized"""
        response = api_client.get("/api/v1/auth/me/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # --- RBAC & ROLE PROMOTION TEST CASES ---
    def test_tc08_reader_cannot_access_admin_users_list(self, api_client, reader_user):
        """TC-08: Reader attempting to access admin route receives 403 Forbidden (AC5)"""
        api_client.force_authenticate(user=reader_user)
        response = api_client.get("/api/v1/admin/users/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_tc09_admin_can_access_users_list(self, api_client, admin_user):
        """TC-09: Admin can successfully list all users (AC5)"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get("/api/v1/admin/users/")
        assert response.status_code == status.HTTP_200_OK

    def test_tc10_admin_promotes_reader_to_author(self, api_client, admin_user, reader_user):
        """TC-10: Admin promotes Reader to Author role (End-to-End Journey Step 2)"""
        api_client.force_authenticate(user=admin_user)
        payload = {"role": "author"}
        response = api_client.patch(f"/api/v1/admin/users/{reader_user.id}/", payload)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["user"]["role"] == "author"
        reader_user.refresh_from_db()
        assert reader_user.role == "author"

    def test_tc11_non_admin_cannot_promote_role(self, api_client, reader_user):
        """TC-11: Normal user cannot promote roles (returns 403 Forbidden)"""
        api_client.force_authenticate(user=reader_user)
        payload = {"role": "author"}
        response = api_client.patch(f"/api/v1/admin/users/{reader_user.id}/", payload)
        assert response.status_code == status.HTTP_403_FORBIDDEN
