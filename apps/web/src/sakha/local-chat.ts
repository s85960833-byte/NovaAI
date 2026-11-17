export type LocalMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  mode?: "mock" | "local";
};
export type LocalChat = { id: string; title: string; updatedAt: string; messages: LocalMessage[] };
export const CHAT_STORAGE_KEY = "nova2_chats_v1";
export const LEGACY_KEYS = [
  "nova",
  "nova_t",
  "nova_modes_v1",
  "nova_mode_cache_v1",
  "nova-cloud-sync-enabled",
] as const;
export function loadLocalChats(storage: Pick<Storage, "getItem"> = localStorage): LocalChat[] {
  try {
    const raw = storage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is LocalChat =>
      Boolean(
        item &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          Array.isArray(item.messages),
      ),
    );
  } catch {
    return [];
  }
}
export function saveLocalChats(
  chats: LocalChat[],
  storage: Pick<Storage, "setItem"> = localStorage,
) {
  try {
    storage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats));
    return true;
  } catch {
    return false;
  }
}
export function legacyKeysPresent(storage: Pick<Storage, "getItem"> = localStorage) {
  return LEGACY_KEYS.filter((key) => storage.getItem(key) !== null);
}
export function newLocalChat(): LocalChat {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}
