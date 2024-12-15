import { path } from '@blingo-reader/shared'
import { readFileSync, unlinkSync } from './fsImagePolyfill'

const imageExtensionToMimeType: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  heic: 'image/heic',
  avif: 'image/avif',
}

const imageUrls: string[] = []
const imageSrcInBrowser: string[] = []

function transformImageSrc(src: string, imageSaveDir: string): string {
  const imageName = src.split('/').pop()!
  let imageSrc = path.resolve(imageSaveDir, imageName)
  if (__BROWSER__) {
    imageSrcInBrowser.push(imageSrc)
    const ext = imageName.split('.').pop()!
    const blobType = imageExtensionToMimeType[ext]
    const image = new Uint8Array(readFileSync(imageSrc))
    const blob = new Blob([image], { type: blobType })
    imageSrc = URL.createObjectURL(blob)
  }
  return imageSrc
}

export function transformHTML(html: string, imageSaveDir: string): string {
  const htmlInBody = html.match(/<body[^>]*>(.*?)<\/body>/is)

  if (htmlInBody) {
    return htmlInBody[1].replace(/<img[^>]*>/g, (imgTag) => {
      const src = imgTag.match(/src="([^"]*)"/)!
      const transformedSrc = transformImageSrc(src[1], imageSaveDir)
      imageUrls.push(transformedSrc)
      return imgTag.replace(src[1], transformedSrc)
    })
  }
  return 'There is no body tag in html'
}

export function revokeImageUrls(): string[] {
  if (__BROWSER__) {
    // In Browser env, imageUrls are blob urls that was created by URL.createObjectURL(imageSrcInBrowser),
    //  and imageSrcInBrowser are the image file path in memory.
    imageUrls.forEach(url => URL.revokeObjectURL(url))
    imageSrcInBrowser.forEach(src => unlinkSync(src))
  }
  else {
    // In Node env, imageUrls are same as imageSrc, So in this, we only need to delete the image file.
    imageUrls.forEach(url => unlinkSync(url))
  }
  const revokedUrls = imageUrls.slice(0)
  imageUrls.length = 0
  return revokedUrls
}
