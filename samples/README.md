# NOVA BI — Synthetic Demo Data

**Every row in this folder is fictional and generated for software testing.** No customer, company, employee, supplier, transaction or actual business outcome is represented. Names are intentionally labelled `(DEMO)` where applicable. Do not use these figures as product benchmarks, testimonials, savings claims or financial advice.

## Files

| File | NOVA BI analysis type | Expected illustrative result |
|---|---|---|
| `demo-expenses.csv` | Cost Leak Detector | 12 valid rows; ₹2,12,000 total spend; October ₹94,000; November ₹1,18,000; with a ₹1,00,000 monthly budget, November is ₹18,000 above budget and spend rose about 25.5% month over month |
| `demo-clients.csv` | Client Profitability Analyzer | ₹8,00,000 supplied revenue less ₹5,30,000 supplied direct costs = ₹2,70,000 contribution; excludes overhead and tax |
| `demo-team-tasks.csv` | Team Productivity Insights | As of 12 November 2026: 7 tasks, 3 completed, 4 open, 2 overdue, average cycle time 4 days for the three completed tasks |

## How to try the files

1. Open the NOVA Business Intelligence preview and choose **Analyze CSV**.
2. For expenses, upload `demo-expenses.csv`, choose Cost Leak Detector, and enter INR 1,00,000 as the optional monthly budget.
3. For clients, upload `demo-clients.csv` and choose Client Profitability.
4. For tasks, upload `demo-team-tasks.csv` and choose Team Productivity.
5. Review the mapped columns, then select **Run analysis**. Compare the result with the illustrative totals above.

The CSV parser and deterministic calculations run in the browser. Raw CSV rows are not uploaded by NOVA or sent to an AI provider. If you explicitly save an analysis to Company Cloud, the documented cloud feature stores analysis metadata/aggregates and source-row evidence, not the raw CSV file. Use synthetic data only in previews; do not import personal, employee, student, regulated or confidential records.

## Other sample-only controls

- Project Risk: use the form with due date `2026-11-20`, progress `35`, blockers `3`, reference date `2026-11-12`. The output is a rule-based heuristic, not a calibrated probability.
- Digital Twin: monthly baseline `250000`, currency `INR`, automation share `25%`, realisation `50%`, one-time implementation cost `30000`, horizon `12 months`. The estimated net impact is arithmetic on those assumptions, not a forecast or guaranteed saving.

Do not present these samples as real client results or traction.
