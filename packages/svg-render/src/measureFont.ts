/// <reference path="./global.d.ts" />

interface Measurement {
  /**
   * The width and height of the measured text
   */
  width: number
  height: number
}

interface MeasureOptions {
  /**
   * The font size of the text
   */
  fontSize?: number
  /**
   * The font family of the text
   */
  fontFamily?: string
  /**
   * The remote font css url
   */
  remoteFontCSSURL?: string
}

const defaultOptions: MeasureOptions = {
  fontSize: 20,
  fontFamily: 'Lucida Console, Courier, monospace',
  remoteFontCSSURL: '',
}

const fontCache = new Map<string, Measurement>()

/**
 * measure the width and height of char based on fontSize and fontFamily
 */
export async function measureFont(
  char: string,
  options?: MeasureOptions,
): Promise<Measurement> {
  if (char.length === 0) {
    throw new Error('char should not be empty')
  }
  if (fontCache.has(char)) {
    return fontCache.get(char)!
  }
  
  const renderOptions = { ...defaultOptions, ...options } as Required<MeasureOptions>
  const { fontSize, fontFamily, remoteFontCSSURL } = renderOptions

  let measurement: Measurement

  if (__BROWSER__) {
    measurement = await measureStr([char, fontSize, fontFamily])
  } else {
    const playwright = await import('playwright')
    const browser = await playwright.chromium.launch({ headless: true })
    const page = await browser.newPage()
    if (remoteFontCSSURL.length) {
      await page.goto(
        `data:text/html,${getDocument(fontFamily, remoteFontCSSURL)}`,
        {
          waitUntil: 'networkidle',
        },
      )
    }
    measurement = await page.evaluate(measureStr, [
      char,
      fontSize,
      fontFamily,
    ] as [string, number, string])
    await browser.close()
  }

  // roundMeasurement(measurement)
  fontCache.set(char, measurement)
  return measurement
}

// function roundToOneDecimalPlace(num: number) {
//   return Math.round(num * 10) / 10;
// }

// function roundMeasurement(measurement: Measurement) {
//   measurement.width = roundToOneDecimalPlace(measurement.width)
//   measurement.height = roundToOneDecimalPlace(measurement.height)
// }

function measureStr([char, fontSize, fontFamily]: [string, number, string]): Measurement {
  const span = document.createElement('span')
  span.style.visibility = 'hidden'
  span.style.fontSize = `${fontSize}px`
  span.style.fontFamily = fontFamily
  span.style.display = 'inline-block'
  span.style.whiteSpace = 'pre'
  span.textContent = char
  document.body.appendChild(span)
  const { width, height } = window.getComputedStyle(span)
  document.body.removeChild(span)
  return {
    width: Number.parseFloat(width),
    height: Number.parseFloat(height),
  }
}

function getDocument(fontName: string, url: string) {
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

