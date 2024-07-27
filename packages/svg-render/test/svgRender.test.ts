import { describe, expect, it } from 'vitest'
import { ContentType } from '@svg-ebook-reader/shared'
import { SvgRender } from '../src/svgRender'
// import path from 'path'
// import { fileURLToPath } from 'url'
// import {writeFileSync} from 'fs'

// @ts-expect-error __BROWSER__ is defined in rollup options
globalThis.__BROWSER__ = false

describe('svgRender', () => {
  const renderer = new SvgRender({
    padding: '40',
    width: 1000,
    height: 700,
  })
  it('options.padding', () => {
    const {
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
    } = renderer.options
    expect(paddingTop).toBe(40)
    expect(paddingRight).toBe(40)
    expect(paddingBottom).toBe(40)
    expect(paddingLeft).toBe(40)
  })

  it('lineHeight', () => {
    const {
      fontSize,
      lineHeightRatio,
    } = renderer.options
    expect(renderer.lineHeight).toBe(fontSize * lineHeightRatio)
  })

  it('generateRect', () => {
    const { width, height, backgroundColor, fontSize, fontFamily, cursor, selectionbgColor } = renderer.options
    // The id of svg is dynamic, replace svgId with ''
    const svg = renderer.svg.replace(/svg\S{7}/g, '')
    expect(svg).toBe('<svg id="" xmlns="http://www.w3.org/2000/svg" version="1.1" '
    + `font-size="${fontSize}px" viewBox="0 0 ${width} ${height}" width="${width}px" `
    + `height="${height}px" font-family="${fontFamily}"><style>#{cursor:${cursor};}# `
    + `text::selection{background-color:${selectionbgColor};}</style><rect `
    + `width="${width}" height="${height}" fill="${backgroundColor}" pointer-events="none"/>`
    + `##{content}##</svg>`)
  })

  const text = `哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈
哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈"
Well, be off, then!" \nsaid the Pigeon in a sulky 
tone, as it settled down again into its nest. Alice 
crouched down among the trees as well as she could, for 
her neck kept getting entangled among the branches, and 
every now and then she had to stop and untwist it. After a 
while she remembered that she still held the pieces of mushroom 
in her hands, and she set to work very carefully, 
nibbling first at one and then at the other, and growing 
sometimes taller and sometimes shorter, until she had 
succeeded in bringing herself down to her usual height.`.replace(/\n/g, '')

  const text2 = `Alice gave a weary sigh. "I think you 
might do something better with the time," she said, 
"than wasting it in asking riddles that have no answers."
Once more she found herself in the long hall and close 
to the little glass table. Taking the little golden key, 
she unlocked the door that led into the garden. Then she 
set to work nibbling at the mushroom (she had kept a 
piece of it in her pocket) till she was about a foot 
high; then she walked down the little passage; 
and then—she found herself at last in the beautiful garden, 
among the bright flower-beds and the cool fountains.`.replace(/\n/g, '')

  it('addContent', async () => {
    await renderer.addContents([
      {
        type: ContentType.PARAGRAPH,
        text,
      },
      {
        type: ContentType.HEADING1,
        heading: 'Chapter 1',
      },
      {
        type: ContentType.HEADING4,
        heading: 'Chapter 2',
      },
      {
        type: ContentType.PARAGRAPH,
        text: 'hello world',
      },
      {
        type: ContentType.IMAGE,
        src: '1656147374309.jpg',
        alt: 'image',
      },
      {
        type: ContentType.PARAGRAPH,
        text: text2,
      },
    ])
    const pages = renderer.pages
    // const currentDir = path.dirname(fileURLToPath(import.meta.url))
    // writeFileSync(path.resolve(currentDir, './uiviewer/1.svg'), renderer.pages[0])
    // writeFileSync(path.resolve(currentDir, './uiviewer/2.svg'), renderer.pages[1])
    expect(pages[0]).toMatchSnapshot()
    expect(pages[1]).toMatchSnapshot()
  })
})
