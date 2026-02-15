"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/lib/auth/auth-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <ErrorBoundary>
                <AppShell>
                    {children}
                </AppShell>
            </ErrorBoundary>
        </ProtectedRoute>
    );
}
