import { path } from '@blingo-reader/shared'
import type {
  CollectionItem,
  Contributor,
  EpubMetadata,
  EpubSpine,
  GuideReference,
  Identifier,
  Link,
  ManifestItem,
  NavList,
  NavPoint,
  NavTarget,
  PageList,
  PageTarget,
  Subject,
} from './types'
import { camelCase } from './utils'
import { HREF_PREFIX } from './constant'

// the content of mimetype must be 'application/epub+zip'
export function parseMimeType(file: string): string {
  const fileContent = file.trim().toLowerCase()
  if (fileContent !== 'application/epub+zip') {
    throw new Error('Unsupported mime type. '
      + 'The mimetype file must be the application/epub+zip')
  }
  return fileContent
}

// meta-inf/container.xml
export function parseContainer(containerAST: any): string {
  // TODO: parse <link/> and more than one <rootfile/>
  const xmlContainer = containerAST.container
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
  if (path.isAbsolutePosix(fullPath)) {
    throw new Error('full-path must be a relative path')
  }

  return fullPath
}

/*
  can see the sample file in test/fixtures/metadata.opf
  The parse of opf refers to the
  EPUB 3.3 specification: https://www.w3.org/TR/epub-33/#sec-pkg-metadata
  and OPF 2.0 specification: https://idpf.org/epub/20/spec/OPF_2.0_final_spec.html
*/
// opf.metadata
export function parseMetadata(metadataAST: Record<string, any>): EpubMetadata {
  const metadata: EpubMetadata = {
    title: '',
    language: '',
    identifier: {
      id: '',
    },
    packageIdentifier: {
      id: '',
    },
    metas: {},
  }
  const idToElement = new Map<string, Subject | Identifier | Contributor>()
  for (const key in metadataAST) {
    const elements = metadataAST[key]
    const keyName = key.split(':').pop()!

    switch (keyName) {
      case 'title':
      case 'language':
      case 'description':
      case 'publisher':
      case 'type':
      case 'format':
      case 'source':
      case 'relation':
      case 'coverage':
      case 'rights': {
        metadata[keyName] = elements[0]._ ?? elements[0] ?? ''
        break
      }

      case 'date': {
        metadata.date = {}
        for (const dateEl of elements) {
          const eventName = dateEl.$?.['opf:event'] ?? 'publication'
          metadata.date[eventName] = dateEl._ ?? dateEl
        }
        break
      }

      case 'identifier': {
        for (const idEl of elements) {
          const identifier: Identifier = {
            id: idEl._,
            scheme: idEl.$?.['opf:scheme'] ?? '',
          }
          const idAttr = idEl.$ && idEl.$.id
          if (idAttr) {
            metadata.packageIdentifier = identifier
            idToElement.set(idAttr, identifier)
          }
          else {
            metadata.identifier = identifier
          }
        }
        break
      }

      case 'subject': {
        metadata.subject = []
        for (const subjectEl of elements) {
          const $ = subjectEl.$
          const subject = {
            subject: subjectEl._ ?? subjectEl,
            authority: $?.authority ?? '',
            term: $?.term ?? '',
          }
          metadata.subject.push(subject)
          if (subjectEl.$?.id) {
            idToElement.set(subjectEl.$.id, subject)
          }
        }
        break
      }

      case 'creator':
      case 'contributor': {
        metadata[keyName] = []
        for (const contributorEl of elements) {
          const $ = contributorEl.$
          const contributor: Contributor = {
            contributor: contributorEl._ ?? contributorEl,
            fileAs: $?.['opf:file-as'] ?? '',
            role: $?.['opf:role'] ?? '',
          }
          metadata[keyName]!.push(contributor)
          if ($?.id) {
            idToElement.set($.id, contributor)
          }
        }
        break
      }
    }
  }

  // <meta>
  const metas = metadataAST.meta ?? []
  for (const meta of metas) {
    const $ = meta.$
    if (meta._) {
      if ($.refines) {
        const refinesId: string = $.refines.slice(1)
        const element = idToElement.get(refinesId)
        if (!element) {
          console.warn(`No element with id "${refinesId}" found when parsing <metadata>`)
          continue
        }
        const property = camelCase($.property)
        if ('contributor' in element) {
          element[property as keyof Contributor] ||= meta._
        }
        else if ('subject' in element) {
          element[property as keyof Subject] ||= meta._
        }
        else if ('id' in element) {
          element[property as keyof Identifier] ||= meta._
          element.scheme = element.scheme || $.scheme
        }
      }
      else {
        const property = $.property
        metadata.metas![property] = meta._
      }
    }
    else {
      const name = $.name
      metadata.metas![name] = $.content
    }
  }

  // link
  const linksTag = metadataAST.link ?? []
  const links: Link[] = []
  for (const link of linksTag) {
    const $ = link.$
    if (!$.refines) {
      const element: Link = {
        href: '',
        rel: '',
      }
      for (const key in $) {
        element[camelCase(key) as keyof Link] = $[key]
      }
      links.push(element)
    }
    else {
      const refinesId: string = $.refines.slice(1)
      const element = idToElement.get(refinesId)
      if (!element) {
        console.warn(`No element with id "${refinesId}" found when parsing <metadata>`)
        continue
      }
      const rel = camelCase($.rel)
      const href: string = $.href
      // @ts-expect-error Unable to determine what key the element will have.
      //  element is a Contributor | Subject | Identifier
      element[rel] = href
    }
  }
  metadata.links = links

  return metadata
}

// read test/fixtures/metadata.opf to see the test case
export function parseManifest(
  manifestAST: Record<string, any>,
  contentBaseDir: string,
): Record<string, ManifestItem> {
  const items = manifestAST.item
  if (!items) {
    throw new Error('The manifest element must contain one or more item elements')
  }

  const manifest: Record<string, ManifestItem> = {}
  const needToFallback: ManifestItem[] = []
  for (const item of items) {
    const $ = item.$
    const {
      id,
      href,
      'media-type': mediaType,
      'media-overlay': mediaOverlay,
      properties,
    } = $
    if (!$ || !id || !href || !mediaType) {
      console.warn('The item in manifest must have attributes id, href and mediaType. So skip this item.')
      continue
    }
    manifest[id] = {
      id,
      href: path.joinPosix(contentBaseDir, href),
      mediaType,
      properties: properties || '',
      mediaOverlay: mediaOverlay || '',
    }
    if ($.fallback) {
      manifest[id].fallback = [$.fallback]
      needToFallback.push(manifest[id])
    }
  }

  // fallback attribute
  for (const item of needToFallback) {
    const set = new Set<string>()
    set.add(item.id)
    let nextItem = manifest[item.fallback![0]]
    while (nextItem && nextItem.fallback) {
      set.add(nextItem.id)
      const fallback = nextItem.fallback
      if (fallback.length > 1) {
        item.fallback!.push(...fallback)
        break
      }
      const fallbackId = fallback[0]
      if (set.has(fallbackId)) {
        console.warn(`Cycle references have appeard when next item id is "${fallbackId}". `
        + 'Therefore stop parsing.')
        break
      }
      item.fallback!.push(fallbackId)

      nextItem = manifest[fallbackId]
    }
  }

  return manifest
}

/**
 * Parse the spine element in the .opf file and read the toc file path in <spine> tag
 * @param spineAST <spine> xml ast
 * @param manifest manifest parsed from <manifest> tag
 * @returns { { tocPath: string, spine: EpubSpine } } spine
 */
export function parseSpine(
  spineAST: Record<string, any>,
  manifest: Record<string, ManifestItem>,
): { tocPath: string, spine: EpubSpine } {
  let tocPath = ''
  if (spineAST.$?.toc) {
    tocPath = manifest[spineAST.$.toc].href || ''
  }

  const spine: EpubSpine = []
  const itemrefs = spineAST.itemref
  if (!itemrefs) {
    throw new Error('The spine element must contain one or more itemref elements')
  }
  for (const itemref of itemrefs) {
    const $ = itemref.$
    if ($.idref) {
      const element = manifest[$.idref]
      spine.push({
        ...element,
        href: `Epub:${element.href}`,
        // default to 'yes'
        linear: $.linear || 'yes',
      })
    }
  }
  return {
    tocPath,
    spine,
  }
}

/**
 * Parse the guide element in the .opf file, similiar to <manifest>, <spine>...
 * @param guideAST <guide> xml ast
 * @param baseDir base directory of the .opf file
 * @returns { GuideReference[] } GuideReference[]
 */
export function parseGuide(guideAST: Record<string, any>, baseDir: string): GuideReference[] {
  const guide: GuideReference[] = []
  const references = guideAST.reference
  if (!references) {
    throw new Error('Within the package there may be one guide element, containing one or more reference elements.')
  }
  for (const reference of references) {
    const element = reference.$
    if (element.href && element.href.length > 0) {
      element.href = HREF_PREFIX + path.joinPosix(baseDir, element.href)
    }
    guide.push(element)
  }
  return guide
}

/**
 * Parse the collection element in the .opf file, similiar to <guide>, <manifest>...
 * @param collectionAST <collection> xml ast
 * @param contentBaseDir base directory of the .opf file
 * @returns { CollectionItem[] } CollectionItem[]
 */
export function parseCollection(collectionAST: any[], contentBaseDir: string): CollectionItem[] {
  const collections: CollectionItem[] = []
  for (const collection of collectionAST) {
    const role = collection.$.role
    const links: string[] = []
    for (const link of collection.link) {
      links.push(path.joinPosix(contentBaseDir, (link.$.href)))
    }
    collections.push({
      role,
      links,
    })
  }
  return collections
}

/**
 * Parse the navMap element in the .ncx file
 * @param navMap navMap xml ast
 * @param hrefToIdMap map of href to manifest item id
 * @param ncxBaseDir base directory of the ncx file
 * @returns { NavPoint[] } NavPoint[]
 */
export function parseNavMap(
  navMap: Record<string, any>,
  hrefToIdMap: Record<string, string>,
  ncxBaseDir: string,
): NavPoint[] {
  const output: NavPoint[] = []
  walkNavMap(output, navMap.navPoint, hrefToIdMap, ncxBaseDir)
  return output
}

/**
 * Walk the navMap element in the .ncx file
 * @param output output array
 * @param navPoints navPoint xml ast
 * @param hrefToIdMap map of href to manifest item id
 * @param ncxBaseDir base directory of the ncx file
 * @param depth depth of the navPoint
 */
function walkNavMap(
  output: NavPoint[],
  navPoints: any[],
  hrefToIdMap: Record<string, string>,
  ncxBaseDir: string,
  depth: number = 0,
): void {
  if (depth > 7) {
    return
  }

  for (const navPoint of navPoints) {
    let element: NavPoint = {
      label: '',
      href: '',
      id: '',
      playOrder: '',
    }
    if (navPoint.navLabel) {
      const href = path.joinPosix(ncxBaseDir, navPoint.content[0].$?.src)
      const hrefPath = href.split('#')[0]
      element = {
        label: navPoint.navLabel[0]?.text[0] || '',
        href: HREF_PREFIX + href,
        id: hrefToIdMap[hrefPath],
        playOrder: navPoint.$?.playOrder || '',
      }
      output.push(element)
    }

    if (navPoint.navPoint) {
      element.children = []
      walkNavMap(
        element.children,
        navPoint.navPoint,
        hrefToIdMap,
        ncxBaseDir,
        depth + 1,
      )
    }
  }
}

/**
 * Parse the pageList element in the .ncx file
 * @param pageList pageList xml ast
 * @param hrefToIdMap map of href to manifest item id
 * @param ncxBaseDir base directory of the ncx file
 * @returns { PageList } PageList
 */
export function parsePageList(
  pageList: Record<string, any>,
  hrefToIdMap: Record<string, string>,
  ncxBaseDir: string,
): PageList {
  let label: string = ''
  if (pageList.navLabel) {
    label = pageList.navLabel[0].text[0]
  }
  const output: PageTarget[] = []
  for (const pageTarget of pageList.pageTarget) {
    const src = path.joinPosix(ncxBaseDir, pageTarget.content[0].$?.src)
    const href = src.split('#')[0]
    const $ = pageTarget.$

    const element: PageTarget = {
      label: pageTarget.navLabel[0].text[0] || '',
      value: $.value || '',
      href: HREF_PREFIX + src,
      playOrder: $.playOrder || '',
      type: $.type || '',
      correspondId: hrefToIdMap[href],
    }

    output.push(element)
  }

  return {
    label,
    pageTargets: output,
  }
}

/**
 * Parse the navList element in the .ncx file
 * @param navList navList xml ast
 * @param hrefToIdMap map of href to manifest item id
 * @param ncxBaseDir base directory of the ncx file
 * @returns { NavList } NavList
 */
export function parseNavList(
  navList: Record<string, any>,
  hrefToIdMap: Record<string, string>,
  ncxBaseDir: string,
): NavList {
  let label: string = ''
  if (navList.navLabel) {
    label = navList.navLabel[0].text[0]
  }

  const navTargets: NavTarget[] = []
  for (const navTarget of navList.navTarget) {
    const src = path.joinPosix(ncxBaseDir, navTarget.content[0].$?.src)
    const href = src.split('#')[0]

    const element: NavTarget = {
      label: navTarget.navLabel[0]?.text?.[0] || '',
      href: HREF_PREFIX + src,
      correspondId: hrefToIdMap[href],
    }

    navTargets.push(element)
  }

  return {
    label,
    navTargets,
  }
}
