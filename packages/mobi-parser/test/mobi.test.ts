import { beforeAll, describe, expect, it } from 'vitest'
import { type Mobi, initMobiFile } from '../src/mobi'

describe('mobi class', () => {
  let mobi: Mobi
  beforeAll(async () => {
    // @ts-expect-error globalThis.__BROWSER__
    globalThis.__BROWSER__ = false
    mobi = await initMobiFile('./example/taoyong.mobi')
  })

  it('mobi class', async () => {
    expect(mobi.getMetadata()).toBeDefined()
    // console.log(mobi.getSpine())
    // const res = mobi.getChapterById(2)
    // console.log(res)
  })
})
