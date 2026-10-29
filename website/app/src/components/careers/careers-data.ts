/**
 * Careers content. Roles and their details come from the client's careers
 * page; the copy is condensed for this redesign.
 */

export type Department = "Product Development" | "Operations" | "IT & SD";
export type Level = "fresh" | "mid" | "senior";

export const DEPARTMENTS: { id: "all" | Department; label: string }[] = [
  { id: "all", label: "All" },
  { id: "Product Development", label: "Product Development" },
  { id: "Operations", label: "Operations" },
  { id: "IT & SD", label: "IT & SD" },
];

export const LEVELS: { id: "all" | Level; label: string; range: string }[] = [
  { id: "all", label: "All", range: "" },
  { id: "fresh", label: "Fresh", range: "0 to 2 years" },
  { id: "mid", label: "Mid", range: "3 to 7 years" },
  { id: "senior", label: "Senior", range: "8+ years" },
];

/** Minimum years asked for decides the level a role is listed under. */
export function levelFor(years: number): Level {
  if (years <= 2) return "fresh";
  if (years <= 7) return "mid";
  return "senior";
}

export interface Job {
  id: string;
  title: string;
  department: Department;
  positions: number;
  minYears: number;
  education: string;
  location: string;
  type: string;
  posted: string;
  postedISO: string;
  summary: string;
  duties: string[];
  requirements: string[];
  /** Label for the skills list ("Skills" or "Core skills"). */
  skillsLabel: string;
  skills: string[];
  extra?: { label: string; items: string[] };
}

const common = {
  location: "Islamabad",
  posted: "09 Oct 2026",
  postedISO: "2026-10-09",
  type: "Full-Time",
};

export const JOBS: Job[] = [
  {
    ...common,
    department: "Product Development",
    duties: [
      "Create, modify and maintain accurate 2D technical drawings in CAD.",
      "Work from engineers' calculations and instructions.",
      "Revise drawings when instructed.",
      "Check data against the original design drawings.",
    ],
    education: "Intermediate",
    id: "cad-cam-operator",
    minYears: 2,
    positions: 1,
    requirements: [
      "Close attention to detail.",
      "Punctual and organised.",
      "Clear communication.",
      "Strong computer skills.",
      "Able to work independently.",
      "Good problem solving and time management.",
    ],
    skills: ["AutoCAD", "CAM", "SolidWorks"],
    skillsLabel: "Skills",
    summary: "Turn engineering intent into clean, accurate drawings for new hubs and drums.",
    title: "CAD/CAM Operator",
  },
  {
    ...common,
    department: "Operations",
    duties: [
      "Give administrative and management support.",
      "Prepare reports, presentations and data analysis.",
      "Manage schedules and meetings.",
      "Coordinate across departments.",
      "Follow up on tasks and projects.",
    ],
    education: "BSc (Physics, Chemistry, Maths or Stats)",
    id: "management-assistant",
    minYears: 2,
    positions: 3,
    requirements: [
      "BSc in Physics, Chemistry, Maths or Statistics.",
      "Resident of Rawalpindi or Islamabad.",
      "Effective communicator.",
      "Self-motivated team player.",
    ],
    skills: [
      "Communication",
      "Data entry",
      "Interpersonal skills",
      "MS Office",
      "Multitasking",
      "Problem solving",
      "Time management",
    ],
    skillsLabel: "Skills",
    summary: "Keep management work moving: reports, data, schedules and follow-up across the plant.",
    title: "Management Assistant",
  },
  {
    ...common,
    department: "Product Development",
    duties: [
      "Plan and develop mechanical designs for new products.",
      "Set up testing and validate designs.",
      "Run engineering calculations.",
      "Create and review drawings and specifications in CAD.",
      "Keep design documentation up to date.",
      "Deliver projects on time.",
    ],
    education: "BS/BE Mechanical Engineering",
    id: "mechanical-design-engineer",
    minYears: 5,
    positions: 1,
    requirements: [
      "Degree in mechanical engineering.",
      "Strong grasp of mechanical design principles.",
      "SolidWorks and AutoCAD.",
      "Analytical problem solving.",
      "Good communication and teamwork.",
      "Proactive.",
    ],
    skills: ["Technical drawings", "AutoCAD", "SolidWorks", "Design principles", "Manufacturing processes", "Materials"],
    skillsLabel: "Skills",
    summary: "Design and validate new wheel-end products, from first calculation to tested part.",
    title: "Mechanical Design Engineer",
  },
  {
    ...common,
    department: "IT & SD",
    duties: [
      "Troubleshoot hardware and software.",
      "Maintain networking, CCTV, security and AV systems and the Active Directory domain.",
      "Give hands-on support for servers and end-user devices.",
      "Run routine updates and backups.",
    ],
    education: "Bachelors",
    extra: {
      items: ["DevOps", "ERP migration", "Endpoint and kiosk hardening", "Scripting and automation"],
      label: "Also useful",
    },
    id: "network-administrator",
    minYears: 5,
    positions: 1,
    requirements: [],
    skills: [
      "Linux systems",
      "VoIP telephony",
      "Cybersecurity and firewall administration",
      "Networking and high-density Wi-Fi",
      "Containerization",
      "CCTV",
      "Virtualization",
      "Windows Server",
    ],
    skillsLabel: "Core skills",
    summary: "Run the network, servers and security systems that keep the plant connected.",
    title: "Network Administrator",
  },
];

export const WHY = [
  {
    body: "You own real work from your first months, with the support to get it right.",
    title: "Real responsibility early",
  },
  {
    body: "Work beside experienced engineers and manufacturing specialists who share what they know.",
    title: "Learn from experts",
  },
  {
    body: "From foundry to machining, assembly and dispatch, all on one campus.",
    title: "One plant, end to end",
  },
  {
    body: "A business that has kept investing in people and equipment since 1967.",
    title: "Built to last",
  },
];
