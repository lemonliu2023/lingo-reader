import type { MobiToc } from '@lingo-reader/mobi-parser'

export enum ReaderType {
  COLUMN = 'Column',
  SCROLL = 'Scroll',
  SCROLL_WITH_NOTE = 'Scroll With Note',
}

export interface FlatedTocItem {
  label: string
  href: string
  level: number
}
export function flatToc(toc: MobiToc) {
  const result: FlatedTocItem[] = []
  const dfs = (toc: MobiToc, level: number) => {
    for (const item of toc) {
      result.push({
        label: item.label,
        href: item.href,
        level,
      })
      if (item.children) {
        dfs(item.children, level + 1)
      }
    }
  }

  dfs(toc, 0)
  return result
}
