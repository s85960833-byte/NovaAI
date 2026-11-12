# NOVA — Buyer-Interest Preview Kit

**Status: Non-paid, adult-supervised discovery only.** Not an offer to sell, valuation, purchase agreement or production-readiness claim.

## One-line description

NOVA is an India-oriented Hindi-English AI workspace that brings learning, digital creation and everyday assistant workflows into NOVA Learn, NOVA Build and NOVA Agents.

Preview: https://novaai-4auo.onrender.com

## 30-second introduction — Hindi

NOVA एक Hindi-English AI workspace है, जिसमें पढ़ाई के लिए NOVA Learn, digital creation के लिए NOVA Build और रोज़मर्रा की AI सहायता के लिए NOVA Agents हैं। Core app live है और automated browser, security तथा selected live workflow checks पास हुए हैं। अभी हम शुरुआती feedback और buyer interest समझ रहे हैं। Paid launch से पहले account email, two-account isolation, privacy, support, recovery, Android device testing और billing की बाकी जाँच पूरी करनी है।

## 30-second introduction — English

NOVA is a Hindi-English AI workspace for India, with NOVA Learn for learning, NOVA Build for digital creation and NOVA Agents for assistant workflows. The core app is live and selected automated, security and live workflow checks have passed. We are gathering early feedback and understanding buyer interest while completing account, privacy, recovery, support, physical-device and billing requirements before any paid launch.

## What to demonstrate

1. Home screen and bilingual workspace navigation.
2. One harmless sample learning prompt in NOVA Learn.
3. One supported creation flow in NOVA Build; disclose free-provider limits.
4. One harmless assistant task in NOVA Agents.
5. Account settings only with a test account; explain cloud sync is OFF by default and real email/two-account isolation are not yet verified.
6. NOVA BI only as a preview with synthetic data.

## Accurate account-sync explanation

Chat history stays on the device by default. If a signed-in user explicitly enables optional cloud sync, NOVA uploads up to 40 recent chats (up to 150 messages each), message text, extracted text from attached documents, saved memory and custom instructions. Image attachments themselves are excluded. Avoid syncing sensitive information. Turning sync off stops future uploads but does not erase an existing cloud backup; use the separate delete-backup control.

## Discovery questions

- Which workspace solves a real recurring problem?
- What tool or process do you currently use instead?
- Which workflow would you want to test again?
- What privacy, reliability, support and recovery evidence would you need before adopting it?
- What would need to be ready before you would consider a paid product?

## Questions buyers may ask

**Can I subscribe or pay today?**  
No. Checkout and server-side subscription enforcement are not configured.

**Can I use confidential company/customer data?**  
No. This preview is for synthetic or non-sensitive sample data only.

**Is account sync production-verified?**  
No. It is optional and off by default. Real email delivery, redirect configuration and live two-account isolation remain unverified.

**Is NOVA BI production-ready?**  
No. It is a preview only. Use synthetic data.

**Is uptime guaranteed?**  
No. The current Render Free plan has no always-on guarantee or SLA.

## Claims to avoid

Do not claim paying customers, revenue, traction, valuation, perfect accuracy, guaranteed uptime, enterprise readiness, certification, compliance, completed billing, secure confidential-data processing or guaranteed support. Do not promise a sale price or completion date.

## Boundaries

No payment, deposit, paid trial, customer onboarding or confidential-data processing. Any purchase, IP, ownership, payment or contract discussion must be handled by a responsible adult with qualified legal support.


## Cloud-sync limitation to disclose

A code review found that local chats with the same ID overwrite remote versions during sync, so newer messages from another device can be lost. Saved memory and custom instructions are imported only when the local values are empty. Cloud sync is therefore not conflict-safe yet; do not rely on it for important data or present it as production-ready. This must be fixed and regression-tested before customer onboarding.


## Cloud-sync patch status — 8 November 2026

A follow-up patch now merges remote and local chat histories by their shared sequence overlap rather than globally deduplicating identical message text. This preserves legitimate repeated messages (for example, the same short reply sent twice) while appending local messages that follow the remote overlap. This is still a candidate code change, not a verified release: automated regression, browser, two-device concurrency, document-conflict, deletion/tombstone and live hosted-account tests have not yet passed. The implementation retains the local document when both copies differ because the current snapshot schema has no reliable per-document version or timestamp; memory/custom-instruction conflict resolution also remains limited. Do not claim conflict-safe multi-device sync until those tests and versioned conflict handling are complete.


## Demo and feedback materials
- The two-minute product walkthrough is in [PITCH_SCRIPT.md](PITCH_SCRIPT.md).
- The sample files and expected illustrative results are in [samples/README.md](samples/README.md).
- [Feedback outreach templates](BUYER_OUTREACH_TEMPLATES.md) are strictly for non-paid, adult-supervised product feedback; they are not an acquisition offer, paid pilot or purchase solicitation.


## Additional internal review materials
- [Why evaluate NOVA?](WHY_EVALUATE_NOVA.md)
- [Buyer and technical FAQ](BUYER_FAQ.md)
- [Selected improvement register](IMPROVEMENT_REGISTER.md)
