import { path } from '@blingo-reader/shared'
import { readFileSync, writeFileSync } from './fsPolyfill'
import type { EpubCssPart, EpubProcessedChapter } from './types'
import { HREF_PREFIX } from './constant'
import { resourceExtensionToMimeType } from './utils'

const browserUrlCache = new Map<string, string>()

function getResourceUrl(src: string, htmlDir: string, resourceSaveDir: string) {
  const resourceName = path.joinPosix(htmlDir, src).replace('/', '_')
  let resourceSrc = path.resolve(resourceSaveDir, resourceName)
  if (__BROWSER__) {
    if (browserUrlCache.has(resourceName)) {
      return browserUrlCache.get(resourceName)!
    }
    const ext = resourceName.split('.').pop()!
    const blobType = resourceExtensionToMimeType[ext]
    const resource = new Uint8Array(readFileSync(resourceSrc))
    const blob = new Blob([resource], { type: blobType })
    resourceSrc = URL.createObjectURL(blob)

    browserUrlCache.set(resourceName, resourceSrc)
  }
  return resourceSrc
}

// TODO: add test case
function replaceBodyResources(str: string, htmlDir: string, resourceSaveDir: string) {
  // resource src: src in <img>, <video>, <audio>, <source> tag
  str = str.replace(/<(img|video|audio|source)[^>]*>/g, (imgTag) => {
    // src
    const src = imgTag.match(/src="([^"]*)"/)?.[1]
    if (src) {
      const imageSrc = getResourceUrl(src, htmlDir, resourceSaveDir)
      imgTag = imgTag.replace(src, imageSrc)
    }

    // poster
    const poster = imgTag.match(/poster="([^"]*)"/)?.[1]
    if (poster) {
      const posterSrc = getResourceUrl(poster, htmlDir, resourceSaveDir)
      imgTag = imgTag.replace(poster, posterSrc)
    }
    return imgTag
  })

  // a tag href
  str = str.replace(/<a[^>]*>/g, (aTag: string) => {
    const href = aTag.match(/href="([^"]*)"/)?.[1]
    if (href && !/^http|mailto/.test(href)) {
      const transformedHref = path.joinPosix(htmlDir, href)
      aTag = aTag.replace(href, HREF_PREFIX + transformedHref)
    }
    return aTag
  })

  return str
}

// TODO: add test case
export function transformHTML(
  html: string,
  htmlDir: string,
  resourceSaveDir: string,
): EpubProcessedChapter {
  // head
  const head = html.match(/<head[^>]*>([\s\S]*)<\/head>/i)
  const css: EpubCssPart[] = []
  if (head) {
    const links = head[1].match(/<link[^>]*>/g)!
    if (links) {
      for (const link of links) {
        const linkHref = link.match(/href="([^"]*)"/)![1]
        if (linkHref.endsWith('.css')) {
          // css file path
          const cssFilePath = path.joinPosix(htmlDir, linkHref)
          const cssName = cssFilePath.replace('/', '_')
          let realPath = path.resolve(resourceSaveDir, cssName)

          // replace url() in css and save css file
          let fileContent = new TextDecoder().decode(readFileSync(realPath))
          fileContent = fileContent.replace(/url\(([^)]*)\)/g, (_, url: string) => {
            // remove ' or "
            url = url.replace(/['"]/g, '')
            const realUrl = getResourceUrl(url.trim(), path.dirname(cssFilePath), resourceSaveDir)
            return `url(${realUrl})`
          })
          writeFileSync(realPath, new TextEncoder().encode(fileContent))

          // get blob url in browser
          if (__BROWSER__) {
            realPath
              = browserUrlCache.get(cssName)
              || URL.createObjectURL(new Blob([fileContent], { type: 'text/css' }))
          }
          css.push({
            id: cssName,
            href: realPath,
          })
        }
      }
    }
  }

  // body
  const body = html.match(/<body[^>]*>(.*?)<\/body>/is)
  let bodyReplaced = ''
  if (body) {
    bodyReplaced = replaceBodyResources(body[1], htmlDir, resourceSaveDir)
  }

  return {
    css,
    html: bodyReplaced,
  }
}

export function revokeBlobUrls() {
  if (__BROWSER__) {
    browserUrlCache.forEach((url) => {
      URL.revokeObjectURL(url)
    })
    browserUrlCache.clear()
  }
}
