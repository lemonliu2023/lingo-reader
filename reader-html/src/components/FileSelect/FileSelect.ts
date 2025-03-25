type InfoType = 'unknown' | 'progress'
export interface ProgressInfo {
  type: InfoType
  val: number
}

export async function streamDownload(
  url: string,
  onProgress?: (val: ProgressInfo) => void,
): Promise<File> {
  if (url.length === 0) {
    throw new Error('URL is empty')
  }

  const response = await fetch(url.trim())

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }

  if (!response.body) {
    throw new Error('Response body is null')
  }

  const contentLengthStr = response.headers.get('Content-Length')
  const contentLength = contentLengthStr ? Number.parseInt(contentLengthStr) : -1
  let loadedSize = 0

  const reader = response.body.getReader()
  const stream = new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done)
          break
        loadedSize += value?.byteLength || 0

        if (onProgress) {
          if (contentLength === -1) {
            onProgress({
              type: 'unknown',
              val: loadedSize,
            })
          }
          else {
            onProgress({
              type: 'progress',
              val: loadedSize / contentLength,
            })
          }
        }

        controller.enqueue(value)
      }
      controller.close()
    },
  })

  const blob = await new Response(stream).blob()
  const fileName = url.split('/').pop() || 'temp'
  const file = new File([blob], fileName, { type: blob.type })

  return file
}
