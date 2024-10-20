import pathNode from 'node:path'
import { describe, expect, it } from 'vitest'
import pathBrowser from 'path-browserify'

describe('path in browser', async () => {
  // @ts-expect-error __BROWSER__ is a global variable
  globalThis.__BROWSER__ = true

  const path = (await import('../src/path.ts')).default

  it('resolve', () => {
    // There exists process.cwd() in path-browserify,
    // so resolve() will return an absolute path in node.
    // And it could also return an absolute path in browser env through process.cwd(),
    // so we could replace process.cwd with '() => "/"'
    expect(path.resolve('a', 'b')).toBe(pathBrowser.resolve('a', 'b'))
  })

  it('basename', () => {
    expect(path.basename('a')).toBe(pathBrowser.basename('a'))
  })

  it('extname', () => {
    expect(path.extname('a.abc')).toBe(pathBrowser.extname('a.abc'))
  })

  it('dirname', () => {
    expect(path.dirname('a/b')).toBe(pathBrowser.dirname('a/b'))
  })

  it('isAbsolutePosix', () => {
    expect(path.isAbsolutePosix('/a')).toBe(pathBrowser.isAbsolute('/a'))
  })

  it('joinPosix', () => {
    expect(path.joinPosix('a', 'b')).toBe(pathBrowser.join('a', 'b'))
  })
})

describe('path in node', async () => {
  // @ts-expect-error __BROWSER__ is a global variable
  globalThis.__BROWSER__ = false

  // @ts-expect-error add cacheBust=node to avoid cache
  // it will throw error if `import path from '../src/path.ts'` directly
  //  for __BROWSER__ is not defined.
  // Because the cache of import() and __BROWSER__ has changed,
  //  we could add cacheBust=node to load the module again.
  const path = (await import('../src/path.ts?cacheBust=node')).default

  it('resolve', () => {
    expect(path.resolve('a', 'b')).toBe(pathNode.resolve('a', 'b'))
  })

  it('basename', () => {
    expect(path.basename('a')).toBe(pathNode.basename('a'))
  })

  it('extname', () => {
    expect(path.extname('a.abc')).toBe(pathNode.extname('a.abc'))
  })

  it('dirname', () => {
    expect(path.dirname('a\\b')).toBe(pathNode.dirname('a\\b'))
  })

  it('isAbsolutePosix', () => {
    expect(path.isAbsolutePosix('/a')).toBe(pathNode.posix.isAbsolute('/a'))
  })

  it('joinPosix', () => {
    expect(path.joinPosix('a', 'b')).toBe(pathNode.posix.join('a', 'b'))
  })
})
