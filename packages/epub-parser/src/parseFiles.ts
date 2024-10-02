import path from 'node:path'
import { parsexml } from './utils'

export function parseMimeType(file: string): string {
  const fileContent = file.trim().toLowerCase()
  if (fileContent !== 'application/epub+zip') {
    throw new Error('Unsupported mime type. '
      + 'The mimetype file must be the application/epub+zip')
  }
  return fileContent
}

export async function parseContainer(containerXml: string): Promise<string> {
  // TODO: parse <link/> and more than one <rootfile/>
  const xmlContainer = (await parsexml(containerXml)).container
  if (!xmlContainer
    || !xmlContainer.rootfiles
    || xmlContainer.rootfiles.length === 0) {
    throw new Error('No <rootfiles></rootfiles> tag found in meta-inf/container.xml')
  }

  const rootFile = xmlContainer.rootfiles[0].rootfile[0]
  const mediaType = rootFile.$['media-type']
  if (mediaType !== 'application/oebps-package+xml') {
    throw new Error('media-type of <rootfile/> application/oebps-package+xml')
  }

  const fullPath = rootFile.$['full-path']
  if (path.isAbsolute(fullPath)) {
    throw new Error('full-path must be a relative path')
  }

  return fullPath
}
