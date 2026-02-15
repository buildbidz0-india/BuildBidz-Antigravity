/**
 * Shared mock project data for list and detail views.
 * Replace with API calls when backend projects API is available.
 */

export interface ProjectTeamMember {
    name: string;
    role: string;
    initials: string;
}

export interface ProjectMilestone {
    name: string;
    date: string;
    completed: boolean;
}

export interface ProjectDetail {
    id: number;
    name: string;
    status: string;
    location: string;
    progress: number;
    description: string;
    team: ProjectTeamMember[];
    milestones: ProjectMilestone[];
    image?: string;
    teamCount?: number;
    deadline?: string;
}

/** Full project records used by list and detail pages */
export const MOCK_PROJECTS: ProjectDetail[] = [
    {
        id: 1,
        name: "Mumbai Metro Extension",
        location: "Mumbai, MH",
        status: "Active",
        progress: 35,
        teamCount: 18,
        deadline: "Dec 2026",
        image: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=400",
        description: "Phase 2 extension of the Mumbai Metro Line 3, covering 12km of elevated corridor and 8 stations.",
        team: [
            { name: "John Doe", role: "Project Manager", initials: "JD" },
            { name: "Sarah Smith", role: "Lead Architect", initials: "SS" },
            { name: "Raj Vyas", role: "Site Engineer", initials: "RV" },
        ],
        milestones: [
            { name: "Foundation Work", date: "Oct 2024", completed: true },
            { name: "Pillar Casting", date: "Jan 2025", completed: true },
            { name: "Girder Launching", date: "June 2025", completed: false },
            { name: "Station Finishing", date: "March 2026", completed: false },
        ],
    },
    {
        id: 2,
        name: "DLF Cyber City - Tower C",
        location: "Gurgaon, HR",
        status: "Active",
        progress: 68,
        teamCount: 42,
        deadline: "Aug 2025",
        image: "https://images.unsplash.com/photo-1503387762-592dee58c190?auto=format&fit=crop&q=80&w=400",
        description: "Commercial tower C as part of DLF Cyber City complex. 28 floors with basement parking and retail podium.",
        team: [
            { name: "Amit Sharma", role: "Project Manager", initials: "AS" },
            { name: "Priya Nair", role: "Structural Engineer", initials: "PN" },
            { name: "Vikram Singh", role: "MEP Lead", initials: "VS" },
        ],
        milestones: [
            { name: "Excavation & Piling", date: "Jun 2024", completed: true },
            { name: "Core & Shell", date: "Dec 2024", completed: true },
            { name: "Façade & MEP", date: "Apr 2025", completed: false },
            { name: "Handover", date: "Aug 2025", completed: false },
        ],
    },
    {
        id: 3,
        name: "Green Valley Residential",
        location: "Bangalore, KA",
        status: "Planning",
        progress: 10,
        teamCount: 5,
        deadline: "Mar 2027",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400",
        description: "Residential complex with 4 towers, clubhouse, and landscaped amenities. Pre-sales and approvals in progress.",
        team: [
            { name: "Kavitha Reddy", role: "Project Lead", initials: "KR" },
            { name: "Suresh Kumar", role: "Design Coordinator", initials: "SK" },
        ],
        milestones: [
            { name: "RERA & Approvals", date: "Q1 2025", completed: false },
            { name: "Groundbreaking", date: "Q3 2025", completed: false },
            { name: "Tower 1 Foundation", date: "Q1 2026", completed: false },
            { name: "Phase 1 Handover", date: "Mar 2027", completed: false },
        ],
    },
];

export function getProjectById(id: string | string[] | undefined): ProjectDetail | null {
    if (id == null) return null;
    const numId = typeof id === "string" ? parseInt(id, 10) : parseInt(id?.[0] ?? "", 10);
    if (Number.isNaN(numId)) return null;
    return MOCK_PROJECTS.find((p) => p.id === numId) ?? null;
}
