// =============================================================================
// BuildBidz - Database Types
// =============================================================================

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

// Define a generic row type for flexibility
interface GenericRow {
    id?: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
    org_id?: string;
    project_id?: string;
    [key: string]: unknown;
}

export interface Database {
    public: {
        Tables: {
            users: {
                Row: GenericRow & {
                    email?: string;
                    full_name?: string | null;
                    phone?: string | null;
                    role?: string;
                    organization_id?: string | null;
                };
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            organizations: {
                Row: GenericRow & {
                    name?: string;
                    gstin?: string | null;
                    pan?: string | null;
                    address?: string | null;
                    city?: string | null;
                    state?: string | null;
                    pincode?: string | null;
                    logo_url?: string | null;
                };
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            projects: {
                Row: GenericRow & {
                    name?: string;
                    code?: string;
                    description?: string | null;
                    status?: string;
                    type?: string;
                    start_date?: string | null;
                    end_date?: string | null;
                    budget?: number | null;
                    location?: string | null;
                    location_id?: string | null;
                    project_manager_id?: string | null;
                };
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            documents: {
                Row: GenericRow & {
                    name?: string;
                    file_path?: string;
                    file_size?: number;
                    mime_type?: string;
                    source?: string;
                    ocr_status?: string;
                    category_id?: string | null;
                    uploaded_by?: string | null;
                };
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            document_categories: {
                Row: GenericRow & { name?: string };
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            invoices: {
                Row: GenericRow & {
                    invoice_number?: string;
                    invoice_date?: string;
                    due_date?: string;
                    amount?: number;
                    tax_amount?: number;
                    total_amount?: number;
                    status?: string;
                    vendor_id?: string;
                    contract_id?: string | null;
                };
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            invoice_line_items: {
                Row: GenericRow;
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            vendors: {
                Row: GenericRow & {
                    name?: string;
                    gstin?: string | null;
                    is_active?: boolean;
                };
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            vendor_contacts: {
                Row: GenericRow;
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            contracts: {
                Row: GenericRow & { contract_number?: string };
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            locations: {
                Row: GenericRow & {
                    name?: string;
                    city?: string;
                };
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            rfis: {
                Row: GenericRow & {
                    rfi_number?: string;
                    subject?: string;
                    question?: string;
                    answer?: string | null;
                    status?: string;
                    priority?: string;
                    assigned_to?: string | null;
                    answered_by?: string | null;
                    due_date?: string | null;
                    created_by?: string | null;
                };
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            bid_packages: {
                Row: GenericRow;
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            bid_invitations: {
                Row: GenericRow;
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            bids: {
                Row: GenericRow;
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            project_phases: {
                Row: GenericRow;
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            project_members: {
                Row: GenericRow & { user_id?: string };
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
            payments: {
                Row: GenericRow;
                Insert: GenericRow;
                Update: Partial<GenericRow>;
            };
        };

        Views: {
            [_ in never]: never;
        };

        Functions: {
            [_ in never]: never;
        };

        Enums: {
            user_role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
            project_status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
        };

        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
