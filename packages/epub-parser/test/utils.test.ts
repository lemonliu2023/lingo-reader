import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ZipFile, parsexml, pureXmlContent } from '../src/utils.ts'

describe('pureXmlContent', () => {
  it('useless tag', () => {
    const str = `<body><header><p>
  <span style="font-size:16px;font-family:'PingFang SC';">
  问题<b>上</b><i><b>水</b></span></i><i></i><i>r</i><u>sd</u><s>45</s>
</p></header><body>`
    expect(pureXmlContent(str)).toBe('<body><p> 问题上水rsd45\n</p><body>')
  })

  it('self close tag', () => {
    const str = '<a class="link" href="http://www.epubbooks.com" target="_top">www.epubbooks.com</a>'
      + '<br /><hr /><img src="http://www.epubbooks.com" /><header />'

    expect(pureXmlContent(str)).toBe('www.epubbooks.com<img src="http://www.epubbooks.com" />')
  })

  it('class, id, style ... attrs', () => {
    const str = '<p class="p1" id="p1">content</p>'
      + '<table style="border: 0; " class="simplelist" epub:type="list">'
      + '<tr><td>When</td></table>'
    expect(pureXmlContent(str)).toBe('<p>content</p><table><tr><td>When</td></table>')
  })

  it('tag with no content', () => {
    const str2 = '<div id="chapter3.xhtml"></div>'
    expect(pureXmlContent(str2)).toBe('')
  })

  it('multiline', () => {
    const str = `
    
    `
    expect(pureXmlContent(str)).toBe(' ')
  })
})

const aliceEpubNames = [
  'mimetype',
  'META-INF/container.xml',
  '19033/www.gutenberg.org@files@19033@19033-h@images@cover_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@title.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@plate01_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i001_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i002_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i003_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i004_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i005_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i006_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@plate02_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i007_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i008_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i009_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i010_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i011_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i012_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@plate03_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i013_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i014_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i015_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i016_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i017_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@plate04_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i018_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i019_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i020_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i021_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i022_th.jpg',
  '19033/pgepub.css',
  '19033/0.css',
  '19033/1.css',
  '19033/www.gutenberg.org@files@19033@19033-h@19033-h-0.htm',
  '19033/toc.ncx',
  '19033/content.opf',
]

describe('utils', () => {
  // alice.epub file path
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const epubPath = path.resolve(currentDir, '../../../example/alice.epub')
  const epubFile = new ZipFile(epubPath)

  it('parsexml', async () => {
    const xml = '<root><a>1</a><b>2</b></root>'
    const result = await parsexml(xml)
    expect(result).toEqual({ root: { a: ['1'], b: ['2'] } })
  })

  it('zipFile.readFile file exit', () => {
    expect([...epubFile.names.values()]).toEqual(aliceEpubNames)
    const fileContent = epubFile.readFile(aliceEpubNames[0])
    expect(fileContent).toEqual('application/epub+zip')
  })

  it('zipFile.readFile file not exit', () => {
    // await expect(epubFile.readFile('not-exist')).rejects.toThrow()
    expect(() => epubFile.readFile('not-exist')).toThrow()
  })

  it('zipFile.readImage', () => {
    expect(epubFile.readImage(
      '19033/www.gutenberg.org@files@19033@19033-h@images@i022_th.jpg',
    ).length).toBeGreaterThan(0)
  })
})
