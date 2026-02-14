import asyncio
import firebase_admin
from firebase_admin import auth, credentials
import sys
from pathlib import Path

# Add parent to path to import config
sys.path.insert(0, str(Path(__file__).parent.parent))
from app.config import settings

def create_admin_user():
    # Initialize Firebase Admin
    if not firebase_admin._apps:
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)

    email = "admin@buildbidz.com"
    password = "Test@123456"
    display_name = "BuildBidz Admin"

    try:
        # Check if user exists
        user = auth.get_user_by_email(email)
        print(f"User {email} already exists in Firebase Auth.")
    except auth.UserNotFoundError:
        # Create user
        user = auth.create_user(
            email=email,
            password=password,
            display_name=display_name,
            email_verified=True
        )
        print(f"Successfully created user {email} in Firebase Auth.")

    print("\n--- Admin Credentials ---")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print("-------------------------\n")

if __name__ == "__main__":
    create_admin_user()
