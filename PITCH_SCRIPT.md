# NOVA — Early Buyer-Interest Conversation Script

**For supervised, non-paid discovery only.** Do not offer a paid product or customer-data onboarding.

## Opening — Hindi

NOVA एक Hindi-English AI workspace है। इसमें पढ़ाई के लिए NOVA Learn, digital creation के लिए NOVA Build और रोज़मर्रा की AI सहायता के लिए NOVA Agents हैं। Core app live है और automated तथा selected live checks पास हुए हैं। अभी हम product feedback और शुरुआती buyer interest समझ रहे हैं। Paid launch से पहले account security, privacy, recovery, support, Android testing और billing के कुछ जरूरी gates बाकी हैं।

## Opening — English

NOVA is a Hindi-English AI workspace for India. It brings learning, digital creation and everyday assistant workflows together through NOVA Learn, NOVA Build and NOVA Agents. The core app is live and selected automated and live checks have passed. We are gathering product feedback and early buyer interest while completing account security, privacy, recovery, support, physical Android and billing requirements before any paid launch.

## Five-minute preview

1. Show the home screen and three workspaces.
2. Run one harmless learning example.
3. Demonstrate one supported creation workflow.
4. Demonstrate one harmless assistant task.
5. Explain local chat storage and optional cloud sync accurately.
6. If showing NOVA BI, label it preview-only and use synthetic data.
7. Ask for feedback; record only information the participant agrees to share.

## Accurate cloud-sync statement

Cloud sync is off by default. If explicitly enabled, it stores up to 40 recent chats (up to 150 messages each), message text, extracted text from attached documents, saved memory and custom instructions; image attachments themselves are excluded. Avoid syncing sensitive content. Turning sync off stops future uploads but does not delete an existing backup.

## Qualification questions

- Which workspace is most useful to you?
- What problem do you currently solve with other tools?
- How often does that problem occur?
- What would you need to trust this workflow?
- What must be ready before you consider adopting or paying for it?

## Objection handling

**Can I subscribe now?**  
No. Paid checkout and server-side plan enforcement are not configured.

**Can I use confidential company data?**  
No. The preview is limited to synthetic or non-sensitive sample data.

**Is account sync production-verified?**  
Not end to end. Real email delivery, redirect settings and two-account isolation remain unverified.

**Can you guarantee availability or answer quality?**  
No. Providers can be unavailable, rate-limited or produce incorrect answers.

## Close

Thank them for feedback. Do not request payment, confidential data, passwords or API keys. Do not promise a sale price, launch date, uptime or performance. Any actual purchase or ownership discussion must be handled by a responsible adult with qualified legal review.


## Cloud-sync limitation to disclose

A code review found that local chats with the same ID overwrite remote versions during sync, so newer messages from another device can be lost. Saved memory and custom instructions are imported only when the local values are empty. Cloud sync is therefore not conflict-safe yet; do not rely on it for important data or present it as production-ready. This must be fixed and regression-tested before customer onboarding.


## Cloud-sync patch status — 8 November 2026

A follow-up patch now merges remote and local chat histories by their shared sequence overlap rather than globally deduplicating identical message text. This preserves legitimate repeated messages (for example, the same short reply sent twice) while appending local messages that follow the remote overlap. This is still a candidate code change, not a verified release: automated regression, browser, two-device concurrency, document-conflict, deletion/tombstone and live hosted-account tests have not yet passed. The implementation retains the local document when both copies differ because the current snapshot schema has no reliable per-document version or timestamp; memory/custom-instruction conflict resolution also remains limited. Do not claim conflict-safe multi-device sync until those tests and versioned conflict handling are complete.


## Two-minute demo script — synthetic data only

**0:00–0:20 — Introduce honestly**  
“NOVA is a Hindi-English workspace with Learn, Build and Agents areas. This Business Intelligence screen is an early preview. Every row today is synthetic demo data, not a real customer, team or company result.”

**0:20–0:50 — Cost Leak Detector**  
“Import `samples/demo-expenses.csv`, select Cost Leak Detector and enter a monthly budget of ₹1,00,000. The browser calculates ₹2,12,000 total across the two sample months, identifies November as ₹18,000 above the sample budget, and points to source rows. These are review signals, not proof of fraud or waste.”

**0:50–1:15 — Client Profitability**  
“Import `samples/demo-clients.csv`. It calculates ₹8,00,000 supplied revenue less ₹5,30,000 supplied direct costs, giving ₹2,70,000 contribution. It does not infer overhead, taxes or net profit.”

**1:15–1:40 — Team workflow**  
“Import `samples/demo-team-tasks.csv`. At the fixed demo reference date of 12 November 2026, the fixture has seven tasks, three completed, four open and two overdue. The four-day average cycle is calculated only from the three completed examples. No individual employee ranking or surveillance is performed.”

**1:40–2:00 — Limits and feedback**  
“Risk and Digital Twin outputs are rule-based or assumption-based examples, not trained predictions or guaranteed savings. The current preview is not approved for confidential/customer data or paid onboarding. Which single workflow would you want to test against your current process?”

Do not show personal data, customer data, real employee records or private credentials. Do not promise accuracy, financial gains, sale price or uptime.
