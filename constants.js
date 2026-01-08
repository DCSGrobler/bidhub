// Storage
export const STORAGE_KEY = "bidhub.v2";

// Stages
export const STAGES = [
  "RFP Received",
  "Qualification",
  "In Progress",
  "Review",
  "Submission",
  "Negotiation",
  "Awarded",
  "Lost",
  "Withdrawn",
];

// Closed stages (array for includes checks)
export const CLOSED_STAGES = ["Awarded", "Lost", "Withdrawn"];

// Optional Set form if needed elsewhere
export const CLOSED_STAGE_SET = new Set(CLOSED_STAGES);

// Delivery status (RAG)
export const DELIVERY_STATUSES = [
  { value: "onTrack", label: "On Track", rag: "green" },
  { value: "atRisk", label: "At Risk", rag: "amber" },
  { value: "behind", label: "Behind Schedule", rag: "red" },
];

// Scope options (grouped)
export const DEFAULT_SCOPE_OPTIONS = [
  {
    group: "SAP SuccessFactors",
    items: [
      "Employee Central",
      "Employee Central Payroll",
      "Recruiting",
      "Onboarding",
      "Performance & Goals",
      "Succession",
      "Learning",
      "Compensation",
      "Variable Pay",
      "People Analytics",
      "Integration",
    ],
  },
  {
    group: "EPI-USE Products",
    items: [
      "PRISM",
      "Data Sync Manager",
      "Variance Monitor",
      "PatternFlex",
    ],
  },
  {
    group: "Services",
    items: [
      "Implementation",
      "Optimisation",
      "Managed Services",
      "Testing",
      "Change & Adoption",
      "Architecture",
    ],
  },
];

// Differentiator options
export const DEFAULT_DIFFERENTIATOR_OPTIONS = [
  "Client track record",
  "Payroll expertise",
  "Integration capability",
  "Industry experience",
  "Accelerators and tooling",
  "Local delivery capability",
  "Change and adoption expertise",
  "Pragmatic delivery model",
  "Security and compliance focus",
];

// Aliases to match app.js imports
export const SCOPE_OPTIONS = DEFAULT_SCOPE_OPTIONS;
export const DIFFERENTIATOR_OPTIONS = DEFAULT_DIFFERENTIATOR_OPTIONS;

// Default bid model
export const DEFAULT_BID = {
  id: "",
  bidNumber: "",
  title: "",
  client: "",
  clientRef: "",
  owner: "",
  stage: "RFP Received",
  deliveryStatus: "onTrack",
  dateReceived: "",
  dueDate: "",
  submittedDate: "",
  decisionDate: "",
  valueAud: "",
  probability: "50",
  scope: [],
  scopeSummary: "",
  requirements: "",
  assumptions: "",
  dependencies: "",
  risks: "",
  stakeholders: "",
  resourcing: "",
  commercials: "",
  differentiators: [],
  differentiatorsOther: "",
  competitorNotes: "",
  nextSteps: "",
  notes: "",
  qualification: null,
  createdAt: "",
  updatedAt: "",
};

// Qualification questions
export const QUAL_QUESTIONS = {
  critical: [
    "Has the client expressed clear commitment to the project timeline and scope?",
    "Are key stakeholders (Executive Leadership Team) actively engaged?",
    "Is the project scope aligned with our current capabilities and expertise?",
    "Is the potential revenue substantial enough to justify the investment of resources?",
    "Will the payment terms meet our financial requirements?",
    "Does the project pose acceptable legal, regulatory, or reputational risks?",
    "Does the project have an acceptable risk profile overall?",
    "Can we meet the proposed project timeline?",
    "Are the commercial terms attractive?",
  ],
  evaluation: [
    "Is this an EPI-USE led opportunity (not SAP)?",
    "Is this a People Solutions opportunity?",
    "Is this response a prerequisite for further shortlisting?",
