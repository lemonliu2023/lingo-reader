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

export default {
  resolve: __BROWSER__ ? resolveBrowserify : resolveNode,
  basename: __BROWSER__ ? basenameBrowserify : basenameNode,
  extname: __BROWSER__ ? extnameBrowserify : extnameNode,
  dirname: __BROWSER__ ? dirnameBrowserify : dirnameNode,
  isAbsolutePosix: __BROWSER__ ? isAbsoluteBrowserify : path.posix.isAbsolute,
  joinPosix: __BROWSER__ ? joinBrowserify : path.posix.join,
}
