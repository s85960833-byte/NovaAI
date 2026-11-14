'use strict';

const ROUTES = Object.freeze([
  'chat',
  'live-search',
  'deep-research',
  'code',
  'prompt-writing',
  'document/PDF',
  'image',
  'voice',
  'build-app/site',
  'agent-task'
]);

const ROUTE_POLICY = Object.freeze({
  chat: {
    capabilityStatus: 'available',
    execution: 'llm-chat',
    instruction: ''
  },
  'live-search': {
    capabilityStatus: 'preview',
    execution: 'chat-with-live-context',
    withData: 'Live retrieval context is attached. Use only the supplied retrieved text and numbered sources. Cite only source numbers that actually exist in the context; never invent a citation.',
    withoutData: 'A current-information request was detected, but no verified live retrieval context was supplied. Do not claim that a search was performed. State that current information could not be verified.'
  },
  'deep-research': {
    capabilityStatus: 'not_implemented',
    execution: 'single-response-chat-fallback',
    instruction: 'A durable deep-research workflow is not implemented. You may provide a bounded one-response analysis using only the sources actually present, but do not claim exhaustive research, multi-agent review, automatic monitoring, or a finished research report that was not produced.'
  },
  code: {
    capabilityStatus: 'chat_assisted',
    execution: 'llm-chat',
    instruction: 'Code assistance is provided in chat. Do not claim that code was executed, compiled, deployed, or tested unless a real tool result in this request proves it.'
  },
  'prompt-writing': {
    capabilityStatus: 'chat_assisted',
    execution: 'llm-chat',
    instruction: 'Prompt-writing assistance is provided in chat. Do not claim the prompt was executed or benchmarked on the target model unless that actually happened.'
  },
  'document/PDF': {
    capabilityStatus: 'partial',
    execution: 'document-context-chat',
    withDocument: 'A supplied document context is present. Answer from the supplied text, identify missing pages or uncertain extraction, and do not claim a downloadable PDF/DOCX/XLSX export unless an actual file has been generated.',
    withoutDocument: 'A document or PDF workflow was requested, but no document context was supplied. Ask for the file or provide a text-only draft. Do not claim a PDF export has been generated.'
  },
  image: {
    capabilityStatus: 'partial',
    execution: 'vision-or-image-studio',
    withInput: 'An image input is attached. Interpret it only if the configured vision provider actually returns an answer; do not imply that OCR, image analysis, or generation succeeded otherwise.',
    withoutInput: 'Image generation is not handled by this chat-completion route. Do not claim an image was generated. Explain that the dedicated Image Studio route must be available and configured.'
  },
  voice: {
    capabilityStatus: 'partial',
    execution: 'transcribed-text-chat',
    instruction: 'This request is marked as voice-originated text. Answer in the detected or requested language. Do not claim audio playback or live voice delivery unless the client confirms it.'
  },
  'build-app/site': {
    capabilityStatus: 'not_implemented',
    execution: 'code-assistance-only',
    instruction: 'The interactive Nova Build runtime, live preview, chat-based project editing, ZIP export and publish pipeline are not implemented. You may provide code or a project plan, but must not claim a working preview, exported app, or published site.'
  },
  'agent-task': {
    capabilityStatus: 'not_implemented',
    execution: 'single-response-only',
    instruction: 'A durable, resumable Nova Agent runtime is not implemented. Perform only work that can be completed in this response; do not promise background execution, scheduled monitoring, or a later delivery.'
  }
});

function plainText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map(part => {
    if (!part || typeof part !== 'object') return '';
    if (typeof part.text === 'string') return part.text;
    if (typeof part.input_text === 'string') return part.input_text;
    return '';
  }).join('\n');
}

function getMessages(body) {
  return Array.isArray(body && body.messages) ? body.messages : [];
}

function latestUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i] && messages[i].role === 'user') {
      return plainText(messages[i].content).slice(0, 4000);
    }
  }
  return '';
}

function containsImage(messages) {
  return messages.some(message => {
    const content = message && message.content;
    if (!Array.isArray(content)) return false;
    return content.some(part => part && typeof part === 'object' && (
      part.type === 'image_url' ||
      part.type === 'input_image' ||
      Object.prototype.hasOwnProperty.call(part, 'image_url')
    ));
  });
}

function hasDocumentContext(messages) {
  const system = messages
    .filter(message => message && message.role === 'system')
    .map(message => plainText(message.content))
    .join('\n');
  return /uploaded document\s*\(|uploaded file context|attached document context|document extraction:/i.test(system);
}

function selectIntent(body = {}) {
  const messages = getMessages(body);
  const text = latestUserText(messages).trim();
  const lower = text.toLowerCase();
  const systemText = messages
    .filter(message => message && message.role === 'system')
    .map(message => plainText(message.content))
    .join('\n');
  const hasLiveData = systemText.includes('== LIVE DATA ==');
  const hasImage = containsImage(messages);
  const hasDocument = hasDocumentContext(messages);
  const voiceOrigin = body.novaInputMode === 'voice' || body.inputSource === 'voice';

  if (voiceOrigin) return { intent: 'voice', hasLiveData, hasImage, hasDocument };
  if (hasImage) return { intent: 'image', hasLiveData, hasImage, hasDocument };

  // Keep bilingual patterns explicit so common Hindi and Hinglish requests
  // take the same honest route as their English equivalents.
  const asksForDocument = hasDocument || /\b(read|summarize|analyse|analyze|explain|extract)\b.{0,50}\b(pdf|document|file|notice)\b|\b(pdf|docx|xlsx)\s+(?:export|download)\b|\b(?:pdf|document|file|notice)\b.{0,40}\b(?:samjhao|padho|summary|saar)\b|(?:पीडीएफ|दस्तावेज़|दस्तावेज|डॉक्यूमेंट|फाइल|नोटिस).{0,45}(?:समझाओ|समझाइए|पढ़ो|पढ़िए|सार|व्याख्या|बना दो|डाउनलोड)/i.test(lower);
  if (asksForDocument) {
    return { intent: 'document/PDF', hasLiveData, hasImage, hasDocument };
  }

  if (/\b(deep research|in[- ]depth research|comprehensive research|research dossier|exhaustive research|research report)\b|(?:गहन|गहराई से|विस्तृत).{0,20}(?:रिसर्च|शोध)|(?:रिसर्च|शोध).{0,20}(?:रिपोर्ट|विस्तार से)/i.test(lower)) {
    return { intent: 'deep-research', hasLiveData, hasImage, hasDocument };
  }

  if (/\b(?:build|create|make|develop|generate)\s+(?:me\s+)?(?:(?:a|an|the)\s+)?(?:website|web site|web app|site|mobile app|android app|ios app|application|saas)\b|\b(?:app builder|website builder|publish (?:a|my|this) site)\b|(?:वेबसाइट|वेब\s*साइट|वेब\s*ऐप|मोबाइल\s*ऐप|ऐप|एप्लिकेशन|साइट).{0,25}(?:बनाओ|बना दो|तैयार करो|बनाकर दो)|(?:बनाओ|बना दो|तैयार करो).{0,25}(?:वेबसाइट|वेब\s*साइट|वेब\s*ऐप|मोबाइल\s*ऐप|ऐप|साइट)|\b(?:website|web app|mobile app|site|app)\b.{0,25}\b(?:banao|bana do|taiyar karo)\b|\b(?:banao|bana do|taiyar karo)\b.{0,25}\b(?:website|web app|mobile app|site|app)\b/i.test(lower)) {
    return { intent: 'build-app/site', hasLiveData, hasImage, hasDocument };
  }

  if (/\b(?:agent task|run an? agent|multi[- ]step task|run this end[- ]to[- ]end|monitor this|keep monitoring|schedule this task|research,? compare,? (?:write|draft),? and export)\b|एजेंट.{0,25}(?:चलाओ|टास्क|शुरू करो)|(?:निगरानी|मॉनिटरिंग).{0,20}(?:करो|रखो|करते रहो)|\b(?:agent|monitoring)\b.{0,25}\b(?:chalao|karo|rakhna)\b/i.test(lower)) {
    return { intent: 'agent-task', hasLiveData, hasImage, hasDocument };
  }

  if (/\b(?:write|create|improve|rewrite|optimise|optimize|craft)\s+(?:me\s+)?(?:(?:a|an|the)\s+)?prompt\b|\bprompt[- ](?:writer|improver|engineering)\b|(?:प्रॉम्प्ट|prompt).{0,25}(?:लिखो|बनाओ|सुधारो|बेहतर करो)|(?:लिखो|बनाओ|सुधारो|बेहतर करो).{0,25}(?:प्रॉम्प्ट|prompt)|\bprompt\b.{0,25}\b(?:likho|banao|sudhar|behtar karo)\b/i.test(lower)) {
    return { intent: 'prompt-writing', hasLiveData, hasImage, hasDocument };
  }

  if (/\b(?:debug|fix (?:this )?(?:code|bug)|write (?:some )?code|generate code|program|script|function|compile|typescript|javascript|python code|java code|c\+\+ code)\b|(?:कोड|बग|प्रोग्राम).{0,25}(?:लिखो|बनाओ|ठीक करो|सुधारो|डीबग करो)|(?:लिखो|बनाओ|ठीक करो|सुधारो|डीबग करो).{0,25}(?:कोड|प्रोग्राम)|\b(?:code|bug)\b.{0,25}\b(?:likho|banao|theek karo|sudhar)\b/i.test(lower) || lower.includes('```')) {
    return { intent: 'code', hasLiveData, hasImage, hasDocument };
  }

  if (/\b(?:generate|create|make|design)\s+(?:me\s+)?(?:(?:a|an|the)\s+)?(?:image|picture|poster|logo|thumbnail|illustration)\b|\bimage studio\b|(?:इमेज|तस्वीर|फोटो|पोस्टर|लोगो|थंबनेल).{0,20}(?:बनाओ|बना दो|तैयार करो)|(?:बनाओ|बना दो|तैयार करो).{0,20}(?:इमेज|तस्वीर|पोस्टर|लोगो|थंबनेल)|\b(?:image|poster|logo|thumbnail)\b.{0,20}\b(?:banao|bana do)\b/i.test(lower)) {
    return { intent: 'image', hasLiveData, hasImage, hasDocument };
  }

  if (hasLiveData || /\b(?:latest|current|today|right now|news|breaking|price|prices|live score|weather|forecast|exam results?|government scheme|updated this week)\b|आज\s*(?:का|की|के|की तारीख)|अभी|ताज़ा|ताजा|लेटेस्ट|नवीनतम|वर्तमान|खबर|समाचार|मौसम|कीमत|भाव|लाइव\s*स्कोर|सरकारी\s*योजना|परीक्षा\s*(?:का\s*)?(?:परिणाम|रिजल्ट)|\b(?:aaj ka|aaj ki|abhi ka|latest|taaza|mausam|khabar|keemat|bhav)\b/i.test(lower)) {
    return { intent: 'live-search', hasLiveData, hasImage, hasDocument };
  }

  return { intent: 'chat', hasLiveData, hasImage, hasDocument };
}
function routeNovaMessage(body = {}) {
  const detected = selectIntent(body);
  const policy = ROUTE_POLICY[detected.intent] || ROUTE_POLICY.chat;
  let instruction = policy.instruction || '';

  if (detected.intent === 'live-search') {
    instruction = detected.hasLiveData ? policy.withData : policy.withoutData;
  } else if (detected.intent === 'document/PDF') {
    instruction = detected.hasDocument ? policy.withDocument : policy.withoutDocument;
  } else if (detected.intent === 'image') {
    instruction = detected.hasImage ? policy.withInput : policy.withoutInput;
  }

  return Object.freeze({
    route: detected.intent,
    capabilityStatus: policy.capabilityStatus,
    execution: policy.execution,
    hasLiveData: detected.hasLiveData,
    hasImage: detected.hasImage,
    hasDocument: detected.hasDocument,
    instruction
  });
}

function routeInstruction(decision) {
  if (!decision || !decision.instruction) return '';
  return [
    'NOVA ORCHESTRATOR — ROUTING AND DELIVERY BOUNDARY',
    'Detected route: ' + decision.route,
    'Capability status: ' + decision.capabilityStatus,
    'Execution path: ' + decision.execution,
    decision.instruction
  ].join('\n');
}

module.exports = {
  ROUTES,
  ROUTE_POLICY,
  routeNovaMessage,
  routeInstruction,
  selectIntent
};
