import pathNode from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import pathBrowser from 'path-browserify'
import { path } from '../src'

describe('path in browser', () => {
  beforeAll(() => {
    // @ts-expect-error __BROWSER__ is a global variable
    globalThis.__BROWSER__ = true
  })

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

describe('path in node', () => {
  beforeAll(() => {
    // @ts-expect-error __BROWSER__ is a global variable
    globalThis.__BROWSER__ = false
  })

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
