import {
  existsSync as existsSyncNode,
  mkdirSync as mkdirSyncNode,
  readFileSync as readFileSyncNode,
  unlink as unlinkNode,
  writeFileSync as writeFileSyncNode,
} from 'node:fs'
import type {
  MakeDirectoryOptions,
  WriteFileOptions,
} from 'node:fs'

/**
 * This file provide a polyfill for fs module in browser environment.
 * It use __BROWSER__ to distinguish browser and Node environment.
 *  Because only image files need to read and write, so filesystem in browser
 *  is simulated by a Record<string, Uint8Array> object.
 *  In Node, it will use the native fs module.
 */
const imageRecord: Record<string, Uint8Array> = {}

function writeFileSync(file: string, data: Uint8Array, options?: WriteFileOptions): void {
  if (__BROWSER__) {
    imageRecord[file] = data
  }
  else {
    writeFileSyncNode(file, data, options)
  }
}

function readFileSync(file: string, _options?: {
  encoding?: null | undefined
  flag?: string | undefined
} | null) {
  if (__BROWSER__) {
    return imageRecord[file]
  }
  else {
    return readFileSyncNode(file)
  }
}

function existsSync(file: string): boolean {
  if (__BROWSER__) {
    return imageRecord[file] !== undefined
  }
  else {
    return existsSyncNode(file)
  }
}

function mkdirSync(dir: string, _options: MakeDirectoryOptions & {
  recursive: true
}): string | undefined {
  if (__BROWSER__) {
    imageRecord[dir] = new Uint8Array()
    return undefined
  }
  else {
    return mkdirSyncNode(dir, _options)
  }
}

function unlink(path: string): void {
  if (__BROWSER__) {
    delete imageRecord[path]
  }
  else {
    unlinkNode(path, () => { })
  }
}

export {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
  unlink,
}
