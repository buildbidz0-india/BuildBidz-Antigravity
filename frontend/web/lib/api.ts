const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/** Get Authorization header from Firebase ID token when user is signed in. */
async function getAuthHeaders(): Promise<Record<string, string>> {
    if (typeof window === "undefined") return {};
    try {
        const { auth } = await import("@/lib/firebase/config");
        if (!auth) return {};
        const token = await auth.currentUser?.getIdToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
        return {};
    }
}

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

export interface ApiProjectTeamMember {
    name: string;
    role: string;
    initials: string;
}

export interface ApiProjectMilestone {
    name: string;
    date: string;
    completed: boolean;
}

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
    team?: ApiProjectTeamMember[];
    milestones?: ApiProjectMilestone[];
    created_at?: string | null;
}

export interface ProjectStats {
    total: number;
    active: number;
    planning: number;
}

export const projectsApi = {
    stats: async (): Promise<ProjectStats> => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/projects/stats`, {
            headers: { ...authHeaders },
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Failed to load stats");
        }
        return response.json();
    },

    list: async (): Promise<ApiProject[]> => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/projects`, {
            headers: { "Content-Type": "application/json", ...authHeaders },
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Failed to list projects");
        }
        const data = await response.json();
        return data.projects ?? [];
    },

    create: async (body: { name: string; location?: string; description?: string }): Promise<ApiProject> => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/projects`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Failed to create project");
        }
        return response.json();
    },

    getById: async (id: number | string): Promise<ApiProject | null> => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/projects/${id}`, {
            headers: { ...authHeaders },
        });
        if (response.status === 404) return null;
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Failed to load project");
        }
        return response.json();
    },

    update: async (
        id: number | string,
        body: Partial<{ name: string; location: string; status: string; description: string; progress: number; team: ApiProjectTeamMember[]; milestones: ApiProjectMilestone[] }>
    ): Promise<ApiProject> => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/projects/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Failed to update project");
        }
        return response.json();
    },
};

// -----------------------------------------------------------------------------
// Awards API (Compare & Award Engine)
// -----------------------------------------------------------------------------

export interface AwardBid {
    id: string;
    supplier_name: string;
    price: number;
    delivery_days: number;
    reputation_score: number;
    is_verified?: boolean;
    notes?: string;
}

export interface AwardCriteriaInput {
    weight_price?: number;
    weight_delivery?: number;
    weight_reputation?: number;
    max_price?: number;
    max_delivery_days?: number;
}

export interface AwardDecision {
    recommended_bid_id: string;
    score: number;
    justification: string;
    rankings: Array<{ bid_id: string; supplier_name?: string; score: number; [k: string]: unknown }>;
    meta?: Record<string, unknown>;
}

export const awardsApi = {
    compare: async (
        requirementDescription: string,
        bids: AwardBid[],
        criteria?: AwardCriteriaInput
    ): Promise<AwardDecision> => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/awards/compare`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify({
                requirement_description: requirementDescription,
                bids,
                criteria: criteria ?? {},
            }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Award comparison failed");
        }
        return response.json();
    },
    scoreOnly: async (
        requirementDescription: string,
        bids: AwardBid[],
        criteria?: AwardCriteriaInput
    ): Promise<{ ranked_bids: Array<{ bid_id: string; score: number; [k: string]: unknown }> }> => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/awards/score-only`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify({
                requirement_description: requirementDescription,
                bids,
                criteria: criteria ?? {},
            }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Scoring failed");
        }
        return response.json();
    },
};

// -----------------------------------------------------------------------------
// Forecast API (Price Forecasting Engine)
// -----------------------------------------------------------------------------

export type ForecastMaterial = "steel" | "cement" | "sand" | "tiles" | "fittings";
export type ForecastRegion = "patna" | "lucknow" | "indore" | "delhi_ncr";

export interface ForecastRequest {
    material: ForecastMaterial;
    region: ForecastRegion;
    quantity: number;
    target_margin_percent?: number;
}

export interface PricePoint {
    date: string;
    price: number;
    unit: string;
}

export interface ForecastResult {
    material: ForecastMaterial;
    region: ForecastRegion;
    current_price: number;
    forecast_price_30d: number;
    trend_direction: string;
    lock_rate_recommendation: boolean;
    confidence_score: number;
    ai_analysis: string;
    historical_data: PricePoint[];
}

export const forecastApi = {
    analyze: async (request: ForecastRequest): Promise<ForecastResult> => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/forecast/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify(request),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Forecast failed");
        }
        return response.json();
    },
};

// -----------------------------------------------------------------------------
// Coordination API (Multilingual Notifications)
// -----------------------------------------------------------------------------

export type CoordinationLanguage = "english" | "hindi" | "hinglish";
export type CommunicationStep =
    | "award_notification"
    | "site_ready"
    | "payment_released"
    | "defect_notice";

export interface CoordinationRequest {
    contractor_name: string;
    phone_number: string;
    language: CoordinationLanguage;
    step: CommunicationStep;
    project_name: string;
    details: Record<string, unknown>;
}

export interface CoordinationResult {
    original_intent: string;
    translated_message: string;
    whatsapp_formatted: string;
    audio_transcription_url?: string;
}

export const coordinationApi = {
    send: async (request: CoordinationRequest): Promise<CoordinationResult> => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/coordination/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify(request),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Coordination failed");
        }
        return response.json();
    },
};
