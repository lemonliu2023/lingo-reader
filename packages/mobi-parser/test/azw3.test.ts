import { beforeAll, describe, expect, it } from 'vitest'
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
