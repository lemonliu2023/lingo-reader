import { beforeAll, describe, expect, it } from 'vitest'
import { type Mobi, initMobiFile } from '../src/mobi'

describe('mobi class', () => {
  let mobi: Mobi
  beforeAll(async () => {
    // @ts-expect-error globalThis.__BROWSER__
    globalThis.__BROWSER__ = false
    mobi = await initMobiFile('./example/taoyong.mobi')
  })

  it('pdb header', async () => {
    // recordsOffset
    const recordsOffset = mobi.getRecordOffset()
    expect(recordsOffset.length).toBe(102)
    expect(recordsOffset[0]).toEqual([896, 9796])
    // recordsMagic
  })

  it('mobi file header', async () => {
    // paldoc
    expect(mobi.getPalmdocHeader()).toEqual({
      compression: 2,
      encryption: 0,
      numTextRecords: 84,
      recordSize: 4096,
    })
    // mobiHeader
    expect(mobi.getMobiHeader()).toEqual({
      encoding: 65001,
      exthFlag: 80,
      huffcdic: 0,
      indx: 86,
      language: 'zh',
      length: 232,
      localeLanguage: 4,
      localeRegion: 0,
      magic: 'MOBI',
      numHuffcdic: 0,
      resourceStart: 89,
      title: '自造',
      titleLength: 6,
      titleOffset: 700,
      trailingFlags: 3,
      type: 2,
      uid: 3279154688,
      version: 6,
    })
    // taoyong.mobi is not a KF8 file
    expect(mobi.getKf8Header()).toBeUndefined()
    expect(mobi.getExth()).toEqual({
      creator: ['陶勇'],
      publisher: ['www.huibooks.com'],
      isbn: ['9787572604850'],
      subject: ['汇书网'],
      date: ['2021-11-30 16:00:00+00:00'],
      contributor: ['calibre (7.0.0) [https://calibre-ebook.com]'],
      source: ['calibre:73be3482-78ed-41f9-b124-81e1a23efcc3'],
      asin: ['73be3482-78ed-41f9-b124-81e1a23efcc3'],
      coverURI: ['kindle:embed:0009'],
      coverOffset: [8],
      thumbnailOffset: [9],
      title: ['自造'],
      language: ['zh'],
    })
  })
})
