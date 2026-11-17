import { it, expect } from "vitest";
import { mergeConcurrentChat, mergeMessages, type SyncChat } from "./merge.js";
const chat = (version: number, updatedAt: string, content: string): SyncChat => ({
  id: "chat-1",
  userId: "user-1",
  title: "Notes",
  version,
  updatedAt,
  messages: [{ id: "m1", role: "user", content, createdAt: updatedAt }],
});
it("preserves distinct messages", () => {
  expect(
    mergeMessages(
      [{ id: "a", role: "user", content: "A", createdAt: "2026-01-01" }],
      [{ id: "b", role: "user", content: "B", createdAt: "2026-01-02" }],
    ),
  ).toHaveLength(2);
});
it("creates a conflict copy for concurrent edits", () => {
  const result = mergeConcurrentChat(
    chat(2, "2026-01-02", "remote"),
    chat(2, "2026-01-01", "local"),
  );
  expect(result.conflictCopy).not.toBeNull();
  expect(result.canonical.messages).toHaveLength(2);
});
it("rejects cross-owner merges", () => {
  expect(() =>
    mergeConcurrentChat(chat(1, "2026-01-01", "a"), {
      ...chat(1, "2026-01-01", "b"),
      userId: "other",
    }),
  ).toThrow("CHAT_OWNERSHIP_MISMATCH");
});
