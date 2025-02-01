import { parsexml } from '@lingo-reader/shared'
import { ContentType } from './parserTypes'
import type {
  ChapterImage,
  ChapterOutput,
  ChapterParagraph,
  Content,
  HEADING,
  UlOrOlList,
} from './parserTypes'

// TODO: complete the process in one loop
export function pureXmlContent(xmlContent: string) {
  // remove <span> b strong i em u s small mark
  // /<\/?b[^o][^>]*>/gi will remove <b> and its content, keep body, and <i>, <u> is
  xmlContent = xmlContent
    .replace(/<\/?(span|strong|s|sup|small|mark|header|footer|section|figure|aside|code|blockquote|tbody|thead)[^>]*>/gi, '')
  xmlContent = xmlContent.replace(/<\/?(([biua]|em)|([biua]|em)\s[^>]*)>/g, '')

  // remove <tag></tag> with no content
  xmlContent = xmlContent.replace(/<([a-z][a-z0-9]*)\b[^>]*>\s*<\/\1>/gi, '')
  // remove <hr /> <br /> <a />
  xmlContent = xmlContent.replace(/<(hr|br|a)[^>]*>/gi, '')
  // remove useless attrs, class, id, style, epub:type
  xmlContent = xmlContent.replace(/\s*(class|id|style|epub:type)=["'][^"']*["']/g, '')

  // mutiple (\n| ) to one (\n| )
  // xmlContent = xmlContent.replace(/(^|[^\n])\n(?!\n)/g, '$1 ')
  xmlContent = xmlContent.replace(/(\r\n|\n|\r){2,}/g, '\n')
  // xmlContent = xmlContent.replace(/[ \f\t\v]+/g, ' ')

  return xmlContent
}

export async function parseChapter(xmlStr: string): Promise<ChapterOutput> {
  const xmlContent = pureXmlContent(xmlStr)
  const xmlTree = await parsexml(xmlContent, {
    preserveChildrenOrder: true,
    explicitChildren: true,
    childkey: 'children',
  })
  const chapterContent = new Chapter(xmlTree)
  return chapterContent.getContents()
}

/**
 * Extract chapterContent from xml tree,
 *  the xml file that generates the tree has been cleaned
 *  in epub.getChapter
 */
class Chapter {
  private contents: Content[] = []
  private title: string = 'temp'
  constructor(public xmlTree: any) { }

  // export
  public getContents(): ChapterOutput {
    const html = this.xmlTree.html
    this.parseTitle(html)
    this.parseContent(html.body[0].children)

    return {
      title: this.title,
      contents: this.contents,
    }
  }

  private extractImg(element: any) {
    const attrs = element.$

    const imageContent: ChapterImage = {
      type: ContentType.IMAGE,
      src: attrs.src,
      alt: attrs.alt || '',
    }
    if (attrs.width) {
      imageContent.width = Number.parseInt(attrs.width)
    }
    if (attrs.height) {
      imageContent.height = Number.parseInt(attrs.height)
    }
    return imageContent
  }

  private extractText(element: any) {
    return element._.replace(/\r?\n+/g, ' ').trim()
  }

  private extractTextWithNoReplace(element: any) {
    return element._.trim()
  }

  private extractFromPTag(element: any) {
    // <p><img/></p>
    // <p>text</p>
    // <p><img/>text</p>
    let result: ChapterImage | ChapterParagraph
    if (element.img) {
      result = this.extractImg(element.img[0])
      if (element._) {
        result.caption = this.extractText(element)
      }
    }
    else {
      // <p>text</p>
      result = {
        type: ContentType.PARAGRAPH,
        text: this.extractText(element),
      }
    }
    return result
  }

  private parseContent(body: any) {
    for (const element of body) {
      const tagName = element['#name']
      if (tagName === 'p') {
        this.contents.push(
          this.extractFromPTag(element),
        )
      }
      else if (tagName === 'div') {
        // <div>text</div>
        if (!element.children) {
          // To avoid <div />
          if (!element._ || element._.trim() === '') {
            continue
          }
          this.contents.push({
            type: ContentType.PARAGRAPH,
            text: this.extractTextWithNoReplace(element),
          })
        }
        else {
          this.parseContent(element.children)
        }
      }
      else if (/h\d/.test(tagName)) {
        // <h1>text</h1>
        const level = Number.parseInt(tagName[1])
        this.contents.push({
          type: ContentType[`HEADING${level}` as keyof typeof ContentType] as HEADING,
          heading: this.extractTextWithNoReplace(element),
        })
      }
      else if (tagName === 'img') {
        // <img src="path" width="33" height="55" alt="description" />
        this.contents.push(
          this.extractImg(element),
        )
      }
      else if (tagName === 'figcaption') {
        // <figcaption>
        //  <p>figure 1-1<p>
        //  <p>description<p>
        // </figcaption>
        for (const para of element.children) {
          if (para['#name'] === 'p') {
            this.contents.push({
              type: ContentType.CENTERPARAGRAPH,
              text: this.extractTextWithNoReplace(para),
            })
          }
        }
      }
      else if (tagName === 'blockquote') {
        // <blockquote>
        //  text
        // </blockquote>
        this.contents.push({
          type: ContentType.CENTERPARAGRAPH,
          text: this.extractTextWithNoReplace(element),
        })
      }
      else if (tagName === 'pre') {
        // <pre>code With \n</pre>
        this.contents.push({
          type: ContentType.CODEBLOCK,
          text: this.extractTextWithNoReplace(element),
        })
      }
      else if (tagName === 'table') {
        // <table>
        //  <tr><td></td></tr>
        //  <tr><td></td></tr>
        // </table>
        const table: string[][] = []
        const trs = element.children
        for (const tr of trs) {
          const row: string[] = []
          const tds = tr.children
          for (const td of tds) {
            // row.push(td.p[0])
            row.push(td.children[0]._ || '')
          }
          table.push(row)
        }
        this.contents.push({
          type: ContentType.TABLE,
          table,
        })
      }
      else if (tagName === 'ul') {
        this.contents.push(
          this.extractList(element, ContentType.UL),
        )
      }
      else if (tagName === 'ol') {
        this.contents.push(
          this.extractList(element, ContentType.OL),
        )
      }
    }
  }

  private extractList(element: any, type: ContentType.UL | ContentType.OL) {
    const list: UlOrOlList = []
    for (const li of element.children) {
      // <li>text</li>
      if (!li.children && li._) {
        list.push({
          type: ContentType.PARAGRAPH,
          text: this.extractTextWithNoReplace(li),
        })
        continue
      }
      for (const ele of li.children) {
        // <li><p>text</p></li>
        // <li><p><img/>caption</p></li>
        if (ele['#name'] === 'p') {
          list.push(this.extractFromPTag(ele))
        }
        // <li><ul>...</ul></li>
        else if (ele['#name'] === 'ul') {
          list.push(
            this.extractList(ele, ContentType.UL),
          )
        }
        // <li><ol>...</ol></li>
        else if (ele['#name'] === 'ol') {
          list.push(
            this.extractList(ele, ContentType.OL),
          )
        }
      }
    }
    return {
      type,
      list,
    }
  }

  private parseTitle(html: any) {
    const title = html.head[0].title
    if (title) {
      this.title = title[0]
      this.contents.push({
        type: ContentType.HEADING2,
        heading: title[0],
      })
    }
    else {
      this.title = ''
    }
  }
}
