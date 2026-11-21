# NOVA 2.0 — 5-minute phone test

**Staging:** https://nova-2-staging.onrender.com
**Data safety:** Use only the synthetic text below. Do not upload real documents, IDs, bills or bank statements.

1. **Open/entry animation (30 sec).** Open the staging URL in Chrome. Let the NOVA intro finish once. Confirm Darbar fills the phone width; use Skip only if the intro does not finish.
2. **Language switch (20 sec).** Tap the EN/हिं button once and confirm the heading and labels change. Tap again to return to Hindi.
3. **Sakha (40 sec).** Open Sakha and send: `Explain photosynthesis in two simple sentences for a Class 10 student.` Confirm the response is labelled as a mock preview, not live AI.
4. **Local chat history (20 sec).** Open chat history, find the sample chat, delete that synthetic chat and confirm it disappears.
5. **Diwan Paper Reader (50 sec).** Open Diwan → Paper Reader and paste:

   `जिला शिक्षा कार्यालय — सूचना पत्र। आवेदन संख्या: DEMO-1042। दस्तावेज़ जमा करने की अंतिम तिथि: 30-11-2026। यदि कोई जानकारी अस्पष्ट हो तो कार्यालय से पुष्टि करें। यह केवल परीक्षण के लिए बनाया गया नमूना है।`

   Tick consent and tap Preview. Confirm uncertainty and the not-legal-advice notice are visible.
6. **Paper safety (15 sec).** Confirm the sample is not presented as authenticated government communication and no official contact is invented.
7. **Scam Check (35 sec).** Paste `आपका बैंक खाता आज बंद हो जाएगा। अभी OTP और UPI PIN भेजें। लिंक खोलकर ₹1,999 जमा करें।` and tap Preview. Confirm a risk warning appears; it must not promise certainty.
8. **Mock wallet (35 sec).** Open Wallet. Use only the built-in Test capture and Simulate mock refund controls, if displayed. Confirm the test balance returns to zero. No actual payment occurs.
9. **Performance screenshot (40 sec).** Open https://nova-2-staging.onrender.com/perf and keep it foregrounded for its five-second measurement. Screenshot the one-screen observed Hz estimate, p50/p95, dropped frames and PASS/FAIL. This browser estimate does not certify a physical 90/120 Hz panel.
10. **Delete test data (35 sec).** Remove the synthetic chat from step 3. Do not register a real account for this test: hosted Supabase Auth is not configured, so this verifies local chat deletion only, not full account-wide deletion.

**Report:** Note any clipped text, horizontal scrolling, blank screen or unresponsive control. Include the /perf screenshot and phone/browser version in a PR #103 comment.