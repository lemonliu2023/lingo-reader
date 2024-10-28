import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { measureImage } from '../src/measureImage'

describe('measureImage in node', () => {
  beforeAll(() => {
    // @ts-expect-error __BROWSER__
    globalThis.__BROWSER__ = false
  })
  it('measure existed image', async () => {
    // /images/1656147374309.jpg is a 640x640 image
    const { width, height } = await measureImage('./images/1656147374309.jpg')
    expect(width).toBe(640)
    expect(height).toBe(640)
  })
  it('measure non-existed image', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { width, height } = await measureImage('./images/non-existed.jpg')
    expect(width).toBe(50)
    expect(height).toBe(50)
    expect(consoleWarn)
      .toHaveBeenCalledWith('measure image failed: ./images/non-existed.jpg, it will return { width: 50, height: 50}')
    consoleWarn.mockRestore()
  })
})

describe('measureImage in browser', () => {
  beforeAll(() => {
    // @ts-expect-error __BROWSER__
    globalThis.__BROWSER__ = true

    // @ts-expect-error for simulate Image
    globalThis.Image = class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      _src: string = ''
      naturalWidth: number = 0
      naturalHeight: number = 0
      constructor() { }
      set src(url: string) {
        this._src = url
        if (url === './images/Image00001.jpg') {
          setTimeout(() => {
            this.naturalWidth = 749
            this.naturalHeight = 1000
            if (this.onload) {
              this.onload()
            }
          }, 0)
        }
        else {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror()
            }
          }, 0)
        }
      }

      get src() {
        return this._src
      }
    }
  })

  afterAll(() => {
    // @ts-expect-error __BROWSER__
    delete globalThis.__BROWSER__
    // @ts-expect-error for simulate Image
    delete globalThis.Image
  })

  it('measure existed image', async () => {
    const { width, height } = await measureImage('./images/Image00001.jpg')
    expect(width).toBe(749)
    expect(height).toBe(1000)
  })

  it('measure non-existed image', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { width, height } = await measureImage('./images/non-existed.jpg')
    expect(width).toBe(50)
    expect(height).toBe(50)
    expect(consoleWarn)
      .toHaveBeenCalledWith('measure image failed: ./images/non-existed.jpg, it will return { width: 50, height: 50}')
  })
})
