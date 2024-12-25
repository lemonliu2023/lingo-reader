import type { Header } from './types'

export const MIME = {
  XML: 'application/xml',
  XHTML: 'application/xhtml+xml',
  HTML: 'text/html',
  CSS: 'text/css',
  SVG: 'image/svg+xml',
}

export const PDB_HEADER: Header = {
  name: [0, 32, 'string'],
  type: [60, 4, 'string'],
  creator: [64, 4, 'string'],
  numRecords: [76, 2, 'uint'],
}

export const PALMDOC_HEADER: Header = {
  compression: [0, 2, 'uint'],
  numTextRecords: [8, 2, 'uint'],
  recordSize: [10, 2, 'uint'],
  encryption: [12, 2, 'uint'],
}

export const MOBI_HEADER: Header = {
  magic: [16, 4, 'string'],
  length: [20, 4, 'uint'],
  type: [24, 4, 'uint'],
  encoding: [28, 4, 'uint'],
  uid: [32, 4, 'uint'],
  version: [36, 4, 'uint'],
  titleOffset: [84, 4, 'uint'],
  titleLength: [88, 4, 'uint'],
  localeRegion: [94, 1, 'uint'],
  localeLanguage: [95, 1, 'uint'],
  resourceStart: [108, 4, 'uint'],
  huffcdic: [112, 4, 'uint'],
  numHuffcdic: [116, 4, 'uint'],
  exthFlag: [128, 4, 'uint'],
  trailingFlags: [240, 4, 'uint'],
  indx: [244, 4, 'uint'],
}

export const KF8_HEADER: Header = {
  resourceStart: [108, 4, 'uint'],
  fdst: [192, 4, 'uint'],
  numFdst: [196, 4, 'uint'],
  frag: [248, 4, 'uint'],
  skel: [252, 4, 'uint'],
  guide: [260, 4, 'uint'],
}

export const EXTH_HEADER: Header = {
  magic: [0, 4, 'string'],
  length: [4, 4, 'uint'],
  count: [8, 4, 'uint'],
}

export const INDX_HEADER: Header = {
  magic: [0, 4, 'string'],
  length: [4, 4, 'uint'],
  type: [8, 4, 'uint'],
  idxt: [20, 4, 'uint'],
  numRecords: [24, 4, 'uint'],
  encoding: [28, 4, 'uint'],
  language: [32, 4, 'uint'],
  total: [36, 4, 'uint'],
  ordt: [40, 4, 'uint'],
  ligt: [44, 4, 'uint'],
  numLigt: [48, 4, 'uint'],
  numCncx: [52, 4, 'uint'],
}

export const TAGX_HEADER: Header = {
  magic: [0, 4, 'string'],
  length: [4, 4, 'uint'],
  numControlBytes: [8, 4, 'uint'],
}

export const HUFF_HEADER: Header = {
  magic: [0, 4, 'string'],
  offset1: [8, 4, 'uint'],
  offset2: [12, 4, 'uint'],
}

export const CDIC_HEADER: Header = {
  magic: [0, 4, 'string'],
  length: [4, 4, 'uint'],
  numEntries: [8, 4, 'uint'],
  codeLength: [12, 4, 'uint'],
}

export const FDST_HEADER: Header = {
  magic: [0, 4, 'string'],
  numEntries: [8, 4, 'uint'],
}

export const FONT_HEADER: Header = {
  flags: [8, 4, 'uint'],
  dataStart: [12, 4, 'uint'],
  keyLength: [16, 4, 'uint'],
  keyStart: [20, 4, 'uint'],
}

export const MOBI_ENCODING = {
  1252: 'windows-1252',
  65001: 'utf-8',
}

export const EXTH_RECORD_TYPE = {
  100: ['creator', 'string', true],
  101: ['publisher'],
  103: ['description'],
  104: ['isbn'],
  105: ['subject', 'string', true],
  106: ['date'],
  108: ['contributor', 'string', true],
  109: ['rights'],
  110: ['subjectCode', 'string', true],
  112: ['source', 'string', true],
  113: ['asin'],
  121: ['boundary', 'uint'],
  122: ['fixedLayout'],
  125: ['numResources', 'uint'],
  126: ['originalResolution'],
  127: ['zeroGutter'],
  128: ['zeroMargin'],
  129: ['coverURI'],
  132: ['regionMagnification'],
  201: ['coverOffset', 'uint'],
  202: ['thumbnailOffset', 'uint'],
  503: ['title'],
  524: ['language', 'string', true],
  527: ['pageProgressionDirection'],
}

export const MOBI_LANG = {
  1: ['ar', 'ar-SA', 'ar-IQ', 'ar-EG', 'ar-LY', 'ar-DZ', 'ar-MA', 'ar-TN', 'ar-OM', 'ar-YE', 'ar-SY', 'ar-JO', 'ar-LB', 'ar-KW', 'ar-AE', 'ar-BH', 'ar-QA'],
  2: ['bg'],
  3: ['ca'],
  4: ['zh', 'zh-TW', 'zh-CN', 'zh-HK', 'zh-SG'],
  5: ['cs'],
  6: ['da'],
  7: ['de', 'de-DE', 'de-CH', 'de-AT', 'de-LU', 'de-LI'],
  8: ['el'],
  9: ['en', 'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-NZ', 'en-IE', 'en-ZA', 'en-JM', null, 'en-BZ', 'en-TT', 'en-ZW', 'en-PH'],
  10: ['es', 'es-ES', 'es-MX', null, 'es-GT', 'es-CR', 'es-PA', 'es-DO', 'es-VE', 'es-CO', 'es-PE', 'es-AR', 'es-EC', 'es-CL', 'es-UY', 'es-PY', 'es-BO', 'es-SV', 'es-HN', 'es-NI', 'es-PR'],
  11: ['fi'],
  12: ['fr', 'fr-FR', 'fr-BE', 'fr-CA', 'fr-CH', 'fr-LU', 'fr-MC'],
  13: ['he'],
  14: ['hu'],
  15: ['is'],
  16: ['it', 'it-IT', 'it-CH'],
  17: ['ja'],
  18: ['ko'],
  19: ['nl', 'nl-NL', 'nl-BE'],
  20: ['no', 'nb', 'nn'],
  21: ['pl'],
  22: ['pt', 'pt-BR', 'pt-PT'],
  23: ['rm'],
  24: ['ro'],
  25: ['ru'],
  26: ['hr', null, 'sr'],
  27: ['sk'],
  28: ['sq'],
  29: ['sv', 'sv-SE', 'sv-FI'],
  30: ['th'],
  31: ['tr'],
  32: ['ur'],
  33: ['id'],
  34: ['uk'],
  35: ['be'],
  36: ['sl'],
  37: ['et'],
  38: ['lv'],
  39: ['lt'],
  41: ['fa'],
  42: ['vi'],
  43: ['hy'],
  44: ['az'],
  45: ['eu'],
  46: ['hsb'],
  47: ['mk'],
  48: ['st'],
  49: ['ts'],
  50: ['tn'],
  52: ['xh'],
  53: ['zu'],
  54: ['af'],
  55: ['ka'],
  56: ['fo'],
  57: ['hi'],
  58: ['mt'],
  59: ['se'],
  62: ['ms'],
  63: ['kk'],
  65: ['sw'],
  67: ['uz', null, 'uz-UZ'],
  68: ['tt'],
  69: ['bn'],
  70: ['pa'],
  71: ['gu'],
  72: ['or'],
  73: ['ta'],
  74: ['te'],
  75: ['kn'],
  76: ['ml'],
  77: ['as'],
  78: ['mr'],
  79: ['sa'],
  82: ['cy', 'cy-GB'],
  83: ['gl', 'gl-ES'],
  87: ['kok'],
  97: ['ne'],
  98: ['fy'],
}
