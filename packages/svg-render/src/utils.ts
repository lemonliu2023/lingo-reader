import { ContentType } from '@svg-ebook-reader/shared'

export function getDocument(fontName: string, url: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url(${url});
    body { font-family: '${fontName}'; }
  </style>
</head>
<body>
<p>Test</p>
</body>
</html>
`
}

export const isEnglish = (char: string) => {
  return char <= 'z' && char >= 'a' || char <= 'Z' && char >= 'A'
}

export const isSpace = (char: string) => {
  return char === ' '
}

export const charMap = new Map<string, string>([
  // space will not be rendered in the beginning of the text
  [' ', '&#xA0;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['&', '&amp;'],
  ['"', '&quot;'],
  ['\'', '&#39;']
])

export const headingRatioMap = new Map<ContentType, number>([
  [ContentType.HEADING1, 2],
  [ContentType.HEADING2, 1.5],
  [ContentType.HEADING3, 1.17],
  [ContentType.HEADING4, 1],
  [ContentType.HEADING5, 0.83],
  [ContentType.HEADING6, 0.67]
])

