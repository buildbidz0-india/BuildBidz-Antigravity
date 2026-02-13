import cloudinary
import cloudinary.uploader
from app.config import settings

def init_cloudinary():
    """Initialize Cloudinary with credentials from settings."""
    if all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True
        )
        print("Cloudinary initialized successfully.")
    else:
        print("Cloudinary credentials missing. Asset uploads may not work.")

def upload_image(file_path: str, folder: str = "buildbidz"):
    """Example helper to upload an image to Cloudinary."""
    return cloudinary.uploader.upload(file_path, folder=folder)
