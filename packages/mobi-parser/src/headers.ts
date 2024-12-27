import type {
  CdicHeader,
  ExthHeader,
  FdstHeader,
  FontHeader,
  HuffHeader,
  IndxHeader,
  Kf8Header,
  MobiHeader,
  PalmdocHeader,
  PdbHeader,
  TagxHeader,
} from './types'

export const pdbHeader: PdbHeader = {
  name: [0, 32, 'string'],
  type: [60, 4, 'string'],
  creator: [64, 4, 'string'],
  numRecords: [76, 2, 'uint'],
}

export const palmdocHeader: PalmdocHeader = {
  compression: [0, 2, 'uint'],
  numTextRecords: [8, 2, 'uint'],
  recordSize: [10, 2, 'uint'],
  encryption: [12, 2, 'uint'],
}

export const mobiHeader: MobiHeader = {
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

export const kf8Header: Kf8Header = {
  resourceStart: [108, 4, 'uint'],
  fdst: [192, 4, 'uint'],
  numFdst: [196, 4, 'uint'],
  frag: [248, 4, 'uint'],
  skel: [252, 4, 'uint'],
  guide: [260, 4, 'uint'],
}

export const exthHeader: ExthHeader = {
  magic: [0, 4, 'string'],
  length: [4, 4, 'uint'],
  count: [8, 4, 'uint'],
}

export const indxHeader: IndxHeader = {
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

export const tagxHeader: TagxHeader = {
  magic: [0, 4, 'string'],
  length: [4, 4, 'uint'],
  numControlBytes: [8, 4, 'uint'],
}

export const huffHeader: HuffHeader = {
  magic: [0, 4, 'string'],
  offset1: [8, 4, 'uint'],
  offset2: [12, 4, 'uint'],
}

export const cdicHeader: CdicHeader = {
  magic: [0, 4, 'string'],
  length: [4, 4, 'uint'],
  numEntries: [8, 4, 'uint'],
  codeLength: [12, 4, 'uint'],
}

export const fdstHeader: FdstHeader = {
  magic: [0, 4, 'string'],
  numEntries: [8, 4, 'uint'],
}

export const fontHeader: FontHeader = {
  flags: [8, 4, 'uint'],
  dataStart: [12, 4, 'uint'],
  keyLength: [16, 4, 'uint'],
  keyStart: [20, 4, 'uint'],
}

export const mime = {
  XML: 'application/xml',
  XHTML: 'application/xhtml+xml',
  HTML: 'text/html',
  CSS: 'text/css',
  SVG: 'image/svg+xml',
}

export const mobiEncoding: Record<string, string> = {
  1252: 'windows-1252',
  65001: 'utf-8',
}

export const exthRecordType: Record<string, [string, string]> = {
  100: ['creator', 'string'], // many
  101: ['publisher', 'string'],
  103: ['description', 'string'],
  104: ['isbn', 'string'],
  105: ['subject', 'string'], // many
  106: ['date', 'string'],
  108: ['contributor', 'string'], // many
  109: ['rights', 'string'],
  110: ['subjectCode', 'string'], // many
  112: ['source', 'string'], // many
  113: ['asin', 'string'],
  121: ['boundary', 'uint'],
  122: ['fixedLayout', 'string'],
  125: ['numResources', 'uint'],
  126: ['originalResolution', 'string'],
  127: ['zeroGutter', 'string'],
  128: ['zeroMargin', 'string'],
  129: ['coverURI', 'string'],
  132: ['regionMagnification', 'string'],
  201: ['coverOffset', 'uint'],
  202: ['thumbnailOffset', 'uint'],
  503: ['title', 'string'],
  524: ['language', 'string'], // many
  527: ['pageProgressionDirection', 'string'],
}

export const mobiLang: Record<string, (string | null)[]> = {
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
