import { Content, ContentType, HEADING } from "./types";

export class Chapter {
  private contents: Content[] = []
  private title: string = "temp"
  constructor(public xmlTree: any, public contentDir: string) {
    const html = xmlTree.html
    this.parseTitle(html)
    // TOOD: sub title
    this.parseContent(html.body[0].children)
  }

  parseContent(body: any) {
    for (const element of body) {
      const tagName = element['#name']
      if (tagName === 'p') {
        // <p>
        if (element.img) {
          // <img>
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
          // <p> with text
          this.contents.push({
            type: ContentType.PARAGRAPH,
            text: element['_'].replace(/\r?\n+/g, ' ').trim()
          })
        }

      } else if (tagName === 'div' && !element.children) {
        // <div> without children
        const paras = element['_'].split(/\r?\n+/).filter(Boolean)
        for (const para of paras) {
          this.contents.push({
            type: ContentType.PARAGRAPH,
            text: para.trim()
          })
        }
      } else if (/h\d/.test(tagName)) {
        // <h1>...
        const level = parseInt(tagName[1])
        this.contents.push({
          type: ContentType[`HEADING${level}` as keyof typeof ContentType] as HEADING,
          text: element['_'].trim()
        })
      }
    }
  }

  parseTitle(html: any) {
    this.title = html.head[0].title[0] || ''
  }

  // export
  getContents() {
    return {
      title: this.title,
      contents: this.contents
    }
  }
}

