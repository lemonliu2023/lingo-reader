import xml2js from 'xml2js'
import type { ParserOptions } from 'xml2js'

export async function parsexml(str: string, optionsParserOptions: ParserOptions = {}) {
  const result = await xml2js.parseStringPromise(str, optionsParserOptions)
  return result
}
