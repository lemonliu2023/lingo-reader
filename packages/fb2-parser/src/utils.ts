import { readFile } from 'node:fs/promises'
import type { InputFile } from 'packages/shared'

export async function inputFileToUint8Array(file: InputFile): Promise<Uint8Array> {
  if (file instanceof Uint8Array) {
    return file
  }

  if (__BROWSER__) {
    if (typeof file === 'string') {
      throw new TypeError('The `fb2` param cannot be a `string` in browser env.')
    }
    return new Uint8Array(await file.arrayBuffer())
  }
  else {
    if (typeof file === 'string') {
      // Converting Buffer to Uint8 via `new UintArray` may
      //  result in garbled characters
      return await readFile(file)
    }
    throw new Error('The `fb2` param cannot be a `File` in node env.')
  }
}

export function extend<T extends object, U extends object>(
  target: T,
  source: U,
  ignoreKeys: (keyof (T & U))[] = [],
): T & U {
  for (const key in source) {
    if (
      Object.prototype.hasOwnProperty.call(source, key)
      && !(key in target)
    ) {
      if (!ignoreKeys.includes(key)) {
        // @ts-expect-error error
        target[key] = source[key]
      }
    }
  }
  return target as T & U
}
