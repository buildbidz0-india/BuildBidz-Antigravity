import asyncio
import firebase_admin
from firebase_admin import auth, credentials
import sys
from pathlib import Path
import asyncpg

# Add parent to path to import config
sys.path.insert(0, str(Path(__file__).parent.parent))
from app.config import settings

async def link_user_to_db():
    # Initialize Firebase Admin
    if not firebase_admin._apps:
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)

    email = "admin@buildbidz.com"
    
    try:
        # Get user from Firebase
        user = auth.get_user_by_email(email)
        uid = user.uid
        print(f"Found Firebase user {email} with UID: {uid}")
        
        # Connect to Postgres
        conn = await asyncpg.connect(str(settings.DATABASE_URL))
        try:
            # Check if user already exists in DB
            exists = await conn.fetchval("SELECT id FROM \"User\" WHERE id = $1", uid)
            if not exists:
                # Insert user into DB
                # Note: Table name might be case sensitive or quoted depending on how Data Connect/Postgres sees it
                # From schema.gql: type User @table -> usually creates "User" or user table.
                try:
                    await conn.execute("INSERT INTO \"User\" (id, username) VALUES ($1, $2)", uid, "admin")
                    print(f"Successfully inserted user {email} into PostgreSQL.")
                except Exception as e:
                    print(f"Error inserting into User table: {e}")
                    # Try lowercase if "User" fails
                    try:
                        await conn.execute("INSERT INTO user (id, username) VALUES ($1, $2)", uid, "admin")
                        print(f"Successfully inserted user {email} into postgresql (lowercase table).")
                    except Exception as e2:
                        print(f"Retry failed too: {e2}")
            else:
                print(f"User {uid} already exists in database.")
        finally:
            await conn.close()
            
    except auth.UserNotFoundError:
        print(f"Error: User {email} not found in Firebase Auth.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(link_user_to_db())
