from rest_framework import permissions


class IsAdminUserRole(permissions.BasePermission):
    """
    Allows access only to users with the 'admin' role.
    Used for user management, category CRUD, and global comment moderation.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'admin' or request.user.is_superuser)
        )


class IsAuthorOrAdmin(permissions.BasePermission):
    """
    Allows access to Authors and Admins.
    Readers are blocked (403 Forbidden) from creating posts.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['author', 'admin']
        )


class IsPostOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission:
    - Safe methods (GET, HEAD, OPTIONS): Anyone if post is published.
    - Write methods (PATCH, DELETE, Publish, Unpublish): Only Post Author or Admin.
    """
    def has_object_permission(self, request, view, obj):
        # Published posts can be viewed by anyone
        if request.method in permissions.SAFE_METHODS:
            if obj.status == 'published':
                return True
            # Draft posts can only be viewed by author or admin
            return bool(
                request.user and 
                request.user.is_authenticated and 
                (obj.author == request.user or request.user.role == 'admin')
            )

        # Write operations strictly restricted to Author or Admin
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (obj.author == request.user or request.user.role == 'admin')
        )


class IsCommentOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission for Comments:
    - Safe methods: Public
    - Edit (PATCH): Only the comment creator
    - Delete (DELETE): Comment creator OR Admin (moderation)
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        # Only comment owner can edit
        if request.method in ['PUT', 'PATCH']:
            return bool(request.user and request.user.is_authenticated and obj.user == request.user)

        # Both comment owner and Admin can delete
        if request.method == 'DELETE':
            return bool(
                request.user and 
                request.user.is_authenticated and 
                (obj.user == request.user or request.user.role == 'admin')
            )

        return False
