/**
 * using different packages in different environments, include node and browser
 */

import path, {
  basename as basenameNode,
  dirname as dirnameNode,
  extname as extnameNode,
  resolve as resolveNode,
} from 'node:path'
import {
  basename as basenameBrowserify,
  dirname as dirnameBrowserify,
  extname as extnameBrowserify,
  isAbsolute as isAbsoluteBrowserify,
  join as joinBrowserify,
  resolve as resolveBrowserify,
} from 'path-browserify'

function resolve(...args: string[]): string {
  return __BROWSER__ ? resolveBrowserify(...args) : resolveNode(...args)
}

function basename(p: string, ext?: string): string {
  return __BROWSER__ ? basenameBrowserify(p, ext) : basenameNode(p, ext)
}

function extname(p: string): string {
  return __BROWSER__ ? extnameBrowserify(p) : extnameNode(p)
}

function dirname(p: string): string {
  return __BROWSER__ ? dirnameBrowserify(p) : dirnameNode(p)
}

function isAbsolutePosix(p: string): boolean {
  return __BROWSER__ ? isAbsoluteBrowserify(p) : path.posix.isAbsolute(p)
}

function joinPosix(...paths: string[]): string {
  return __BROWSER__ ? joinBrowserify(...paths) : path.posix.join(...paths)
}

export default {
  resolve,
  basename,
  extname,
  dirname,
  isAbsolutePosix,
  joinPosix,
}
