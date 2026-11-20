'use strict';

const RULES = [
  {
    code: 'credential_collection',
    patterns: [
      /(?:otp|one[- ]time password|bank password|बैंक पासवर्ड|card number|कार्ड नंबर|credit card|debit card|aadhaar|आधार).{0,100}(?:collect|capture|store|save|ask|request|माँग|मांग|मांगे|सेव|सहेज|जमा)/iu,
      /(?:collect|capture|store|save|ask|request|माँग|मांग|मांगे|सेव|सहेज|जमा).{0,100}(?:otp|one[- ]time password|bank password|बैंक पासवर्ड|card number|कार्ड नंबर|credit card|debit card|aadhaar|आधार)/iu
    ],
    hi: 'यह अनुरोध लोगों के OTP, बैंक या कार्ड की गोपनीय जानकारी इकट्ठा करने से जुड़ा है। STR इसे बनाने में मदद नहीं कर सकता।',
    en: 'This request would collect OTPs or sensitive bank/card credentials. STR cannot help build that.'
  },
  {
    code: 'impersonation',
    patterns: [
      /impersonat(?:e|ing|ion).{0,60}(?:bank|government|person|brand)/iu,
      /(?:नकली|नकल).{0,40}(?:बैंक|सरकार|सरकारी वेबसाइट|व्यक्ति)/iu
    ],
    hi: 'किसी बैंक, सरकार या वास्तविक व्यक्ति की नकल करने वाली साइट बनाना स्वीकार्य नहीं है।',
    en: 'STR cannot build a page that impersonates a bank, government service or real person.'
  },
  {
    code: 'malware_or_spam',
    patterns: [/(?:malware|ransomware|phishing|spam bot|bulk spam|virus|कीलॉगर|मैलवेयर|फिशिंग|स्पैम बॉट)/iu],
    hi: 'यह अनुरोध नुकसान पहुँचाने वाले सॉफ़्टवेयर या स्पैम से जुड़ा है।',
    en: 'This request involves malware, phishing or spam.'
  },
  {
    code: 'gambling',
    patterns: [/(?:gambling|casino|sports betting|betting site|सट्टा|जुआ|जुए की वेबसाइट)/iu],
    hi: 'इस owner-only setup में जुआ या betting से जुड़ी साइट बनाने की अनुमति नहीं है।',
    en: 'Gambling and betting builds are not enabled in this owner-only setup.'
  },
  {
    code: 'medical_or_legal_certainty',
    patterns: [/(?:guaranteed medical diagnosis|certain legal advice|पक्का इलाज|निश्चित कानूनी सलाह|गारंटी वाला इलाज)/iu],
    hi: 'STR निश्चित चिकित्सा निदान या कानूनी सलाह देने वाली साइट नहीं बनाएगा।',
    en: 'STR cannot create a site that presents medical diagnoses or legal advice as certain.'
  },
  {
    code: 'sexual_content_involving_minors',
    patterns: [/(?:sexual|explicit).{0,60}(?:minor|child|underage)|(?:minor|child|underage).{0,60}(?:sexual|explicit)|नाबालिग.{0,40}(?:यौन|अश्लील)/iu],
    hi: 'नाबालिगों से जुड़ी यौन सामग्री में STR सहायता नहीं कर सकता।',
    en: 'STR cannot assist with sexual content involving minors.'
  }
];

function classifyPrompt(value) {
  const prompt = typeof value === 'string' ? value.slice(0, 1000) : '';
  const matches = RULES.filter(rule => rule.patterns.some(pattern => pattern.test(prompt)));
  return {
    unsafe: matches.map(rule => rule.code),
    messages: matches.map(rule => ({ code: rule.code, hi: rule.hi, en: rule.en }))
  };
}

module.exports = { classifyPrompt };
