import { transformImageSrc } from './utils'

export function transformHTML(html: string, imageSaveDir: string): string {
  const htmlInBody = html.match(/<body[^>]*>(.*?)<\/body>/is)

  if (htmlInBody) {
    return htmlInBody[1].replace(/<img[^>]*>/g, (imgTag) => {
      const src = imgTag.match(/src="([^"]*)"/)!
      const transformedSrc = transformImageSrc(src[1], imageSaveDir)
      return imgTag.replace(src[1], transformedSrc)
    })
  }
  return 'There is no body tag in html'
}
