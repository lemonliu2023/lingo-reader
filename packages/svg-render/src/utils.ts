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
