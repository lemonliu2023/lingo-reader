import { Buffer } from 'node:buffer'
import nodeCrypto from 'node:crypto'
import type { AesName, RsaHash } from './types'

export async function decryptRsa(
  privateKey: Uint8Array,
  base64Data: string,
  hash: RsaHash = 'sha256',
): Promise<Uint8Array> {
  if (__BROWSER__) {
    throw new Error('decryptRsa is currently not supported in browser environment')
  }
  else {
    const encryptedData = Buffer.from(base64Data, 'base64')
    const keyObj = nodeCrypto.createPrivateKey({
      key: Buffer.from(privateKey),
      format: 'der',
      type: 'pkcs8',
    })
    const decryptedData = nodeCrypto.privateDecrypt(
      {
        key: keyObj,
        padding: nodeCrypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: hash,
      },
      encryptedData,
    )
    return new Uint8Array(decryptedData)
  }
}

export async function decryptAes(
  name: AesName,
  symmetricKey: Uint8Array,
  fileData: Uint8Array,
): Promise<Uint8Array> {
  if (__BROWSER__) {
    throw new Error('decryptAes is currently not supported in browser environment')
  }
  else {
    const isGcm = name.endsWith('gcm')
    const ivLength = isGcm ? 12 : 16
    const authTagLength = isGcm ? 16 : 0

    const iv = fileData.slice(0, ivLength)
    const authTag = isGcm ? fileData.slice(fileData.length - authTagLength) : undefined
    const encrypted = fileData.slice(ivLength, fileData.length - authTagLength)

    const decipher = nodeCrypto.createDecipheriv(name, Buffer.from(symmetricKey), iv)

    if (isGcm && authTag) {
      (decipher as nodeCrypto.DecipherGCM).setAuthTag(authTag)
    }

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ])

    return new Uint8Array(decrypted)
  }
}
