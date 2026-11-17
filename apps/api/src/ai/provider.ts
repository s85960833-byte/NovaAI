export type GenerateInput = { content: string; language: "hi" | "en" | "hinglish" };
export type GenerateOutput = {
  text: string;
  provider: "mock";
  model: "nova-mock-v1";
  inputUnits: number;
  outputUnits: number;
  costPaise: 0;
};
export interface TextProvider {
  generate(input: GenerateInput): Promise<GenerateOutput>;
}
export class MockTextProvider implements TextProvider {
  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const text =
      input.language === "hi"
        ? "यह NOVA का mock preview है। अभी कोई live AI model नहीं जुड़ा है।"
        : "This is a NOVA mock preview. No live AI model is connected yet.";
    return {
      text,
      provider: "mock",
      model: "nova-mock-v1",
      inputUnits: input.content.length,
      outputUnits: text.length,
      costPaise: 0,
    };
  }
}
export class DisabledTextProvider implements TextProvider {
  async generate(): Promise<never> {
    throw new Error("PROVIDER_DISABLED");
  }
}
export function createTextProvider(mode: "mock" | "disabled"): TextProvider {
  return mode === "mock" ? new MockTextProvider() : new DisabledTextProvider();
}
