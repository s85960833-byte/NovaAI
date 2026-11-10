import { buildStarterPlan } from "./mission-planner.ts";

Deno.test("builds five bounded starter tasks for each NOVA workspace", () => {
  const workspaces = ["learn", "build", "agents", "intelligence"] as const;
  for (const workspace of workspaces) {
    const result = buildStarterPlan({
      title: "Create a customer research report",
      description: "Use the uploaded interview notes and cite findings.",
      workspace,
    });
    if (result.tasks.length !== 5) throw new Error(workspace + " plan must contain five tasks");
    if (result.plan.kind !== "starter_template" || result.plan.workspace !== workspace) {
      throw new Error(workspace + " plan metadata is incorrect");
    }
    for (const task of result.tasks) {
      if (!task.title.trim() || task.title.length > 200 || !task.description.includes("customer research report")) {
        throw new Error(workspace + " task is missing bounded title or mission context");
      }
    }
  }
});

Deno.test("requires a title and supported workspace", () => {
  try {
    buildStarterPlan({ title: " ", workspace: "build" });
    throw new Error("Blank title was accepted");
  } catch (error) {
    if (!(error instanceof TypeError) || !error.message.includes("title")) throw error;
  }
  try {
    buildStarterPlan({ title: "Valid title", workspace: "unknown" as never });
    throw new Error("Unsupported workspace was accepted");
  } catch (error) {
    if (!(error instanceof TypeError) || !error.message.includes("workspace")) throw error;
  }
});
