import { beforeAll, describe, expect, it } from 'vitest'
import { parsexml } from '@lingo-reader/shared'
import { parseSmil, transformHTML } from '../src/transformChapter'

describe('transformHTML', () => {
  beforeAll(() => {
    // @ts-expect-error __BROWSER__
    globalThis.__BROWSER__ = false
  })
  it('should return message when it has no <body>', () => {
    expect(transformHTML('<html></html>', '', '')).toEqual({
      css: [],
      html: '',
    })
  })

  it('replace a tag href', () => {
    expect(transformHTML(`<body><a href="%2ca.html"></a><a href="https://www.baidu.com"></a></body>`, 'temp', '')).toEqual({
      css: [],
      html: '<a href="epub:temp/,a.html"></a><a href="https://www.baidu.com"></a>',
    })
  })

  it('replace <image> src in browser', () => {
    const transformed = transformHTML(
      '<body><image xlink:href="src.jpg"></image></body>',
      '',
      './images',
    ).html
    const dir = process.cwd()
    const href = transformed.match(/xlink:href="([^"]*)"/)?.[1]
    expect(href?.startsWith(dir)).toBe(true)
  })

  it('do not allow to reference external resources', () => {
    const transformed = transformHTML(
      '<body><img src="https://www.baidu.com/image.jpg"/></body>',
      '',
      '',
    )
    expect(transformed.html).not.toBe('<img src="https://www.baidu.com/image.jpg"/>')
  })
})

describe('parse smil', () => {
  it('parse smil', async () => {
    const smil = `<smil
    xmlns="http://www.w3.org/ns/SMIL"
    xmlns:epub="http://www.idpf.org/2007/ops"
    version="3.0">
   <body>
      <!-- a paragraph -->
      <par id="id1">
         <text
             src="chapter1.xhtml#para1"/>
         <audio
             src="chapter1_audio.mp3"
             clipBegin="0:23:22.000"
             clipEnd="0:24:15.000"/>
      </par>

      <!-- a table with two nested rows -->
      <seq
          id="id2"
          epub:textref="c01.xhtml#t1"
          epub:type="table">

         <seq
             id="id3"
             epub:textref="c01.xhtml#tr1"
             epub:type="table-row">

            <par
                id="id4"
                epub:type="table-cell">
               <text
                   src="c01.xhtml#td1"/>
               <audio
                   src="chapter1_audio.mp3"
                   clipBegin="0:24:15.000"
                   clipEnd="0:24:18.123"/>
            </par>

            <par
                id="id5"
                epub:type="table-cell">
               <text
                   src="c01.xhtml#td2"/>
               <audio
                   src="chapter1_audio.mp3"
                   clipBegin="0:24:18.123"
                   clipEnd="0:25:28.530"/>
            </par>

            <par
                id="id6"
                epub:type="table-cell">
               <text
                   src="c01.xhtml#td3"/>
               <audio
                   src="chapter1_audio.mp3"
                   clipBegin="0:25:28.530"
                   clipEnd="0:25:45.515"/>
            </par>
         </seq>

         <seq
             id="id7"
             epub:textref="c01.xhtml#tr2"
             epub:type="table-row">

            <par
                id="id8"
                epub:type="table-cell">
               <text
                   src="c01.xhtml#td4"/>
               <audio
                   src="chapter1_audio.mp3"
                   clipBegin="0:25:45.515"
                   clipEnd="0:26:45.700"/>
            </par>

            <par
                id="id9"
                epub:type="table-cell">
               <text
                   src="chapter1.xhtml#td5"/>
               <audio
                   src="chapter1_audio.mp3"
                   clipBegin="0:26:45.700"
                   clipEnd="0:28:02.033"/>
            </par>

            <par
                id="id10"
                epub:type="table-cell">
               <text
                   src="chapter1.xhtml#td6"/>
               <audio
                   src="chapter1_audio.mp3"
                   clipBegin="0:28:02.033"
                   clipEnd="0:28:52.207"/>
            </par>
         </seq>
      </seq>


      <!-- a page number -->
      <par
          id="id12"
          epub:type="pagebreak">
         <text
             src="chapter1.xhtml#pgbreak1"/>
         <audio
             src="chapter1_audio.mp3"
             clipBegin="0:24:15.000"
             clipEnd="0:24:18.123"/>
      </par>

      <!-- another paragraph -->
      <par id="id13">
         <text
             src="chapter2.xhtml#para2"/>
         <audio
             src="chapter2_audio.mp3"
             clipBegin="0:24:18.123"
             clipEnd="0:25:28.530"/>
      </par>
   </body>
</smil>`

    // TODO: test parseSmil
    const audios = parseSmil(await parsexml(smil, {
      preserveChildrenOrder: true,
      explicitChildren: true,
      childkey: 'children',
    }), 'epub', 'save')

    expect(audios[0].pars.length).toBeGreaterThan(1)
  })
})
