import process from 'node:process'
import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'
import { getDocument } from './utils'
import type { MeasureOptions, MeasureStrParas, Measurement } from './types'

declare let __BROWSER__: boolean

const defaultOptions: MeasureOptions = {
  fontSize: 20,
  fontFamily: 'Lucida Console, Courier, monospace',
  remoteFontCSSURL: '',
}

function measureStr(paras: MeasureStrParas): Measurement {
  const span = document.createElement('span')
  span.style.visibility = 'hidden'
  span.style.display = 'inline-block'
  span.style.whiteSpace = 'pre'
  span.textContent = paras.char
  span.style.fontSize = `${paras.fontSize}px`
  span.style.fontFamily = paras.fontFamily
  if (paras.fontWeight?.length) {
    span.style.fontWeight = paras.fontWeight
  }
  document.body.appendChild(span)
  const { width, height } = window.getComputedStyle(span)
  document.body.removeChild(span)
  return {
    width: Number.parseFloat(width),
    height: Number.parseFloat(height),
  }
}

let browser: Browser
let page: Page
async function measurePlaywright(paras: MeasureStrParas) {
  if (!browser) {
    browser = await chromium.launch({ headless: true })
    page = await browser.newPage()
    // avoid memory leak
    const cleanup = async () => {
      if (browser) {
        await browser.close()
      }
    }
    const handleExit = async (signal: string) => {
      await cleanup()
      process.exit(signal === 'exit' ? 0 : 1)
    }
    ['exit', 'SIGINT', 'SIGTERM'].forEach((event) => {
      process.on(event, async () => await handleExit(event))
    })
    process.on('uncaughtException', async () => {
      await cleanup()
    })
    process.on('unhandledRejection', async () => {
      await handleExit('unhandledRejection')
    })
  }
  if (paras.remoteFontCSSURL?.length > 1) {
    await page.goto(
      `data:text/html,${getDocument(paras.fontFamily, paras.remoteFontCSSURL)}`,
      { waitUntil: 'networkidle' },
    )
  }
  return page.evaluate(measureStr, paras)
}

const fontCache = new Map<string, Measurement>()
export async function measureFont(
  char: string,
  options: MeasureOptions,
): Promise<Measurement> {
  if (char.length === 0) {
    throw new Error('char should not be empty')
  }

  const paras = {
    char,
    ...defaultOptions,
    ...options,
  } as MeasureStrParas

  const cacheKey = `${char}_${paras.fontSize}`
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)!
  }

  const measurement = __BROWSER__
    ? measureStr(paras)
    : await measurePlaywright(paras)

  fontCache.set(cacheKey, measurement)
  return measurement
}
