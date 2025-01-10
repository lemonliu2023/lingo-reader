import { path } from '@blingo-reader/shared'
import { readFileSync } from './fsPolyfill'
import type { ProcessedChapter } from './types'

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
  css: 'text/css',
}

const blobUrls: string[] = []

export function transformHTML(html: string, htmlDir: string, resourceSaveDir: string): ProcessedChapter {
  // head
  const head = html.match(/<head[^>]*>([\s\S]*)<\/head>/i)
  const css: string[] = []
  if (head) {
    const links = head[1].match(/<link[^>]*>/g)!
    if (links) {
      for (const link of links) {
        const linkHref = link.match(/href="([^"]*)"/)![1]
        const filename = path.joinPosix(htmlDir, linkHref).replace('/', '_')
        let cssFilePath = path.resolve(resourceSaveDir, filename)
        if (__BROWSER__) {
          const ext = filename.split('.').pop()!
          const blobType = imageExtensionToMimeType[ext]
          const cssFile = readFileSync(cssFilePath)
          const cssText = new TextDecoder().decode(cssFile)
          // TODO: replace resource url in css file
          const blob = new Blob([cssText], { type: blobType })
          cssFilePath = URL.createObjectURL(blob)
          blobUrls.push(cssFilePath)
        }
        css.push(cssFilePath)
      }
    }
  }

  // body
  const body = html.match(/<body[^>]*>(.*?)<\/body>/is)
  let bodyReplaced = ''
  if (body) {
    // <img> tag
    bodyReplaced = body[1].replace(/<img[^>]*>/g, (imgTag) => {
      const src = imgTag.match(/src="([^"]*)"/)![1]
      const imageName = path.joinPosix(htmlDir, src).replace('/', '_')
      let imageSrc = path.resolve(resourceSaveDir, imageName)
      if (__BROWSER__) {
        const ext = imageName.split('.').pop()!
        const blobType = imageExtensionToMimeType[ext]
        const image = new Uint8Array(readFileSync(imageSrc))
        const blob = new Blob([image], { type: blobType })
        imageSrc = URL.createObjectURL(blob)
        blobUrls.push(imageSrc)
      }

      return imgTag.replace(src, imageSrc)
    })

    // a tag href
    bodyReplaced = bodyReplaced.replace(/<a[^>]*>/g, (aTag: string) => {
      // TODO: add test case
      const href = aTag.match(/href="([^"]*)"/)
      if (href) {
        const hrefValue = href[1]
        const transformedHref = path.joinPosix(htmlDir, hrefValue)
        aTag = aTag.replace(hrefValue, `epub:${transformedHref}`)
      }
      return aTag
    })
  }

  return {
    css,
    html: bodyReplaced,
  }
}

export function revokeBlobUrls() {
  if (__BROWSER__) {
    for (const url of blobUrls) {
      URL.revokeObjectURL(url)
    }
    blobUrls.length = 0
  }
}
