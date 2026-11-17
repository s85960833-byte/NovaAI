export function buildRtiDraft(input: {
  authority: string;
  subject: string;
  questions: string[];
  period?: string | undefined;
  language: "hi" | "en";
}) {
  const hi = input.language === "hi";
  const questions = input.questions.map((q, i) => i + 1 + ". " + q).join("\n");
  return hi
    ? [
        "सेवा में,",
        "लोक सूचना अधिकारी,",
        input.authority,
        "",
        "विषय: " + input.subject,
        "",
        "महोदय/महोदया,",
        "सूचना का अधिकार अधिनियम के अंतर्गत कृपया नीचे दी गई मौजूदा अभिलेखीय जानकारी उपलब्ध कराने का कष्ट करें:",
        questions,
        input.period ? "अवधि: " + input.period : "",
        "कृपया लागू नियमों के अनुसार उत्तर उपलब्ध कराएँ।",
        "नाम और पता भेजने से पहले स्वयं भरें।",
        "",
        "भवदीय,",
        "[आवेदक का नाम]",
        "[डाक पता]",
      ]
        .filter(Boolean)
        .join("\n")
    : [
        "To,",
        "The Public Information Officer,",
        input.authority,
        "",
        "Subject: " + input.subject,
        "",
        "Sir/Madam,",
        "Under the Right to Information Act, please provide the following existing record-based information:",
        questions,
        input.period ? "Period: " + input.period : "",
        "Please provide the response under the applicable rules.",
        "Fill in applicant name and address before submission.",
        "",
        "Yours faithfully,",
        "[Applicant name]",
        "[Postal address]",
      ]
        .filter(Boolean)
        .join("\n");
}
export function buildComplaintDraft(input: {
  category: string;
  facts: string;
  relief: string;
  language: "hi" | "en";
}) {
  const hi = input.language === "hi";
  return hi
    ? [
        "सेवा में,",
        "संबंधित शिकायत अधिकारी,",
        "",
        "विषय: " + input.category + " से संबंधित शिकायत",
        "",
        "महोदय/महोदया,",
        "मैं निम्न तथ्य आपके संज्ञान में लाना चाहता/चाहती हूँ:",
        input.facts,
        "",
        "मेरा अनुरोध है कि कृपया इस मामले की जाँच कर उचित कार्रवाई करें:",
        input.relief,
        "",
        "संलग्नक: [केवल उपलब्ध दस्तावेज़ों की सूची भरें]",
        "",
        "सादर,",
        "[नाम और संपर्क]",
      ].join("\n")
    : [
        "To,",
        "The Concerned Grievance Officer,",
        "",
        "Subject: Complaint regarding " + input.category,
        "",
        "Sir/Madam,",
        "I wish to bring the following facts to your attention:",
        input.facts,
        "",
        "I request that the matter be reviewed and appropriate action be taken:",
        input.relief,
        "",
        "Attachments: [List only documents actually available]",
        "",
        "Regards,",
        "[Name and contact details]",
      ].join("\n");
}
