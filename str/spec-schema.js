'use strict';

const KINDS = new Set(['shop','coaching','tiffin','freelancer','portfolio','event','tool','other']);
const CONTENT_LANGS = new Set(['hi','hinglish','en']);
const UI_LANGS = new Set(['hi','en']);
const SECTION_TYPES = new Set(['hero','list','grid','form','faq','contact','map','footer','calculator','tracker','features','custom']);
const FEATURES = new Set(['whatsapp','call','contact_form','gallery','price_list','calculator','booking_form','share','qr','quiz','tracker']);
const ROOT_KEYS = ['v','name','kind','content_lang','ui_lang_at_creation','theme','colors','fonts','pages','features','contact','seo','assumed','placeholders','unsafe'];
const MAX_SPEC_BYTES = 48 * 1024;
const MAX_TOTAL_SECTIONS = 60;
const MAX_ASSUMPTIONS = 40;
const MAX_PLACEHOLDERS = 40;

function object(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function shortString(value, max = 300) { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }
function bilingual(value, max = 300) {
  if (!object(value)) return false;
  const allowed = new Set(['hi', 'en', 'hinglish']);
  if (Object.keys(value).some(key => !allowed.has(key))) return false;
  if (!shortString(value.hi, max) || !shortString(value.en, max)) return false;
  if (Object.prototype.hasOwnProperty.call(value, 'hinglish') && !shortString(value.hinglish, max)) return false;
  return true;
}

function validateSpec(spec) {
  const errors = [];
  if (!object(spec)) return { valid: false, errors: ['spec_must_be_object'] };
  let serializedBytes;
  try { serializedBytes = Buffer.byteLength(JSON.stringify(spec), 'utf8'); } catch { return { valid: false, errors: ['spec_not_serializable'] }; }
  if (serializedBytes > MAX_SPEC_BYTES) errors.push('spec_too_large');
  const keys = Object.keys(spec);
  if (keys.length !== ROOT_KEYS.length || ROOT_KEYS.some(key => !Object.prototype.hasOwnProperty.call(spec,key)) || keys.some(key => !ROOT_KEYS.includes(key))) errors.push('root_keys_invalid');
  if (spec.v !== 1) errors.push('version_invalid');
  if (!shortString(spec.name,100)) errors.push('name_invalid');
  if (!KINDS.has(spec.kind)) errors.push('kind_invalid');
  if (!CONTENT_LANGS.has(spec.content_lang)) errors.push('content_lang_invalid');
  if (!UI_LANGS.has(spec.ui_lang_at_creation)) errors.push('ui_lang_invalid');
  if (!['str-default','custom'].includes(spec.theme)) errors.push('theme_invalid');
  if (!object(spec.colors) || ['primary','accent','bg','text'].some(k => typeof spec.colors[k] !== 'string' || !/^#[0-9a-f]{6}$/i.test(spec.colors[k]))) errors.push('colors_invalid');
  if (!object(spec.fonts) || !shortString(spec.fonts.hi,80) || !shortString(spec.fonts.en,80)) errors.push('fonts_invalid');
  if (!Array.isArray(spec.pages) || spec.pages.length < 1 || spec.pages.length > 10) errors.push('pages_invalid');
  const pageIds = new Set(), sectionIds = new Set();
  let totalSections = 0;
  if (Array.isArray(spec.pages)) for (const page of spec.pages) {
    if (!object(page) || !shortString(page.id,80) || pageIds.has(page.id) || !bilingual(page.title,120) || !Array.isArray(page.sections) || page.sections.length < 1 || page.sections.length > 20) { errors.push('page_invalid'); continue; }
    pageIds.add(page.id);
    totalSections += page.sections.length;
    for (const section of page.sections) {
      if (!object(section) || !shortString(section.id,80) || sectionIds.has(section.id) ||
          !SECTION_TYPES.has(section.type) || !object(section.content) ||
          Object.keys(section.content).length !== 2 ||
          !Object.prototype.hasOwnProperty.call(section.content, 'heading') ||
          !Object.prototype.hasOwnProperty.call(section.content, 'body') ||
          !bilingual(section.content.heading, 160) || !bilingual(section.content.body, 600)) errors.push('section_invalid');
      else sectionIds.add(section.id);
    }
  }
  if (totalSections > MAX_TOTAL_SECTIONS) errors.push('too_many_sections');
  if (!Array.isArray(spec.features) || spec.features.length > FEATURES.size || new Set(spec.features).size !== spec.features.length || spec.features.some(x => !FEATURES.has(x))) errors.push('features_invalid');
  if (!object(spec.contact) || Object.keys(spec.contact).some(k => !['phone','whatsapp','address','hours'].includes(k)) || ['phone','whatsapp','address','hours'].some(k => spec.contact[k] !== undefined && (typeof spec.contact[k] !== 'string' || spec.contact[k].length > 160))) errors.push('contact_invalid');
  if (!object(spec.seo) || !bilingual(spec.seo.title,120) || !bilingual(spec.seo.desc,300)) errors.push('seo_invalid');
  if (!Array.isArray(spec.assumed) || spec.assumed.length > MAX_ASSUMPTIONS || spec.assumed.some(x => !object(x) || !shortString(x.field,80) || !shortString(x.value,200) || !bilingual(x.why,200))) errors.push('assumed_invalid');
  if (!Array.isArray(spec.placeholders) || spec.placeholders.length > MAX_PLACEHOLDERS || spec.placeholders.some(x => !shortString(x,120))) errors.push('placeholders_invalid');
  if (!Array.isArray(spec.unsafe) || spec.unsafe.some(x => !shortString(x,80))) errors.push('unsafe_invalid');
  if (Array.isArray(spec.unsafe) && spec.unsafe.length) errors.push('unsafe_request');
  return { valid: errors.length === 0, errors };
}

module.exports = { validateSpec, ROOT_KEYS, KINDS, CONTENT_LANGS, UI_LANGS, SECTION_TYPES, FEATURES, MAX_SPEC_BYTES, MAX_TOTAL_SECTIONS };
