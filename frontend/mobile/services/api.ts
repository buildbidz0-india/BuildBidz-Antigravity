import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/Config';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
    method?: RequestMethod;
    body?: any;
    headers?: Record<string, string>;
    isMultipart?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, isMultipart = false } = options;

    const token = await SecureStore.getItemAsync('auth_token');

    const configHeaders: Record<string, string> = {
        'Accept': 'application/json',
        ...headers,
    };

    if (token) {
        configHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (!isMultipart) {
        configHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${Config.API_URL}${endpoint}`, {
        method,
        headers: configHeaders,
        body: isMultipart ? body : (body ? JSON.stringify(body) : undefined),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API Error: ${response.status}`;
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.detail || errorJson.message || errorMessage;
        } catch (e) {
            // ignore JSON parse error
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

export const api = {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body }),
    postMultipart: <T>(endpoint: string, formData: FormData) => request<T>(endpoint, { method: 'POST', body: formData, isMultipart: true }),
    put: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'PUT', body }),
    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

// Typed responses corresponding to backend Pydantic models
export interface TranscribeResponse {
    transcript: string;
    detected_language: string;
}

export interface ExtractResponse {
    vendor_name: string | null;
    gstin: string | null;
    total_amount: number | null;
    line_items: any[];
}
