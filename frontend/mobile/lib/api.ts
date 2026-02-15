
import * as SecureStore from 'expo-secure-store';

// Default to Android Emulator localhost. 
// For physical device, change this to your machine's LAN IP (e.g., http://192.168.1.5:8000/api/v1)
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000/api/v1";

/** Get Authorization header using stored token */
async function getAuthHeaders(): Promise<Record<string, string>> {
    try {
        const token = await SecureStore.getItemAsync("auth_token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
        return {};
    }
}

/**
 * Retry fetch with exponential backoff.
 */
async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 2,
    baseDelay: number = 1000
): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (response.status >= 500 || response.status === 429) {
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
            }
            return response;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError || new Error("Request failed after retries");
}

// -----------------------------------------------------------------------------
// Transcribe API (Field Voice / ASR)
// -----------------------------------------------------------------------------

export interface TranscribeResult {
    text: string;
    language?: string;
    provider?: string;
}

export const transcribeApi = {
    transcribe: async (audioUri: string): Promise<TranscribeResult> => {
        const authHeaders = await getAuthHeaders();
        const formData = new FormData();

        // React Native FormData expects an object with uri, name, type
        formData.append("file", {
            uri: audioUri,
            name: "recording.m4a",
            type: "audio/m4a",
        } as any);

        const response = await fetch(`${BACKEND_URL}/transcribe/`, {
            method: "POST",
            headers: { ...authHeaders, "Content-Type": "multipart/form-data" },
            body: formData,
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Transcription failed");
        }
        return response.json();
    },
};

// -----------------------------------------------------------------------------
// Extract API (Magic Extractor)
// -----------------------------------------------------------------------------

export interface ExtractResult {
    document_type: string;
    vendor_name?: string;
    total_amount?: number;
    gstin?: string;
    line_items: any[];
    verification_ready: boolean;
}

export const extractApi = {
    extract: async (ocrText: string): Promise<ExtractResult> => {
        const authHeaders = await getAuthHeaders();
        // Uses the same text-based endpoint as web
        // For mobile camera, we'd need an OCR step on-device or send image to backend
        // Assuming backend supports image upload in future, but for now sticking to text
        // OR we can add a new endpoint for image upload if needed.
        // For now, let's assume valid text from on-device OCR or just mock it.
        const response = await fetch(`${BACKEND_URL}/extract/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify({ ocr_text: ocrText }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Extraction failed");
        }
        return response.json();
    },
};

// -----------------------------------------------------------------------------
// Auth Helpers
// -----------------------------------------------------------------------------

export const authApi = {
    setToken: async (token: string) => {
        await SecureStore.setItemAsync("auth_token", token);
    },
    clearToken: async () => {
        await SecureStore.deleteItemAsync("auth_token");
    }
};
