import sizeOf from 'image-size'
import type { Measurement } from './types'

function measureImageSizeInBrowser(src: string): Promise<Measurement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }
    img.onerror = reject
  })
}

function measureImageInNode(src: string): Measurement {
  const { width, height } = sizeOf(src)
  return {
    width,
    height,
  } as Measurement
}

const imageMeasureCache = new Map<string, Measurement>()

export async function measureImage(src: string): Promise<Measurement> {
  if (imageMeasureCache.has(src)) {
    return imageMeasureCache.get(src)!
  }

  let measureFunc: (src: string) => Promise<Measurement> | Measurement
  if (__BROWSER__) {
    measureFunc = measureImageSizeInBrowser
  }
  else {
    measureFunc = measureImageInNode
  }

  try {
    const measure = await measureFunc(src)
    imageMeasureCache.set(src, measure)
    return measure
  }
  catch (e) {
    console.warn(`measure image failed: ${src}, it will return { width: 50, height: 50}`)
    return {
      width: 50,
      height: 50,
    }
  }
}
