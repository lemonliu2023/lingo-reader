/// <reference path="./global.d.ts" />
import playwright from 'playwright'
import { getDocument } from './utils'
import { Measurement, MeasureOptions } from './types'

const defaultOptions: MeasureOptions = {
  fontSize: 20,
  fontFamily: 'Lucida Console, Courier, monospace',
  remoteFontCSSURL: '',
}

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
    height: Number.parseFloat(height)
  }
}

let browser: playwright.Browser
let page: playwright.Page
async function measurePlaywright(
  char: string,
  fontSize: number,
  fontFamily: string,
  remoteFontCSSURL: string = '',
) {
  if (!browser) {
    browser = await playwright.chromium.launch({ headless: true })
    page = await browser.newPage()
    // avoid memory leak
    const cleanup = async () => {
      if (browser) {
        await browser.close()
      }
    }
    const handleExit = async (signal: string) => {
      await cleanup();
      process.exit(signal === 'exit' ? 0 : 1);
    }
    ['exit', 'SIGINT', 'SIGTERM'].forEach(event => {
      process.on(event, async () => handleExit(event));
    });
    process.on('uncaughtException', async () => {
      await handleExit('uncaughtException');
    });
    process.on('unhandledRejection', async () => {
      await handleExit('unhandledRejection');
    });
  }
  if (remoteFontCSSURL.length) {
    await page.goto(
      `data:text/html,${getDocument(fontFamily, remoteFontCSSURL)}`,
      {
        waitUntil: 'networkidle',
      },
    )
  }
  return await page.evaluate(measureStr, [
    char,
    fontSize,
    fontFamily,
  ] as [string, number, string])
}

const fontCache = new Map<string, Measurement>()
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

  const { fontSize, fontFamily } = {
    ...defaultOptions,
    ...options
  } as Required<MeasureOptions>

  const measurement = __BROWSER__
    ? measureStr([char, fontSize, fontFamily])
    : await measurePlaywright(char, fontSize, fontFamily)

  fontCache.set(char, measurement)
  return measurement
}
