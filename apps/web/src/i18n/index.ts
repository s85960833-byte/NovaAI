import en from "./en.json";
import hi from "./hi.json";
type Dictionary = typeof en;
type Locale = "en" | "hi";
const dictionaries: Record<Locale, Dictionary> = { en, hi };
export function translate(locale: Locale, key: string): string {
  const value = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined,
      dictionaries[locale],
    );
  return typeof value === "string" ? value : key;
}
export type { Locale, Dictionary };
