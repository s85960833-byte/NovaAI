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
  if (hasDocument || /\b(read|summarize|analyse|analyze|explain|extract)\b.{0,40}\b(pdf|document|file)\b|\b(pdf|docx|xlsx)\s+(?:export|download)\b/i.test(lower)) {
    return { intent: 'document/PDF', hasLiveData, hasImage, hasDocument };
  }

  if (/\b(deep research|in[- ]depth research|comprehensive research|research dossier|exhaustive research|research report)\b/i.test(lower)) {
    return { intent: 'deep-research', hasLiveData, hasImage, hasDocument };
  }
  if (/\b(?:build|create|make|develop|generate)\s+(?:me\s+)?(?:(?:a|an|the)\s+)?(?:website|web site|web app|site|mobile app|android app|ios app|application|saas)\b|\b(?:app builder|website builder|publish (?:a|my|this) site)\b/i.test(lower)) {
    return { intent: 'build-app/site', hasLiveData, hasImage, hasDocument };
  }
  if (/\b(?:agent task|run an? agent|multi[- ]step task|run this end[- ]to[- ]end|monitor this|keep monitoring|schedule this task|research,? compare,? (?:write|draft),? and export)\b/i.test(lower)) {
    return { intent: 'agent-task', hasLiveData, hasImage, hasDocument };
  }
  if (/\b(?:write|create|improve|rewrite|optimise|optimize|craft)\s+(?:me\s+)?(?:(?:a|an|the)\s+)?prompt\b|\bprompt[- ](?:writer|improver|engineering)\b/i.test(lower)) {
    return { intent: 'prompt-writing', hasLiveData, hasImage, hasDocument };
  }
  if (/\b(?:debug|fix (?:this )?(?:code|bug)|write (?:some )?code|generate code|program|script|function|compile|typescript|javascript|python code|java code|c\+\+ code)\b|\`\`\`/.test(lower)) {
    return { intent: 'code', hasLiveData, hasImage, hasDocument };
  }
  if (/\b(?:generate|create|make|design)\s+(?:me\s+)?(?:(?:a|an|the)\s+)?(?:image|picture|poster|logo|thumbnail|illustration)\b|\bimage studio\b/i.test(lower)) {
    return { intent: 'image', hasLiveData, hasImage, hasDocument };
  }

  if (hasLiveData || /\b(?:latest|current|today|right now|news|breaking|price|prices|live score|weather|forecast|exam results?|government scheme|updated this week)\b|\u0906\u091c|\u0905\u092d\u0940|\u0924\u093e\u091c\u093c\u093e|\u0924\u093e\u091c\u093e|\u0916\u092c\u0930|\u092e\u094c\u0938\u092e|\u092f\u094b\u091c\u0928\u093e|\u092a\u0930\u0940\u0915\u094d\u0937\u093e \u092a\u0930\u093f\u0923\u093e\u092e/i.test(lower)) {
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
