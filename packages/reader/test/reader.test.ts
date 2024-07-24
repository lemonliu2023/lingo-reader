import { describe, it } from 'vitest'
import { init } from '../src/reader'

// @ts-ignore
globalThis.__BROWSER__ = false

describe('reader', () => {
  it('create', async () => {
    await init()

    // new Reader()
    // const epub = await initEpubFile()
    // const chapter = await epub.getChapter(epub.toc[0].id)
    // const renderer = new SvgRender({
    //   padding: '40',
    //   width: 1000,
    //   height: 700,
    // })
    // await renderer.addContents(chapter.contents)
    // fs.writeFileSync('./alice.svg', renderer.pages[2])
    // expect(1).toBe(1)
  })
})
