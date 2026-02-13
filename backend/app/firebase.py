# =============================================================================
# BuildBidz Python Backend - Firebase Admin Initialization
# =============================================================================

import firebase_admin
from firebase_admin import credentials, auth
import structlog
import asyncio
from app.config import settings

logger = structlog.get_logger()

def init_firebase():
    """Initialize Firebase Admin SDK."""
    if not firebase_admin._apps:
        try:
            if settings.FIREBASE_SERVICE_ACCOUNT_PATH:
                cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': settings.FIREBASE_STORAGE_BUCKET
                })
            else:
                # Use default credentials
                firebase_admin.initialize_app(options={
                    'storageBucket': settings.FIREBASE_STORAGE_BUCKET
                })
            logger.info("Firebase Admin initialized")
        except Exception as e:
            logger.error("Failed to initialize Firebase Admin", error=str(e))
            raise

def verify_firebase_token(token: str):
    """Verify Firebase ID token."""
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.warning("Invalid Firebase token", error=str(e))
        return None

def get_storage_bucket():
    """Get Firebase Storage bucket."""
    from firebase_admin import storage
    return storage.bucket()

async def download_firebase_file(storage_path: str) -> bytes:
    """Download file from Firebase Storage."""
    bucket = get_storage_bucket()
    blob = bucket.blob(storage_path)
    
    # Run sync download in thread pool
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, blob.download_as_bytes)
