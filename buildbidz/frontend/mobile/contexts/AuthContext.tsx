// =============================================================================
// BuildBidz Mobile - Auth Context
// =============================================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    User,
    signInWithPhoneNumber,
    ConfirmationResult
} from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
// Note: In a real Expo app, you'd use getReactNativePersistence(SecureStore)
// auth.setPersistence(getReactNativePersistence(SecureStore));

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signInWithOTP: (phone: string) => Promise<{ error?: string }>;
    verifyOTP: (token: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    currentOrgId: string | null;
    setCurrentOrgId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    useEffect(() => {
        // Listen for auth changes
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setIsLoading(false);

            // Store token for API calls
            if (user) {
                const token = await user.getIdToken();
                await SecureStore.setItemAsync('auth_token', token);
            } else {
                await SecureStore.deleteItemAsync('auth_token');
            }
        });

        return () => unsubscribe();
    }, []);

    // Load saved org ID
    useEffect(() => {
        SecureStore.getItemAsync('current_org_id').then((id) => {
            if (id) setCurrentOrgId(id);
        });
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return {};
        } catch (error: any) {
            return { error: error.message };
        }
    };

    const signInWithOTP = async (phone: string) => {
        try {
            // Simplified for migration; Recaptcha handled by Firebase on mobile automatically usually
            // but might need additional setup in real environment
            // const result = await signInWithPhoneNumber(auth, phone, undefined);
            // setConfirmationResult(result);
            return { error: "Phone authentication requires native configuration" };
        } catch (error: any) {
            return { error: error.message };
        }
    };

    const verifyOTP = async (token: string) => {
        try {
            if (!confirmationResult) throw new Error("No pending confirmation");
            await confirmationResult.confirm(token);
            return {};
        } catch (error: any) {
            return { error: error.message };
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('last_sync_at');
    };

    const handleSetOrgId = async (id: string) => {
        setCurrentOrgId(id);
        await SecureStore.setItemAsync('current_org_id', id);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                signIn,
                signInWithOTP,
                verifyOTP,
                signOut,
                currentOrgId,
                setCurrentOrgId: handleSetOrgId,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
