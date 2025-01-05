import { readFileSync } from 'node:fs'
import { concatTypedArrays, getFragmentSelector, getIndexData, getStruct, getUint, makePosURI, parsePosURI, toArrayBuffer } from './utils'
import { MobiFile } from './mobiFile'
import { fdstHeader } from './headers'
import type { Azw3Chapter, Azw3Guide, Azw3Toc, Azw3TocItem, FragTable, NcxItem, SkelTable } from './types'

export async function initAzw3File(file: string | File) {
  const azw3 = new Azw3(file)
  await azw3.load()
  await azw3.init()

  return azw3
}

export class Azw3 {
  fileArrayBuffer!: ArrayBuffer
  mobiFile!: MobiFile

  fdstTable: number[][] = []
  fullRawLength: number = 0
  skelTable: SkelTable = []
  fragTable: FragTable = []
  chapters: Azw3Chapter[] = []
  toc: Azw3Toc | undefined = []
  guide: Azw3Guide | undefined = []

  fragmentOffsets = new Map<number, number[]>()
  fragmentSelectors = new Map<number, Map<number, string>>()

  rawHead: Uint8Array<ArrayBuffer> = new Uint8Array()
  rawTail: Uint8Array<ArrayBuffer> = new Uint8Array()
  lastLoadedHead: number = -1
  lastLoadedTail: number = -1

  resourceCache = new Map<string, string>()
  inlineResourceCache = new Map<string, string>()

  getMetadata() {
    return this.mobiFile.getMetadata()
  }

  getCoverImage() {
    return this.mobiFile.getCoverImage()
  }

  constructor(private file: string | File) { }

  async load() {
    this.fileArrayBuffer = await toArrayBuffer(
      __BROWSER__
        ? this.file as File
        : readFileSync(this.file as string),
    )
    this.mobiFile = new MobiFile(this.fileArrayBuffer)
  }

  async init() {
    const loadRecord = this.mobiFile.loadRecord.bind(this.mobiFile)
    const kf8Header = this.mobiFile.kf8Header!
    const fdstBuffer = this.mobiFile.loadRecord(kf8Header!.fdst)
    const fdst = getStruct(fdstHeader, fdstBuffer)
    if (fdst.magic !== 'FDST') {
      throw new Error('Missing FDST record')
    }
    // fdstTable
    const fdstTable = Array.from(
      { length: fdst.numEntries },
      (_, i) => 12 + i * 8,
    ).map(offset => [
      getUint(fdstBuffer.slice(offset, offset + 4)),
      getUint(fdstBuffer.slice(offset + 4, offset + 8)),
    ])
    this.fdstTable = fdstTable
    this.fullRawLength = fdstTable[fdstTable.length - 1][1]

    // skelTable
    const skelData = getIndexData(kf8Header.skel, loadRecord)
    const skelTable = skelData.table.map(({ name, tagMap }, index) => ({
      index,
      name,
      numFrag: tagMap[1][0],
      offset: tagMap[6][0],
      length: tagMap[6][1],
    }))
    this.skelTable = skelTable

    // fragTable
    const fragData = getIndexData(kf8Header.frag, loadRecord)
    const fragTable = fragData.table.map(({ name, tagMap }) => ({
      insertOffset: Number.parseInt(name),
      selector: fragData.cncx[tagMap[2][0]],
      index: tagMap[4][0],
      offset: tagMap[6][0],
      length: tagMap[6][1],
    }))
    this.fragTable = fragTable

    // chapter obj array
    const chapters = skelTable.reduce((acc, skel, index) => {
      const last = acc[acc.length - 1]
      const fragStart = last?.fragEnd ?? 0
      const fragEnd = fragStart + skel.numFrag
      const frags = fragTable.slice(fragStart, fragEnd)
      const length = skel.length + frags.reduce((a, v) => a + v.length, 0)
      const totalLength = (last?.totalLength ?? 0) + length

      acc.push({ id: index, skel, frags, fragEnd, length, totalLength })
      return acc
    }, [] as Azw3Chapter[])
    this.chapters = chapters

    // table of contents
    const ncx = this.mobiFile.getNCX()
    if (ncx) {
      const map: (item: NcxItem) => Azw3TocItem = ({ label, pos, children }) => {
        const [fid, off] = pos
        const href = makePosURI(fid, off)
        const arr = this.fragmentOffsets.get(fid)
        if (arr) {
          arr.push(off)
        }
        else {
          this.fragmentOffsets.set(fid, [off])
        }
        return { label, href, subitems: children?.map(map) }
      }
      this.toc = ncx.map(map)
      this.guide = this.getGuide()
    }
  }

  getGuide(): Azw3Guide | undefined {
    const index = this.mobiFile.kf8Header!.guide
    if (index < 0xFFFFFFFF) {
      const loadRecord = this.mobiFile.loadRecord.bind(this.mobiFile)
      const { table, cncx } = getIndexData(index, loadRecord)
      return table.map(({ name, tagMap }) => ({
        label: cncx[tagMap[1][0]] ?? '',
        type: name?.split(/\s/),
        href: makePosURI(tagMap[6]?.[0] ?? tagMap[3]?.[0]),
      }))
    }
    return undefined
  }

  loadRaw(start: number, end: number): Uint8Array {
    const distanceHead = end - this.rawHead.length
    const distanceEnd = this.fullRawLength === 0
      ? Infinity
      : (this.fullRawLength - this.rawTail.length) - start
    // load from the start
    if (distanceHead < 0 || distanceHead < distanceEnd) {
      while (this.rawHead.length < end) {
        this.lastLoadedHead++
        const index = this.lastLoadedHead
        const data = this.mobiFile.loadTextBuffer(index)
        this.rawHead = concatTypedArrays([this.rawHead, data]) as Uint8Array<ArrayBuffer>
      }
      return this.rawHead.slice(start, end)
    }
    // load from the end
    while (this.fullRawLength - this.rawTail.length > start) {
      this.lastLoadedTail++
      const index = this.mobiFile.palmdocHeader.numTextRecords - 1 - this.lastLoadedTail
      const data = this.mobiFile.loadTextBuffer(index)
      this.rawTail = concatTypedArrays([data, this.rawTail]) as Uint8Array<ArrayBuffer>
    }
    const rawTailStart = this.fullRawLength - this.rawTail.length
    return this.rawTail.slice(start - rawTailStart, end - rawTailStart)
  }

  loadText(chapter: Azw3Chapter) {
    const { skel, frags, length } = chapter
    const raw = this.loadRaw(skel.offset, skel.offset + length)
    let skeleton = raw.slice(0, skel.length)
    for (const frag of frags) {
      const insertOffset = frag.insertOffset - skel.offset
      const offset = skel.length + frag.offset
      const fragRaw = raw.slice(offset, offset + frag.length)
      skeleton = concatTypedArrays([
        skeleton.slice(0, insertOffset),
        fragRaw,
        skeleton.slice(insertOffset),
      ])

      const offsets = this.fragmentOffsets.get(frag.index)
      if (offsets) {
        for (const offset of offsets) {
          const str = this.mobiFile.decode(fragRaw.buffer).slice(offset)
          const selector = getFragmentSelector(str)
          if (selector) {
            this.cacheFragmentSelector(frag.index, offset, selector)
          }
        }
      }
    }
    return this.mobiFile.decode(skeleton.buffer)
  }

  cacheFragmentSelector(id: number, offset: number, selector: string) {
    const map = this.fragmentSelectors.get(id)
    if (map) {
      map.set(offset, selector)
    }
    else {
      const map: Map<number, string> = new Map()
      this.fragmentSelectors.set(id, map)
      map.set(offset, selector)
    }
  }

  loadFlow(index: number) {
    if (index < 0xFFFFFFFF) {
      return this.loadRaw(this.fdstTable[index][0], this.fdstTable[index][1])
    }
    return undefined
  }

  resolveHref(href: string): { id: number, selector: string } | undefined {
    // is external link
    if (/^(?!blob|kindle)\w+:/i.test(href)) {
      return
    }
    const { fid, off } = parsePosURI(href)
    const chapter = this.chapters.find(
      chapter => chapter.frags.some(
        frag => frag.index === fid,
      ),
    )
    if (!chapter) {
      return
    }
    // return selector if cache
    const id = chapter.id
    const savedSelector = this.fragmentSelectors.get(fid)?.get(off)
    if (savedSelector) {
      return { id, selector: savedSelector }
    }

    // load fragment selector
    const { skel, frags } = chapter
    const frag = frags.find(frag => frag.index === fid)!
    const offset = skel.offset + skel.length + frag.offset
    const fragRaw = this.loadRaw(offset, offset + frag.length)
    const str = this.mobiFile.decode(fragRaw.buffer as ArrayBuffer).slice(off)
    const selector = getFragmentSelector(str)
    this.cacheFragmentSelector(fid, off, selector!)

    return { id, selector }
  }

  // loadResourceBlob(str: string) {
  //   const { resourceType, id, type } = parseResourceURI(str)
  //   const raw = resourceType === 'flow'
  //     ? this.loadFlow(id)
  //     : this.mobiFile.loadResource(id - 1)
  //   const result = [MIME.XHTML, MIME.HTML, MIME.CSS, MIME.SVG].includes(type)
  //     ? this.replaceResources(this.mobiFile.decode(raw?.buffer as ArrayBuffer)) : raw
  //   const doc = type === MIME.SVG ? this.parser.parseFromString(result, type) : null
  //   return [new Blob([result], { type }),
  //   // SVG wrappers need to be inlined
  //   // as browsers don't allow external resources when loading SVG as an image
  //   doc?.getElementsByTagNameNS('http://www.w3.org/2000/svg', 'image')?.length
  //     ? doc.documentElement : null]
  // }

  // loadResource(str: string): string {
  //   if (this.resourceCache.has(str)) {
  //     return this.resourceCache.get(str)!
  //   }
  //   const [blob, inline] = this.loadResourceBlob(str)
  //   const url = inline ? str : URL.createObjectURL(blob)
  //   if (inline) {
  //     this.inlineResourceCache.set(url, inline)
  //   }
  //   this.resourceCache.set(str, url)
  //   return url
  // }

  // replaceResources(str: string) {
  //   const regex = new RegExp(kindleResourceRegex, 'g')
  //   return replaceSeries(str, regex, this.loadResource.bind(this))
  // }
}
