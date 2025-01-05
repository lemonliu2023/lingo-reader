import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Azw3 } from '../src/azw3'
import { initAzw3File } from '../src/azw3'

describe('azw3 class', () => {
  let azw3: Azw3
  beforeAll(async () => {
    // @ts-expect-error globalThis.__BROWSER__
    globalThis.__BROWSER__ = false
    azw3 = await initAzw3File('./example/taoyong.azw3')
  })
  it('azw3 class', () => {
    expect(azw3).toBeDefined()
  })
})

describe('init azw3 in browser', () => {
  let azw3: Azw3
  beforeAll(async () => {
    const fileBuffer = readFileSync('./example/taoyong.azw3')
    const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
    // @ts-expect-error globalThis.__BROWSER__
    globalThis.__BROWSER__ = true
    // @ts-expect-error File mock
    globalThis.File = class {
      async arrayBuffer() {
        return arrayBuffer
      }
    }
    azw3 = await initAzw3File(new File([], 'taoyong.azw3'))
  })
  afterAll(() => {
    // @ts-expect-error globalThis.__BROWSER__
    delete globalThis.__BROWSER__
    // @ts-expect-error File mock
    delete globalThis.File
  })
  it('azw3 class', () => {
    expect(azw3).toBeDefined()
  })
})
