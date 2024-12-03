import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { ContentType } from '../src'
import { SvgRender } from '../src/svgRender'

// @ts-expect-error __BROWSER__ is defined in rollup options
globalThis.__BROWSER__ = false

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const uiviewerDir = path.resolve(currentDir, `./uiviewer`)
if (!existsSync(uiviewerDir)) {
  mkdirSync(
    uiviewerDir,
  )
}

describe('svgRender', () => {
  const renderer = new SvgRender('id', {
    padding: '40',
    width: 1000,
    height: 700,
    opacity: 0.99,
    borderRadius: 1,
  })
  it('lineHeight', () => {
    const {
      fontSize,
      lineHeightRatio,
    } = renderer.getRenderOptions()
    expect(renderer.getLineHeight()).toBe(fontSize * lineHeightRatio)
  })

  it('generateRect', () => {
    const {
      width,
      height,
      backgroundColor,
      fontSize,
      fontFamily,
      cursor,
      selectionbgColor,
      opacity,
      borderRadius,
    } = renderer.getRenderOptions()
    // The id of svg is dynamic, replace svgId with ''
    const svg = renderer.getSvgTemplate().replace(/svg\S{7}/g, '')
    expect(svg).toBe('<svg id="" xmlns="http://www.w3.org/2000/svg" version="1.1" '
    + `font-size="${fontSize}px" viewBox="0 0 ${width} ${height}" width="${width}px" `
    + `height="${height}px" font-family="${fontFamily}"><style>#{cursor:${cursor};`
    + `opacity:${opacity};border-radius:${borderRadius}px;}# `
    + `text::selection{background-color:${selectionbgColor};}</style><rect `
    + `x="0" y="0" width="${width}" height="${height}" fill="${backgroundColor}" pointer-events="none"/>`
    + `##{content}##</svg>`)
  })

  const text = `哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈
哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈"
Well, be off, then!" \nsaid the Pigeon in a sulky 
tone, as it settled down again into its nest. Alice 
crouched down among the trees as well as she could, for 
her neck kept getting entangled among the branches, and 
every now and then she had to stop and untwist it.`.replace(/\n/g, '')

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
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const imageDir = path.resolve('./images')
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
        src: path.join(imageDir, 'Image00000.jpg'),
        alt: 'image',
        caption: 'Image00000.jpg',
      },
      {
        type: ContentType.IMAGE,
        src: path.join(imageDir, 'Image00005.jpg'),
        alt: 'image',
        caption: 'Image00005.jpg',
      },
      {
        type: ContentType.PARAGRAPH,
        text: 'text2',
      },
      {
        type: ContentType.IMAGE,
        src: path.join(imageDir, '1656147374309.jpg'),
        alt: 'image',
        caption: 'image',
      },
      {
        type: ContentType.PARAGRAPH,
        text: text2,
      },
    ])
    renderer.newLine(10)
    await renderer.addContents([
      {
        type: ContentType.CENTERPARAGRAPH,
        text: text2.slice(0, 100),
      },
      {
        type: ContentType.CENTERPARAGRAPH,
        text: 'center',
      },
      {
        type: ContentType.UL,
        list: [
          {
            type: ContentType.PARAGRAPH,
            text: 'hello world',
          },
          {
            type: ContentType.PARAGRAPH,
            text: 'hello world2↩',
          },
          {
            type: ContentType.OL,
            list: [
              {
                type: ContentType.PARAGRAPH,
                text: 'hello world3',
              },
              {
                type: ContentType.PARAGRAPH,
                text: 'hello world4',
              },
              {
                type: ContentType.UL,
                list: [
                  {
                    type: ContentType.PARAGRAPH,
                    text: 'hello world5',
                  },

                ],
              },
            ],
          },
          {
            type: ContentType.PARAGRAPH,
            text: 'hello world6',
          },
          {
            type: ContentType.IMAGE,
            src: path.join(imageDir, '1656147374309.jpg'),
            alt: 'image',
            caption: 'image',
          },
        ],
      },
      {
        type: ContentType.PARAGRAPH,
        text: 'TABLE:',
      },
      {
        type: ContentType.OL,
        list: [
          {
            type: ContentType.PARAGRAPH,
            text: 'hello world',
          },
        ],
      },
      {
        type: ContentType.TABLE,
        table: [
          ['hello', 'world', 'hello2', 'world'],
          ['hello1', 'world', 'hello2', 'world'],
          ['hello', 'world', 'hello2', 'world'],
        ],
      },
      {
        type: ContentType.CODEBLOCK,
        text: `console.log("hello world")
const pages = renderer.pages
const currentDir = path.dirname(fileURLToPath(import.meta.url))
for (let i = 0; i < pages.length; i++) {
  writeFileSync(
    path.resolve(currentDir, './uiviewer/i + 1.svg'),
    pages[i],
  )
}

1expect(pages[0].length).toBeGreaterThan(1)
2expect(pages[1].length).toBeGreaterThan(1)
😄
3expect(pages[0].length).toBeGreaterThan(1)
4expect(pages[1].length).toBeGreaterThan(1)
5expect(pages[0].length).toBeGreaterThan(1)
6expect(pages[1].length).toBeGreaterThan(1)
7expect(pages[0].length).toBeGreaterThan(1)
8expect(pages[1].length).toBeGreaterThan(1)expect(pages[1].length).toBeGreaterThan(1)expect(pages[1].length).toBeGreaterThan(1)
`,
      },
    ])
    const pages = renderer.getPages()
    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    for (let i = 0; i < pages.length; i++) {
      writeFileSync(
        path.resolve(currentDir, `./uiviewer/${i + 1}.svg`),
        pages[i].svg,
      )
    }

    expect(pages[0].svg.length).toBeGreaterThan(1)
    expect(pages[1].svg.length).toBeGreaterThan(1)
    expect(consoleWarn).not.toHaveBeenCalled()
  })
})
