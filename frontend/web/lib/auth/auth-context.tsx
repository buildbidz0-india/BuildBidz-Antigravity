// =============================================================================
// BuildBidz - Authentication Context & Hooks
// =============================================================================

"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase/config";
import { isPublicPath, isProtectedPath } from "@/lib/auth/routes";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    User,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult,
} from "firebase/auth";

// =============================================================================
// Types
// =============================================================================

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, metadata?: object) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithOtp: (phone: string) => Promise<void>;
    verifyOtp: (token: string) => Promise<void>;
}

interface AuthProviderProps {
    children: ReactNode;
}

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!auth) {
            setIsLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            setIsLoading(false);
            if (authUser) {
                router.refresh();
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Redirect to login only when on a protected route and not signed in. Never redirect on public routes (/, /login, /signup, /docs).
    useEffect(() => {
        if (isLoading || user) return;
        if (isPublicPath(pathname)) return;
        if (isProtectedPath(pathname)) {
            router.push("/login");
        }
    }, [user, isLoading, pathname, router]);

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        if (!auth) throw new Error("Auth is not configured. Add Firebase keys to .env.");
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Sign in error:", error);
            throw error;
        }
    };

    // Sign up with email and password
    const signUp = async (
        email: string,
        password: string,
        metadata?: object
    ) => {
        if (!auth) throw new Error("Auth is not configured. Add Firebase keys to .env.");
        try {
            const { user } = await createUserWithEmailAndPassword(auth, email, password);
            // Metadata handling would go here, e.g., updating profile
            if (metadata) {
                // await updateProfile(user, { ... });
            }
        } catch (error) {
            console.error("Sign up error:", error);
            throw error;
        }
    };

    // Sign out
    const signOut = async () => {
        if (!auth) return;
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Sign out error:", error);
            throw error;
        }
    };

    // Sign in with OTP (for phone)
    const signInWithOtp = async (phone: string) => {
        if (!auth) throw new Error("Auth is not configured. Add Firebase keys to .env.");
        try {
            // Recaptcha verifier needs a container in the DOM
            // This is a simplified version; in a real app, you'd handle the widget
            const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible'
            });
            const result = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
            setConfirmationResult(result);
        } catch (error) {
            console.error("Phone sign in error:", error);
            throw error;
        }
    };

    // Verify OTP
    const verifyOtp = async (token: string) => {
        if (!auth) throw new Error("Auth is not configured. Add Firebase keys to .env.");
        try {
            if (!confirmationResult) {
                throw new Error("No pending confirmation found");
            }
            await confirmationResult.confirm(token);
        } catch (error) {
            console.error("OTP verification error:", error);
            throw error;
        }
    };

    const value = {
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithOtp,
        verifyOtp,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// =============================================================================
// Protected Route Component
// =============================================================================

interface ProtectedRouteProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) return;
        if (user) return;
        if (isPublicPath(pathname)) return;
        router.push("/login");
    }, [user, isLoading, pathname, router]);

    if (isLoading) {
        return (
            fallback || (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
            )
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}
