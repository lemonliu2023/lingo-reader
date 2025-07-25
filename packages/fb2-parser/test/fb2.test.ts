import { beforeAll, describe, expect, it } from 'vitest'
import { type Fb2File, initFb2File } from '../src/fb2'

describe('initFb2File in node', () => {
  let fb2: Fb2File
  beforeAll(async () => {
    // @ts-expect-error globalThis.__BROWSER__
    globalThis.__BROWSER__ = false
    fb2 = await initFb2File('./example/many-languages.fb2')
  })
  it('initFb2File', () => {
    // const spine = fb2.getSpine()
    // const chapter = fb2.loadChapter(spine[0].id)
    // console.log(chapter)
    expect(fb2).toBeDefined()
  })
})
