import { Buffer } from 'node:buffer'
import nodeCrypto from 'node:crypto'
import type { AesName, RsaHash } from './types'

export async function decryptRsa(
  privateKey: Uint8Array,
  base64Data: string,
  hash: RsaHash = 'sha256',
): Promise<Uint8Array> {
  if (__BROWSER__) {
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKey as Uint8Array<ArrayBuffer>,
      {
        name: 'RSA-OAEP',
        hash: { name: hash.replace('sha', 'sha-').toUpperCase() },
      },
      true,
      ['decrypt'],
    )

    const encryptedData = Uint8Array.from(atob(base64Data), char => char.charCodeAt(0))

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      cryptoKey,
      encryptedData,
    )

    return new Uint8Array(decryptedData)
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
    const isGcm = name.endsWith('gcm')
    const ivLength = isGcm ? 12 : 16
    const authTagLength = isGcm ? 16 : 0

    const iv = fileData.slice(0, ivLength)
    const authTag = isGcm ? fileData.slice(fileData.length - authTagLength) : undefined
    const encryptedData = fileData.slice(ivLength, fileData.length - authTagLength)

    const [algoName, bits, mode] = name.split('-') as [AesName, string, 'cbc' | 'ctr' | 'gcm']
    if (bits === '192') {
      throw new Error('AES-192 is not supported in the browser, please use AES-128 or AES-256.')
    }

    // Prepare the algorithm parameters
    let algorithmParams: AesCtrParams | AesCbcParams | AesGcmParams
    const algorithmParamsName = `${algoName}-${mode}`.toUpperCase()
    switch (mode) {
      case 'cbc': {
        algorithmParams = { name: algorithmParamsName, iv }
        break
      }
      case 'ctr': {
        algorithmParams = {
          name: algorithmParamsName,
          counter: iv,
          length: 64,
        }
        break
      }
      case 'gcm': {
        algorithmParams = {
          name: algorithmParamsName,
          iv,
          additionalData: new Uint8Array(0),
          tagLength: 128,
        }
        break
      }
    }

    // Import the key
    const key = await crypto.subtle.importKey(
      'raw',
      symmetricKey as Uint8Array<ArrayBuffer>,
      { name: algorithmParamsName, length: Number.parseInt(bits) },
      false,
      ['decrypt'],
    )

    let dataToDecrypt = encryptedData
    if (mode === 'gcm') {
      const combinedData = new Uint8Array(encryptedData.length + 16)
      combinedData.set(encryptedData)
      combinedData.set(authTag!, encryptedData.length)
      dataToDecrypt = combinedData
    }

    // Perform the decryption
    const decrypted = await crypto.subtle.decrypt(
      algorithmParams,
      key,
      dataToDecrypt,
    )

    return new Uint8Array(decrypted)
  }
  else {
    const isGcm = name.endsWith('gcm')
    const ivLength = isGcm ? 12 : 16
    const authTagLength = isGcm ? 16 : 0

    const iv = fileData.slice(0, ivLength)
    const authTag = isGcm ? fileData.slice(fileData.length - authTagLength) : undefined
    const encrypted = fileData.slice(ivLength, fileData.length - authTagLength)

    const decipher = nodeCrypto.createDecipheriv(name, symmetricKey, iv)

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
