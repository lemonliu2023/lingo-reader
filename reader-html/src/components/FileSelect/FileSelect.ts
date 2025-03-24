export async function streamDownload(
  url: string,
  onProgress?: (val: string) => void,
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
  const contentLength = response.headers.get('Content-Length') || 'unknown'
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
          if (contentLength === 'unknown') {
            onProgress(`${loadedSize}B/unknown`)
          }
          else {
            onProgress(`${(loadedSize / Number.parseInt(contentLength)).toFixed(2)}%`)
          }
        }

        controller.enqueue(value)
      }
      controller.close()
    },
  })

  const blob = await new Response(stream).blob()
  const file = new File([blob], 'temp', { type: blob.type })

  return file
}
