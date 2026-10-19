from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.utils import timezone


class Category(models.Model):
    """
    Categories for blog posts.
    Admin creates/manages categories; Authors assign them to posts.
    """
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Post(models.Model):
    """
    Blog Post model supporting:
    - Draft & Published status lifecycle
    - Automatic unique slug generation (collision safe)
    - Single category per post
    - Optimized database indexes
    """
    STATUS_DRAFT = 'draft'
    STATUS_PUBLISHED = 'published'

    STATUS_CHOICES = (
        (STATUS_DRAFT, 'Draft'),
        (STATUS_PUBLISHED, 'Published'),
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,  # Prevents accidental deletion of author with active posts
        related_name='posts'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posts'
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    body = models.TextField(help_text="Markdown format content")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'posts'
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['slug'], name='idx_posts_slug'),
            models.Index(fields=['status', '-published_at'], name='idx_posts_status_published'),
            models.Index(fields=['author'], name='idx_posts_author'),
            models.Index(fields=['category'], name='idx_posts_category'),
        ]

    def save(self, *args, **kwargs):
        # Auto-generate unique slug with collision avoidance
        if not self.slug:
            base_slug = slugify(self.title) or "post"
            unique_slug = base_slug
            counter = 1
            while Post.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = unique_slug

        # Set published_at timestamp automatically
        if self.status == self.STATUS_PUBLISHED and not self.published_at:
            self.published_at = timezone.now()
        elif self.status == self.STATUS_DRAFT:
            self.published_at = None

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.status})"
