"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/lib/auth/auth-context";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <AppShell>
                {children}
            </AppShell>
        </ProtectedRoute>
    );
}
