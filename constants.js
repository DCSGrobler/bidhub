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

// Closed stages
export const CLOSED_STAGES = ["Awarded", "Lost", "Withdrawn"];

// Delivery status (RAG)
export const DELIVERY_STATUSES = [
  { value: "onTrack", label: "On Track", rag: "green" },
  { value: "atRisk", label: "At Risk", rag: "amber" },
  { value: "behind", label: "Behind Schedule", rag: "red" },
];

// Scope options
export const SCOPE_OPTIONS = [
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

// Differentiators
export const DIFFERENTIATOR_OPTIONS = [
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

// Default bid
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
    "Have we worked with this client or within this industry before?",
    "Is the client financially stable and likely to honour commitments?",
    "Do we have prior positive relationships with this client?",
    "Do we consider this a fair competitive landscape?",
    "Can we differentiate ourselves effectively?",
    "Does the project fit best practice (out of the box)?",
    "Do we have experience with similar integration complexity?",
    "Are the technical requirements compatible with our capabilities?",
    "Can we meet requirements without significant custom development?",
    "Does the client have realistic expectations?",
    "Do we understand the budget and can we price competitively?",
    "Is the client mature in implementing technology solutions?",
    "Does the scope align with our core implementation strengths?",
    "Can we mitigate the identified risks?",
    "Will SAP assist with the response (non-functionals)?",
    "Does the client have a good reputation?",
  ],
  enhanced: [
    "Is there potential for licence revenue?",
    "Is there potential to upsell our products?",
    "Is there potential to upsell our services?",
    "Is the project scalable for future phases?",
    "Will it strengthen our position in a key market or industry?",
    "Can this project unlock future opportunities?",
    "Does this align with our strategic growth objectives?",
  ],
};
