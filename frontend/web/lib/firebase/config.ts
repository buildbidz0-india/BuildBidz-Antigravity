// =============================================================================
// BuildBidz - Firebase Client Configuration
// =============================================================================
// Firebase is initialized only in the browser so that build/prerender does not
// require valid API keys. Auth/db/storage are null during SSR or when keys are missing.
// =============================================================================

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function isClientAndConfigured(): boolean {
    if (typeof window === "undefined") return false;
    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    return !!key && key !== "your-api-key" && !key.startsWith("your-");
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isClientAndConfigured()) {
    try {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
    } catch {
        // Invalid config or network – leave null so app still loads
    }
}

export { auth };
export { db };
export { storage };
export default app;
