import type { ParserOptions } from './xml2js-parser'
import { parseStringPromise } from './xml2js-parser'

export async function parsexml(str: string | Uint8Array, optionsParserOptions: ParserOptions = {}) {
  const result = await parseStringPromise(str, optionsParserOptions)
  return result
}

export function camelCase(str: string): string {
  return str.replace(/-([a-z])/gi, g => g[1].toUpperCase())
}
