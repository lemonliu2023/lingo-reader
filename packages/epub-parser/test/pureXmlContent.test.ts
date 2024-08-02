import { describe, expect, it } from 'vitest'
import { pureXmlContent } from '../src/pureXmlContent'

describe('pureXmlContent', () => {
  it('useless tag', () => {
    const str = `<body><header><p>
  <span style="font-size:16px;font-family:'PingFang SC';">
  问题<b>上</b><i><b>水</b></span></i><i></i><i>r</i><u>sd</u><s>45</s>
</p></header><body>`
    expect(pureXmlContent(str)).toBe('<body><p> 问题上水rsd45 </p><body>')
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
