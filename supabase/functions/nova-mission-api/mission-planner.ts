export type MissionWorkspace = "learn" | "build" | "agents" | "intelligence";

export type MissionTaskType =
  | "learn.goal_clarification" | "learn.topic_sequence" | "learn.practice_material"
  | "learn.assessment" | "learn.progress_summary"
  | "build.requirements" | "build.design_flow" | "build.implementation"
  | "build.quality_checks" | "build.review_proof"
  | "agents.permissions" | "agents.tool_gates" | "agents.checklist"
  | "agents.approved_steps" | "agents.verify_outcomes"
  | "intelligence.define_metrics" | "intelligence.inspect_data"
  | "intelligence.analyze_drivers" | "intelligence.recommend_actions"
  | "intelligence.verify_evidence";

export interface StarterTask {
  title: string;
  description: string;
  task_type: MissionTaskType;
  input_schema_version: 1;
  input: Readonly<{ description: string }>;
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

function task(task_type: MissionTaskType, title: string, description: string): StarterTask {
  return {
    title,
    description,
    task_type,
    input_schema_version: 1,
    input: { description },
  };
}

const TASKS: Record<MissionWorkspace, StarterTask[]> = {
  learn: [
    task("learn.goal_clarification", "Clarify the learning goal", "Confirm the target outcome, current knowledge and time available."),
    task("learn.topic_sequence", "Organize topics into a learning sequence", "Break the subject into ordered, manageable topics and prerequisites."),
    task("learn.practice_material", "Prepare explanations and practice", "Create clear explanations, examples and practice activities for each topic."),
    task("learn.assessment", "Check understanding", "Use a short assessment to identify gaps and topics that need revision."),
    task("learn.progress_summary", "Summarize progress and next steps", "Prepare a concise recap and a practical next-study checklist."),
  ],
  build: [
    task("build.requirements", "Confirm requirements and success criteria", "Record the intended users, essential features, constraints and acceptance checks."),
    task("build.design_flow", "Design page structure and user flow", "Map the screens, navigation, key states and responsive behavior."),
    task("build.implementation", "Implement the responsive build", "Create the smallest working implementation that meets the agreed requirements."),
    task("build.quality_checks", "Run functional and mobile checks", "Check core interactions, keyboard access, narrow screens and error states."),
    task("build.review_proof", "Review output and record proof", "Review the deliverable against acceptance criteria and attach test evidence."),
  ],
  agents: [
    task("agents.permissions", "Confirm objective, constraints and permissions", "Clarify the intended outcome, boundaries and actions that require approval."),
    task("agents.tool_gates", "Identify tools and approval gates", "List the tools needed and mark any external or sensitive action for approval."),
    task("agents.checklist", "Prepare the execution checklist", "Order the work into small, verifiable steps with clear completion criteria."),
    task("agents.approved_steps", "Carry out approved steps", "Execute only authorized steps; record any blocked or unavailable action."),
    task("agents.verify_outcomes", "Verify outcomes and record evidence", "Check the results independently and save evidence for each completed step."),
  ],
  intelligence: [
    task("intelligence.define_metrics", "Define the business question and KPIs", "Specify the decision to support, metric definitions and reporting period."),
    task("intelligence.inspect_data", "Inspect source data and quality", "Check freshness, completeness, duplicates, grain and consistency before analysis."),
    task("intelligence.analyze_drivers", "Analyze performance and key drivers", "Calculate the agreed metrics and investigate the largest changes and segments."),
    task("intelligence.recommend_actions", "Prepare findings and recommended actions", "Summarize supported findings, uncertainties and practical next steps."),
    task("intelligence.verify_evidence", "Verify calculations and evidence", "Recheck calculations, source references and assumptions before delivery."),
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
  const tasks = TASKS[mission.workspace].map((item) => ({
    ...item,
    description: item.description + " Mission context: " + context,
    input: {
      description: item.description + " Mission context: " + context,
    },
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
