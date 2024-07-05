import { Content, ContentType } from "./types.ts";

export class Chapter {
  private contents: Content[] = []
  private title: string = "temp"
  constructor(public xmlTree: any) {
    this.contents.push({
      type: ContentType.TEXT,
      text: "temp"
    })
  }

  getContent() {
    return {
      title: this.title,
      contents: this.contents
    }
  }
}

