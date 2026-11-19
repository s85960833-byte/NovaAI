'use strict';

const { validateSpec } = require('./spec-schema');

const DEFAULT_COLORS = { primary: '#1E1B4B', accent: '#F59E0B', bg: '#F8FAFC', text: '#0F172A' };
const DEFAULT_FONTS = { hi: 'Noto Sans Devanagari', en: 'Inter' };

const KIND_WORDS = [
  ['tiffin', /tiffin|टिफिन|टिफ़िन|घर का खाना|डब्बा/i],
  ['coaching', /coaching|tuition|tuition|batch|classes|कक्षा|ट्यूशन|कोचिंग|पढ़ाता|पढ़ाता/i],
  ['portfolio', /portfolio|photographer|photography|gallery|फोटोग्राफर|फोटोग्राफ़र|फोटो|फ़ोटो|तस्वीर/i],
  ['event', /wedding|invitation|rsvp|event|शादी|निमंत्रण|आमंत्रण|इवेंट/i],
  ['tool', /calculator|tracker|to-do|todo|quiz|emi|attendance|खर्च|ट्रैकर|कैलकुलेटर|क्विज़|उपस्थिति|सूची ऐप/i],
  ['freelancer', /freelancer|electrician|plumber|repair|service provider|इलेक्ट्रीशियन|बिजली मिस्त्री|प्लंबर|मरम्मत|सेवाएँ/i],
  ['shop', /shop|store|kirana|restaurant|dhaba|menu|दुकान|किराना|रेस्टोरेंट|ढाबा|मेन्यू|मेनू|ऑर्डर/i]
];

function has(text, pattern) { return pattern.test(text); }
function bilingual(hi, en) { return { hi, en }; }

function extractName(prompt) {
  const patterns = [
    /(?:नाम|name)\s*(?:(?:है|is)\s*)?[:：-]?\s*([^,।.!?\n]{2,80})/iu,
    /(?:business|shop|brand)\s+name\s*[:：-]?\s*([^,।.!?\n]{2,80})/iu
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim().replace(/\s+/g, ' ').slice(0, 100);
      if (value && !/^(?:placeholder|बाद में|बादमे)$/iu.test(value)) return value;
    }
  }
  return '';
}

function inferKind(prompt) {
  for (const [kind, pattern] of KIND_WORDS) if (has(prompt, pattern)) return kind;
  return 'other';
}

function detectFeatures(prompt, kind) {
  const features = [];
  if (has(prompt, /whatsapp|व्हाट्स.?ऐप|व्हाट्सएप|wa\.me/i)) features.push('whatsapp');
  if (has(prompt, /emergency|call button|phone button|कॉल बटन|आपातकाल|इमरजेंसी/i)) features.push('call');
  if (has(prompt, /appointment|booking|reservation|rsvp|registration|फ़ॉर्म|फॉर्म|form|पंजीकरण/i)) features.push('booking_form');
  if (has(prompt, /gallery|12 photos|photos|फोटो|फ़ोटो|गैलरी|चित्र/i)) features.push('gallery');
  if (has(prompt, /price|pricing|fees|fee|₹|रुपये|फीस|फ़ीस|कीमत|मासिक/i)) features.push('price_list');
  if (has(prompt, /calculator|emi|कैलकुलेटर|गणना/i)) features.push('calculator');
  if (has(prompt, /quiz|प्रश्नों? की|प्रश्न|क्विज़|क्विज/i)) features.push('quiz');
  if (has(prompt, /tracker|to-do|todo|attendance|ट्रैकर|उपस्थिति|खर्च ट्रैकर/i)) features.push('tracker');
  if (has(prompt, /share|साझा|शेयर/i)) features.push('share');
  if (features.includes('booking_form')) features.push('contact_form');
  if (kind === 'shop' && has(prompt, /order|ऑर्डर/)) features.push('contact_form');
  return [...new Set(features)];
}

function detectContact(prompt) {
  const digits = (prompt.match(/(?:\+?91[\s-]?)?[6-9]\d(?:[\s-]?\d){8}/) || [''])[0];
  const hourMatch = prompt.match(/(?:सुबह|प्रातः|दोपहर|शाम|रात)\s*\d{1,2}(?::\d{2})?\s*(?:से|to|तक|-)?\s*(?:(?:रात|शाम|सुबह)\s*)?\d{1,2}(?::\d{2})?\s*(?:बजे)?/iu);
  return {
    phone: digits.trim(),
    whatsapp: has(prompt, /whatsapp|व्हाट्स.?ऐप|व्हाट्सएप/i) ? digits.trim() : '',
    address: '',
    hours: hourMatch ? hourMatch[0].trim() : ''
  };
}

function makeSection(id, type, hiHeading, enHeading, hiBody, enBody) {
  return {
    id,
    type,
    content: {
      heading: bilingual(hiHeading, enHeading),
      body: bilingual(hiBody, enBody)
    }
  };
}

function buildSections(kind, features) {
  const sections = [
    makeSection(
      'hero', 'hero', 'आपका स्वागत है', 'Welcome',
      'यहाँ अपने काम या व्यवसाय का परिचय दें।', 'Introduce your work or business here.'
    )
  ];

  const listCopy = kind === 'coaching'
    ? ['कक्षाएँ और बैच', 'Classes and batches', 'पढ़ाए जाने वाले विषय और बैच का विवरण यहाँ जोड़ें।', 'Add the subjects and batch details here.']
    : kind === 'tiffin'
      ? ['टिफिन और मेन्यू', 'Tiffin and menu', 'मेन्यू और उपलब्ध भोजन की जानकारी यहाँ जोड़ें।', 'Add menu items and available meals here.']
      : kind === 'shop'
        ? ['उत्पाद और सेवाएँ', 'Products and services', 'उत्पाद, सेवाएँ और उनकी जानकारी यहाँ जोड़ें।', 'Add products, services and their details here.']
        : kind === 'portfolio'
          ? ['काम का नमूना', 'Work samples', 'अपने काम के नमूने और विवरण यहाँ दिखाएँ।', 'Show samples of your work and descriptions here.']
          : ['मुख्य जानकारी', 'Key information', 'ज़रूरी जानकारी और विवरण यहाँ जोड़ें।', 'Add the key information and details here.'];
  sections.push(makeSection('details', 'list', ...listCopy));

  if (features.includes('gallery')) {
    sections.push(makeSection('gallery', 'grid', 'गैलरी', 'Gallery', 'अपनी तस्वीरें यहाँ जोड़ें।', 'Add your photos here.'));
  }
  if (features.includes('price_list')) {
    sections.push(makeSection('prices', 'list', 'कीमत और शुल्क', 'Prices and fees', 'सही कीमतें मिलने पर यहाँ जोड़ें।', 'Add verified prices here.'));
  }
  if (features.includes('calculator')) {
    sections.push(makeSection('calculator', 'calculator', 'कैलकुलेटर', 'Calculator', 'गणना के नियम और इनपुट की समीक्षा करें।', 'Review the calculation rules and inputs.'));
  }
  if (features.includes('tracker')) {
    sections.push(makeSection('tracker', 'tracker', 'ट्रैकर', 'Tracker', 'यह भाग डिवाइस पर काम करने वाले ट्रैकर के लिए है।', 'This section is intended for an on-device tracker.'));
  }
  if (features.includes('quiz')) {
    sections.push(makeSection('quiz', 'custom', 'प्रश्नोत्तरी', 'Quiz', 'प्रश्न और सही उत्तर बाद में जोड़ें।', 'Add questions and correct answers later.'));
  }
  if (features.includes('booking_form') || features.includes('contact_form')) {
    sections.push(makeSection('form', 'form', 'संपर्क / अनुरोध फ़ॉर्म', 'Contact / request form', 'फ़ॉर्म के फ़ील्ड और उन्हें संभालने का तरीका तय करना बाकी है।', 'The form fields and handling method still need to be decided.'));
  }
  if (features.length) {
    sections.push(makeSection(
      'features', 'features', 'अनुरोधित सुविधाएँ', 'Requested features',
      'ये सुविधाएँ योजना में शामिल हैं; इनके interactive integrations अभी लागू नहीं हैं।',
      'These requested features are listed for planning; interactive integrations are not implemented in this local preview.'
    ));
  }
  sections.push(makeSection('contact', 'contact', 'संपर्क करें', 'Contact', 'संपर्क जानकारी भरें।', 'Add contact information.'));
  sections.push(makeSection('footer', 'footer', 'धन्यवाद', 'Thank you', 'यहाँ व्यवसाय का नाम और ज़रूरी लिंक दिखेंगे।', 'The business name and useful links will appear here.'));
  return sections;
}

function buildAssumptions(prompt, name, kind, features, contact) {
  const assumed = [];
  if (!name) assumed.push({
    field: 'project_name', value: 'Untitled Project',
    why: bilingual('आपने नाम नहीं बताया; अभी अस्थायी नाम रखा गया है।', 'No name was supplied; a temporary name is used for now.')
  });
  if (!contact.phone) assumed.push({
    field: 'contact.phone', value: 'Not supplied',
    why: bilingual('फ़ोन नंबर नहीं दिया गया; इसे खाली रखा गया है।', 'No phone number was supplied; this field is left blank.')
  });
  if (!contact.address) assumed.push({
    field: 'contact.address', value: 'Not supplied',
    why: bilingual('पता नहीं दिया गया; कोई पता अनुमान से नहीं जोड़ा गया।', 'No address was supplied; none has been invented.')
  });
  if (!contact.hours) assumed.push({
    field: 'contact.hours', value: 'Not supplied',
    why: bilingual('समय नहीं दिया गया; समय का अनुमान नहीं लगाया गया।', 'Opening hours were not supplied and have not been guessed.')
  });
  if (!has(prompt, /₹|price|pricing|fees|fee|कीमत|फीस|फ़ीस|रुपये/i)) assumed.push({
    field: 'pricing', value: 'No prices added',
    why: bilingual('कीमतें नहीं दी गईं; कोई कीमत नहीं बनाई गई।', 'No prices were supplied; none have been invented.')
  });
  assumed.push({
    field: 'design_theme', value: 'STR default theme',
    why: bilingual('अलग रंग या डिज़ाइन नहीं बताया गया; STR का डिफ़ॉल्ट थीम चुना गया।', 'No custom colors or design were specified; the STR default theme is selected.')
  });
  assumed.push({
    field: 'features', value: features.length ? features.join(', ') : 'Basic information page',
    why: bilingual('केवल बताए गए फ़ीचर शामिल किए गए हैं; बाकी को डिफ़ॉल्ट रूप से चालू नहीं किया गया।', 'Only requested features are included; other features are not enabled by default.')
  });
  if (kind === 'other') assumed.push({
    field: 'project_type', value: 'General information page',
    why: bilingual('प्रॉम्प्ट से प्रोजेक्ट का प्रकार स्पष्ट नहीं हुआ; सामान्य पेज का प्रारूप रखा गया।', 'The project type was unclear, so a general page structure is used.')
  });
  return assumed;
}

function buildPlaceholders(features, contact) {
  const values = [];
  if (!contact.phone) values.push('Contact phone number');
  if (!contact.address) values.push('Business or service address');
  if (!contact.hours) values.push('Opening or service hours');
  if (features.includes('whatsapp') && !contact.whatsapp) values.push('WhatsApp number for orders');
  if (features.includes('gallery')) values.push('Gallery photos and captions');
  if (features.includes('booking_form')) values.push('Booking form fields and submission method');
  if (features.includes('price_list')) values.push('Verified prices and fees');
  if (features.includes('calculator')) values.push('Confirmed formula, units and example values');
  if (features.includes('quiz')) values.push('Question set and correct answers');
  if (!values.length) values.push('Owner-approved contact details');
  return [...new Set(values)];
}

function generateLocalSpec({ prompt, uiLang, contentLang }) {
  const clean = String(prompt || '').trim().replace(/\s+/g, ' ').slice(0, 1000);
  const kind = inferKind(clean);
  const suppliedName = extractName(clean);
  const name = (suppliedName || 'Untitled Project').slice(0, 100);
  const features = detectFeatures(clean, kind);
  const contact = detectContact(clean);
  const sections = buildSections(kind, features);
  const spec = {
    v: 1,
    name,
    kind,
    content_lang: contentLang,
    ui_lang_at_creation: uiLang,
    theme: 'str-default',
    colors: { ...DEFAULT_COLORS },
    fonts: { ...DEFAULT_FONTS },
    pages: [{
      id: 'home',
      title: bilingual('मुख्य पृष्ठ', 'Home'),
      sections
    }],
    features,
    contact,
    seo: {
      title: bilingual(name, name),
      desc: bilingual('जानकारी और सेवाओं का आधिकारिक पृष्ठ।', 'An information page for services and key details.')
    },
    assumed: buildAssumptions(clean, suppliedName, kind, features, contact),
    placeholders: buildPlaceholders(features, contact),
    unsafe: []
  };
  const validation = validateSpec(spec);
  if (!validation.valid) {
    const error = new Error('Local STR spec failed schema validation: ' + validation.errors.join(','));
    error.code = 'STR_LOCAL_SPEC_INVALID';
    throw error;
  }
  return spec;
}

module.exports = { generateLocalSpec, inferKind, detectFeatures, extractName };
