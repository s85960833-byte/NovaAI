# NOVA 2.0 — मालिक के लिए छोटी गाइड (Draft)

## अभी की स्थिति
यह केवल staging rebuild है। NOVA 1.0 का live link, `main`, production Render और production Supabase नहीं बदले गए हैं। Wallet/payment केवल mock mode में है।

## Dashboard कैसे देखें
- Render में केवल “NOVA 2.0 staging” नाम की service खोलें।
- Health URL में `/api/health` देखें। HTTP 200 आना चाहिए।
- Free service सो सकती है; पहली request में लगभग एक मिनट लग सकता है।
- कोई production secret staging में न डालें।

## Credits और prices
`config/pricing.ts` में केवल design placeholders हैं। अभी कोई असली balance, top-up या payment नहीं होता। Final prices PENDING OWNER REVIEW हैं।

## Kill switch
`AI_KILL_SWITCH=true` default है। इसे बंद करने या किसी paid AI provider को जोड़ने का काम इस build में नहीं करना है।

## Backup / restore
सिर्फ synthetic staging data का restore test करें। Production backup या restore इस phase में नहीं होगा।

## Release
Phase 7 शुरू नहीं होगा जब तक आप exact शब्द `APPROVE RELEASE` न लिखें।
