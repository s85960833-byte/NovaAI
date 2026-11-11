import {
  validateMissionPermissionPolicy,
  validateMissionPermissionScope,
  type MissionPermissionPolicy,
} from "./mission-permission-policy.ts";

const valid: MissionPermissionPolicy = {
  permissions: [{
    id: "123e4567-e89b-42d3-a456-426614174000",
    scope: { kind: "project", ref: "nova-project" },
    actions: ["read", "update"],
    approvalRequired: false,
    reason: "Read and update resources within this named project.",
    sourceRefIds: ["mission-input"],
  }, {
    id: "123e4567-e89b-42d3-a456-426614174001",
    scope: { kind: "resource", ref: "approved-recipient-list" },
    actions: ["send"],
    approvalRequired: true,
    reason: "Send only content to the specifically approved recipients.",
    sourceRefIds: ["mission-input"],
  }],
};

Deno.test("permission policy accepts explicit bounded grants", () => {
  if (!validateMissionPermissionPolicy(valid)) {
    throw new Error("A valid least-privilege permission policy was rejected");
  }
});

Deno.test("permission policy rejects wildcard, global and oversized scopes", () => {
  for (const ref of ["*", "all", "global", "x".repeat(49)]) {
    if (validateMissionPermissionScope({ kind: "project", ref })) {
      throw new Error("Unsafe or oversized scope was accepted: " + ref);
    }
  }
  if (validateMissionPermissionScope({ kind: "workspace", ref: "global" })) {
    throw new Error("Non-canonical workspace scope was accepted");
  }
});

Deno.test("permission policy requires approval for sensitive actions", () => {
  const unsafe = structuredClone(valid);
  unsafe.permissions[1].approvalRequired = false;
  if (validateMissionPermissionPolicy(unsafe)) {
    throw new Error("Sensitive send permission without approval was accepted");
  }
});

Deno.test("permission policy rejects duplicate IDs/actions and forged provenance", () => {
  const duplicateId = structuredClone(valid);
  duplicateId.permissions[1].id = duplicateId.permissions[0].id;
  if (validateMissionPermissionPolicy(duplicateId)) {
    throw new Error("Duplicate permission IDs were accepted");
  }
  const duplicateAction = structuredClone(valid);
  duplicateAction.permissions[0].actions = ["read", "read"];
  if (validateMissionPermissionPolicy(duplicateAction)) {
    throw new Error("Duplicate actions were accepted");
  }
  const forgedSource = structuredClone(valid);
  (forgedSource.permissions[0] as unknown as { sourceRefIds: string[] }).sourceRefIds = ["other-source"];
  if (validateMissionPermissionPolicy(forgedSource)) {
    throw new Error("Forged provenance was accepted");
  }
});

Deno.test("permission policy rejects unknown actions and excessive grants", () => {
  const unknownAction = structuredClone(valid);
  (unknownAction.permissions[0] as unknown as { actions: string[] }).actions = ["read", "admin"];
  if (validateMissionPermissionPolicy(unknownAction)) {
    throw new Error("Unknown permission action was accepted");
  }
  const excessive = {
    permissions: Array.from({ length: 21 }, (_, index) => ({
      ...valid.permissions[0],
      id: "123e4567-e89b-42d3-a456-" + String(index).padStart(12, "0"),
    })),
  };
  if (validateMissionPermissionPolicy(excessive)) {
    throw new Error("More than 20 permission grants were accepted");
  }
});
