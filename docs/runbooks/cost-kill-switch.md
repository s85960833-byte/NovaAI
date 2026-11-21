# Cost Kill Switch

- Default provider mode is `mock`; `AI_KILL_SWITCH=true`; spend caps default to ₹0.
- Check `config/limits.ts` and the environment before any provider adapter can run.
- A provider call must be denied before dispatch when the global or user cap is reached.
- The mock adapter must report ₹0 and cannot perform network calls.
- Do not add a paid API key or change spend caps during this build.
- Any future provider spend requires adult owner review and a separately approved budget.
