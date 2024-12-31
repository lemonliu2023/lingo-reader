import process from 'node:process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { measureFont } from '../src/measureFont.ts'

describe('measureFont', () => {
  beforeAll(() => {
    // @ts-expect-error __BROWSER__ is defined in rollup options
    globalThis.__BROWSER__ = false
  })
  it('measureFont', async () => {
    const { width, height } = await measureFont('a', {
      fontSize: 20,
      fontWeight: 'normal',
    })
    // font width and height are different in different os
    expect(width).toBeGreaterThanOrEqual(12)
    expect(height).toBeGreaterThanOrEqual(20)
  })

  it('measure empty char', async () => {
    await expect(async () => {
      await measureFont('', {
        fontSize: 20,
      })
    }).rejects.toThrowError('char should not be empty')
  })

  it('clean browser variables in measureFont', () => {
    expect(() => {
      process.emit('SIGINT')
    }).not.toThrowError()
  })
})

describe('simulate measureFont in browser', () => {
  beforeAll(() => {
    // @ts-expect-error __BROWSER__ is defined in rollup options
    globalThis.__BROWSER__ = true
    globalThis.document = {
      // @ts-expect-error simulate browser env
      createElement: () => {
        return {
          textContent: 'a',
          style: {},
          appendChild() { },
          removeChild() { },
        }
      },
      body: {
        // @ts-expect-error simulate browser env
        appendChild() { },
        // @ts-expect-error simulate browser env
        removeChild() { },
      },
    }
    globalThis.window = {
      // @ts-expect-error simulate browser env
      getComputedStyle() {
        return {
          width: '12',
          height: '20',
        }
      },
    }
  })

  afterAll(() => {
    // @ts-expect-error simulate
    globalThis.document = undefined
    // @ts-expect-error simulate
    globalThis.window = undefined
  })

  it('measureFont in browser env', async () => {
    const { width, height } = await measureFont('b', {
      fontSize: 20,
      fontWeight: 'normal',
    })
    // font width and height are different in different os
    expect(width).toBeGreaterThanOrEqual(12)
    expect(height).toBeGreaterThanOrEqual(20)
  })
})
