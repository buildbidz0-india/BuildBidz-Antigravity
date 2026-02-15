const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface RagChatResponse {
    content: string;
    model: string;
    usage?: any;
}

export interface ChatResponse {
    content: string;
    model?: string;
    usage?: unknown;
    session_id?: string;
}

export const aiApi = {
    /** Multi-turn chat with optional RAG context (used by project assistant) */
    chat: async (messages: ChatMessage[], context?: string, model?: string): Promise<ChatResponse> => {
        const response = await fetch(`${BACKEND_URL}/ai/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages, context, model }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail?.message || error.detail || "Failed to chat");
        }
        return response.json();
    },

    ragChat: async (query: string, context?: string, model?: string): Promise<RagChatResponse> => {
        const response = await fetch(`${BACKEND_URL}/ai/rag-chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query, context, model }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Failed to chat with AI");
        }

        return response.json();
    },

    ingest: async (text: string, metadata: any = {}, namespace: string = "default"): Promise<{ status: string; vector_id: string }> => {
        const response = await fetch(`${BACKEND_URL}/ai/ingest`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text, metadata, namespace }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Failed to ingest document");
        }

        return response.json();
    },
};

// -----------------------------------------------------------------------------
// Projects API
// -----------------------------------------------------------------------------

export interface ApiProject {
    id: number;
    name: string;
    location: string;
    status: string;
    description: string;
    progress: number;
    team_count?: number | null;
    deadline?: string | null;
    image?: string | null;
    created_at?: string | null;
}

export const projectsApi = {
    list: async (): Promise<ApiProject[]> => {
        const response = await fetch(`${BACKEND_URL}/projects`);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Failed to list projects");
        }
        const data = await response.json();
        return data.projects ?? [];
    },

    create: async (body: { name: string; location?: string; description?: string }): Promise<ApiProject> => {
        const response = await fetch(`${BACKEND_URL}/projects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Failed to create project");
        }
        return response.json();
    },

    getById: async (id: number | string): Promise<ApiProject | null> => {
        const response = await fetch(`${BACKEND_URL}/projects/${id}`);
        if (response.status === 404) return null;
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Failed to load project");
        }
        return response.json();
    },
};
