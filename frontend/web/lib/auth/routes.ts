/**
 * Public and protected route configuration.
 * - Public routes: accessible without authentication. No redirect to login.
 * - Protected routes: require authentication; unauthenticated users are redirected to login.
 */

/** Paths that are always public (no auth required, no redirect) */
export const PUBLIC_PATHS: string[] = [
    "/",
    "/login",
    "/signup",
    "/docs",
];

/** Path prefix for protected (dashboard) area. Only these trigger redirect to login when not authenticated. */
export const PROTECTED_PREFIX = "/dashboard";

export function isPublicPath(pathname: string | null | undefined): boolean {
    if (!pathname) return true;
    return PUBLIC_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );
}

export function isProtectedPath(pathname: string | null | undefined): boolean {
    if (!pathname) return false;
    return pathname.startsWith(PROTECTED_PREFIX);
}
