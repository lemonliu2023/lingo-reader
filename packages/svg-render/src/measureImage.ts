import sizeOf from 'image-size'
import type { Measurement } from './types'

declare let __BROWSER__: boolean

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

export async function measureImage(src: string): Promise<Measurement> {
  try {
    return __BROWSER__
      ? await measureImageSizeInBrowser(src)
      : measureImageInNode(src)
  }
  catch (e) {
    return {
      width: 50,
      height: 50,
    }
  }
}
