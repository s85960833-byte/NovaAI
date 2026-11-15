'use strict';

(function attachNovaQualityRoute(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.NovaQualityRoute = api;
})(typeof window !== 'undefined' ? window : globalThis, function buildNovaQualityRoute() {
  const DEEP_RESEARCH = /\b(?:deep research|in[- ]depth research|comprehensive research|research report|research dossier|literature review)\b|गहन\s*(?:शोध|रिसर्च)|विस्तृत\s*(?:शोध|रिसर्च)|\b(?:deep research|research report)\b.{0,24}\b(?:banao|karo|likho)\b/i;
  const CODE_REQUEST = /\b(?:write|generate|debug|fix|refactor|review|compile|run|create)\b.{0,48}\b(?:code|python|javascript|typescript|java|c\+\+|function|script|program|sql|bug)\b|\b(?:code|python|javascript|typescript|java|c\+\+|function|script|program|sql|bug)\b.{0,48}\b(?:write|generate|debug|fix|refactor|review|compile|create)\b|(?:कोड|प्रोग्राम|स्क्रिप्ट|बग).{0,35}(?:लिखो|लिखिए|बनाओ|बना दो|ठीक करो|सुधारो|डीबग करो)|(?:लिखो|लिखिए|बनाओ|बना दो|ठीक करो|सुधारो|डीबग करो).{0,35}(?:कोड|प्रोग्राम|स्क्रिप्ट|बग)|\b(?:code|python|javascript|program|bug)\b.{0,25}\b(?:likho|banao|theek karo|sudhar|debug karo)\b/i;

  function requiresVerifiedTier2Request(value) {
    const text = String(value || '').trim();
    if (!text) return false;
    return text.includes('```') || DEEP_RESEARCH.test(text) || CODE_REQUEST.test(text);
  }

  return Object.freeze({ requiresVerifiedTier2Request });
});
