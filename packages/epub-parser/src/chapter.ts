import { Content, ContentType, HEADING } from "@svg-ebook-reader/shared/src";

export class Chapter {
  private contents: Content[] = []
  private title: string = "temp"
  constructor(public xmlTree: any, public contentDir: string) {
    const html = xmlTree.html
    this.parseTitle(html)
    // TOOD: sub title
    this.parseContent(html.body[0].children)
  }

  private parseContent(body: any) {
    for (const element of body) {
      const tagName = element['#name']
      if (tagName === 'p') {
        if (element.img) {
          // <p><img></p>
          const img$ = element.img[0].$
          if (!img$.src) {
            console.warn('img tag without src attribute')
            continue
          }

          const src = `${this.contentDir}/${img$.src}`
          this.contents.push({
            type: ContentType.IMAGE,
            src: src,
            alt: img$.alt || ""
          })
        } else if (element['_']) {
          // <p>text</p>
          this.contents.push({
            type: ContentType.PARAGRAPH,
            text: element['_'].replace(/\r?\n+/g, ' ').trim()
          })
        }

      } else if (tagName === 'div' && !element.children) {
        // <div>text</div>
        const paras = element['_'].split(/\r?\n+/).filter(Boolean)
        for (const para of paras) {
          this.contents.push({
            type: ContentType.PARAGRAPH,
            text: para.trim()
          })
        }
      } else if (/h\d/.test(tagName)) {
        // <h1>text</h1>
        const level = parseInt(tagName[1])
        this.contents.push({
          type: ContentType[`HEADING${level}` as keyof typeof ContentType] as HEADING,
          heading: element['_'].trim()
        })
      }
    }
  }

  private parseTitle(html: any) {
    this.title = html.head[0].title[0] || ''
  }

  // export
  public getContents() {
    return {
      title: this.title,
      contents: this.contents
    }
  }
}

