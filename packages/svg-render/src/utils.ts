import { ContentType } from './parser/parserTypes'

export function getDocument(fontName: string, url: string) {
  return `
<!DOCTYPE html><html><head><style>
    @import url(${url});
    body { font-family: '${fontName}'; }
</style></head><body><p>Test</p></body></html>
`
}

export function isEnglish(char: string) {
  return (char <= 'z' && char >= 'a') || (char <= 'Z' && char >= 'A')
}

export function isSpace(char: string) {
  return char === ' '
}
// 正则表达式匹配标点符号
const punctuationRegex = /[!%,\-.:;?]/
export function isPunctuation(char: string) {
  return punctuationRegex.test(char)
}

export const charMap = new Map<string, string>([
  // space will not be rendered in the beginning of the text
  [' ', '&#xA0;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['&', '&amp;'],
  ['"', '&quot;'],
  ['\'', '&#39;'],
])

export const headingRatioMap = new Map<ContentType, number>([
  [ContentType.HEADING1, 2],
  [ContentType.HEADING2, 1.5],
  [ContentType.HEADING3, 1.17],
  [ContentType.HEADING4, 1],
  [ContentType.HEADING5, 0.83],
  [ContentType.HEADING6, 0.67],
])

// similar to css style padding
export function parsePadding(paddingStr: string) {
  const paddingSplit = paddingStr!.split(' ').map(val => Number.parseInt(val))
  if (paddingSplit.length > 4) {
    throw new Error('padding should be 1-4 values with " " separated')
  }
  let paddingArr = [0, 0, 0, 0]
  if (paddingSplit.length === 1) {
    paddingArr = [paddingSplit[0], paddingSplit[0], paddingSplit[0], paddingSplit[0]]
  }
  else if (paddingSplit.length === 2) {
    paddingArr = [paddingSplit[0], paddingSplit[1], paddingSplit[0], paddingSplit[1]]
  }
  else if (paddingSplit.length === 3) {
    paddingArr = [paddingSplit[0], paddingSplit[1], paddingSplit[2], paddingSplit[1]]
  }
  else if (paddingSplit.length === 4) {
    paddingArr = paddingSplit
  }
  return paddingArr
}

// handle 4B string in js
export function* iterateWithStr(str: string) {
  const len = str.length
  let index = 0
  while (index < len) {
    const codePoint = str.codePointAt(index)
    const char = String.fromCodePoint(codePoint!)
    yield [index, char] as [number, string]
    index += char.length
  }
}
