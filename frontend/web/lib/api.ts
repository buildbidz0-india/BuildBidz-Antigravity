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
