import type { Buffer } from 'node:buffer'
import { MOBI_ENCODING } from './headers'
import type { Header } from './types'

const htmlEntityMap: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': '\'',
}
export function unescapeHTML(str: string): string {
  if (!str.includes('&')) {
    return str
  }

  return str.replace(/&(#x[\dA-Fa-f]+|#\d+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity.startsWith('#x')) {
      // Handle hexadecimal entities
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16))
    }
    else if (entity.startsWith('#')) {
      // Handle decimal entities
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10))
    }
    else {
      // Handle named entities
      return htmlEntityMap[match] || match
    }
  })
}

export async function toArrayBuffer(file: File | Buffer): Promise<ArrayBuffer> {
  if (file instanceof File) {
    return file.arrayBuffer()
  }
  else {
    return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer
  }
}

const decoder = new TextDecoder()
const getString = (buffer: ArrayBuffer): string => decoder.decode(buffer)
function getUint(buffer: ArrayBuffer): number {
  const l = buffer.byteLength
  const func = l === 4 ? 'getUint32' : l === 2 ? 'getUint16' : 'getUint8'
  return new DataView(buffer)[func](0)
}

interface Struct {
  [key: string]: string | number
}
export function getStruct(def: Header, buffer: ArrayBuffer): Struct {
  return Object.fromEntries(
    Array.from(Object.entries(def))
      .map(([key, [start, len, type]]) => [
        key,
        (type === 'string' ? getString : getUint)(buffer.slice(start, start + len)),
      ]),
  )
}

type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array
export function concatTypedArrays<T extends TypedArray>(...arrays: T[]): T {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0)
  const result = new (arrays[0].constructor as any)(totalLength)

  let offset = 0
  for (const array of arrays) {
    result.set(array, offset)
    offset += array.length
  }

  return result
}

export const getDecoder = (x: keyof typeof MOBI_ENCODING) => new TextDecoder(MOBI_ENCODING[x])

export function getVarLen(byteArray: Uint8Array, i = 0) {
  let value = 0
  let length = 0
  for (const byte of byteArray.subarray(i, i + 4)) {
    value = (value << 7) | (byte & 0b111_1111) >>> 0
    length++
    if (byte & 0b1000_0000) {
      break
    }
  }
  return { value, length }
}

export function getVarLenFromEnd(byteArray: Uint8Array): number {
  let value = 0
  for (const byte of byteArray.subarray(-4)) {
    if (byte & 0b1000_0000) {
      value = 0
    }
    value = (value << 7) | (byte & 0b111_1111)
  }
  return value
}

export function countBitsSet(x: number): number {
  let count = 0
  for (; x > 0; x = x >> 1) {
    if ((x & 1) === 1) {
      count++
    }
  }
  return count
}

export function countUnsetEnd(x: number): number {
  let count = 0
  while ((x & 1) === 0) {
    x = x >> 1
    count++
  }
  return count
}

export function decompressPalmDOC(array: Uint8Array): Uint8Array {
  const output: number[] = []
  for (let i = 0; i < array.length; i++) {
    const byte = array[i]
    if (byte === 0) {
      // uncompressed literal, just copy it
      output.push(0)
    }
    else if (byte <= 8) {
      // copy next 1-8 bytes
      for (const x of array.subarray(i + 1, (i += byte) + 1))
        output.push(x)
    }
    else if (byte <= 0b0111_1111) {
      // uncompressed literal
      output.push(byte)
    }
    else if (byte <= 0b1011_1111) {
      // 1st and 2nd bits are 10, meaning this is a length-distance pair
      // read next byte and combine it with current byte
      const bytes = (byte << 8) | array[i++ + 1]
      // the 3rd to 13th bits encode distance
      const distance = (bytes & 0b0011_1111_1111_1111) >>> 3
      // the last 3 bits, plus 3, is the length to copy
      const length = (bytes & 0b111) + 3
      for (let j = 0; j < length; j++)
        output.push(output[output.length - distance])
    }
    else {
      // compressed from space plus char
      output.push(32, byte ^ 0b1000_0000)
    }
  }
  return Uint8Array.from(output)
}

export function read32Bits(byteArray: Uint8Array, from: number): bigint {
  const startByte = from >> 3
  const end = from + 32
  const endByte = end >> 3
  let bits = 0n
  for (let i = startByte; i <= endByte; i++) {
    bits = bits << 8n | BigInt(byteArray[i] ?? 0)
  }
  return (bits >> (8n - BigInt(end & 7))) & 0xFFFFFFFFn
}

export function isMOBI(file: ArrayBuffer) {
  const magic = getString(file.slice(60, 68))
  return magic === 'BOOKMOBI'// || magic === 'TEXtREAd'
}
