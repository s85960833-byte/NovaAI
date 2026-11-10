export type MissionWorkspace = "learn" | "build" | "agents" | "intelligence";

export interface StarterTask {
  title: string;
  description: string;
}

export interface StarterPlan {
  plan: {
    kind: "starter_template";
    version: 1;
    summary: string;
    goal: string;
    workspace: MissionWorkspace;
  };
  tasks: StarterTask[];
}

const TASKS: Record<MissionWorkspace, StarterTask[]> = {
  learn: [
    { title: "Clarify the learning goal", description: "Confirm the target outcome, current knowledge and time available." },
    { title: "Organize topics into a learning sequence", description: "Break the subject into ordered, manageable topics and prerequisites." },
    { title: "Prepare explanations and practice", description: "Create clear explanations, examples and practice activities for each topic." },
    { title: "Check understanding", description: "Use a short assessment to identify gaps and topics that need revision." },
    { title: "Summarize progress and next steps", description: "Prepare a concise recap and a practical next-study checklist." },
  ],
  build: [
    { title: "Confirm requirements and success criteria", description: "Record the intended users, essential features, constraints and acceptance checks." },
    { title: "Design page structure and user flow", description: "Map the screens, navigation, key states and responsive behavior." },
    { title: "Implement the responsive build", description: "Create the smallest working implementation that meets the agreed requirements." },
    { title: "Run functional and mobile checks", description: "Check core interactions, keyboard access, narrow screens and error states." },
    { title: "Review output and record proof", description: "Review the deliverable against acceptance criteria and attach test evidence." },
  ],
  agents: [
    { title: "Confirm objective, constraints and permissions", description: "Clarify the intended outcome, boundaries and actions that require approval." },
    { title: "Identify tools and approval gates", description: "List the tools needed and mark any external or sensitive action for approval." },
    { title: "Prepare the execution checklist", description: "Order the work into small, verifiable steps with clear completion criteria." },
    { title: "Carry out approved steps", description: "Execute only authorized steps; record any blocked or unavailable action." },
    { title: "Verify outcomes and record evidence", description: "Check the results independently and save evidence for each completed step." },
  ],
  intelligence: [
    { title: "Define the business question and KPIs", description: "Specify the decision to support, metric definitions and reporting period." },
    { title: "Inspect source data and quality", description: "Check freshness, completeness, duplicates, grain and consistency before analysis." },
    { title: "Analyze performance and key drivers", description: "Calculate the agreed metrics and investigate the largest changes and segments." },
    { title: "Prepare findings and recommended actions", description: "Summarize supported findings, uncertainties and practical next steps." },
    { title: "Verify calculations and evidence", description: "Recheck calculations, source references and assumptions before delivery." },
  ],
};

export function buildStarterPlan(mission: {
  title: string;
  description?: string;
  workspace: MissionWorkspace;
}): StarterPlan {
  if (!mission || typeof mission.title !== "string" || !mission.title.trim()) {
    throw new TypeError("A mission title is required");
  }
  if (!Object.hasOwn(TASKS, mission.workspace)) {
    throw new TypeError("Unsupported mission workspace");
  }
  const goal = mission.title.trim();
  const description = typeof mission.description === "string" ? mission.description.trim().slice(0, 1200) : "";
  const context = "Goal: " + goal + (description ? " Context: " + description : "");
  const tasks = TASKS[mission.workspace].map((task) => ({
    title: task.title,
    description: task.description + " Mission context: " + context,
  }));
  return {
    plan: {
      kind: "starter_template",
      version: 1,
      summary: "A no-cost starter checklist for " + goal,
      goal,
      workspace: mission.workspace,
    },
    tasks,
  };
}
