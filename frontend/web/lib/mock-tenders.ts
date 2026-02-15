export interface Tender {
    id: string;
    title: string;
    description: string;
    projectId: string;
    projectName: string;
    status: "Open" | "Closed" | "Reviewing" | "Draft";
    deadline: string;
    bidsReceived: number;
    budgetRange: string;
    postedDate: string;
}

export const MOCK_TENDERS: Tender[] = [
    {
        id: "t-001",
        title: "Steel Supply - Phase 1",
        description: "Supply of TMT bars (FE 500D) for foundation work.",
        projectId: "p-101",
        projectName: "Skyline Towers",
        status: "Open",
        deadline: "2024-05-15",
        bidsReceived: 4,
        budgetRange: "₹12L - ₹15L",
        postedDate: "2024-04-20"
    },
    {
        id: "t-002",
        title: "Cement Supply - Plinth",
        description: "OPC 53 Grade Cement for plinth beam construction.",
        projectId: "p-101",
        projectName: "Skyline Towers",
        status: "Reviewing",
        deadline: "2024-04-25",
        bidsReceived: 6,
        budgetRange: "₹5L - ₹6.5L",
        postedDate: "2024-04-10"
    },
    {
        id: "t-003",
        title: "HVAC Installation",
        description: "Complete HVAC system installation for commercial block.",
        projectId: "p-102",
        projectName: "Riverside Mall",
        status: "Open",
        deadline: "2024-06-01",
        bidsReceived: 2,
        budgetRange: "₹45L - ₹55L",
        postedDate: "2024-04-22"
    },
    {
        id: "t-004",
        title: "Electrical Wiring Contract",
        description: "Internal wiring and switchboard installation.",
        projectId: "p-103",
        projectName: "Green Valley Villas",
        status: "Closed",
        deadline: "2024-03-30",
        bidsReceived: 8,
        budgetRange: "₹8L - ₹10L",
        postedDate: "2024-03-01"
    },
    {
        id: "t-005",
        title: "Flooring Tiles Supply",
        description: "Virtrified tiles for 50 residential units.",
        projectId: "p-103",
        projectName: "Green Valley Villas",
        status: "Draft",
        deadline: "—",
        bidsReceived: 0,
        budgetRange: "₹20L - ₹25L",
        postedDate: "—"
    }
];
