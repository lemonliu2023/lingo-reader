'use strict';

var shared = require('@lingo-reader/shared');
var fs = require('node:fs');
var JSZip = require('jszip');
var fflate = require('fflate');
var node_buffer = require('node:buffer');
var nodeCrypto = require('node:crypto');

function writeFileSync(file, data, options) {
  {
    fs.writeFileSync(file, data, options);
  }
}
function readFileSync(file, _options) {
  {
    return fs.readFileSync(file);
  }
}
function existsSync(file) {
  {
    return fs.existsSync(file);
  }
}
function mkdirSync(dir, _options) {
  {
    return fs.mkdirSync(dir, _options);
  }
}
function unlink(path) {
  {
    fs.unlink(path, () => {
    });
  }
}

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
async function createZipFile(filePath) {
  const zip = new ZipFile(filePath);
  await zip.loadZip();
  return zip;
}
class ZipFile {
  constructor(filePath) {
    this.filePath = filePath;
    __publicField$1(this, "jsZip");
    __publicField$1(this, "names");
    __publicField$1(this, "pathToProcessors", {});
  }
  getNames() {
    return [...this.names.values()];
  }
  useDeprocessors(processors) {
    this.pathToProcessors = {
      ...this.pathToProcessors,
      ...processors
    };
  }
  async loadZip() {
    this.jsZip = await this.readZip(this.filePath);
    this.names = new Map(Object.keys(this.jsZip.files).map(
      (name) => {
        return [name.toLowerCase(), name];
      }
    ));
  }
  async readZip(file) {
    return new Promise((resolve, reject) => {
      {
        const fileToLoad = typeof file === "string" ? new Uint8Array(fs.readFileSync(file)) : file;
        new JSZip().loadAsync(fileToLoad).then((zipFile) => {
          resolve(zipFile);
        });
      }
    });
  }
  async readFile(name) {
    const file = await this.readResource(name);
    return new TextDecoder().decode(file);
  }
  async readResource(name) {
    if (!this.hasFile(name)) {
      console.warn(`${name} file was not exit in ${this.filePath}, return an empty uint8 array`);
      return new Uint8Array();
    }
    const fileName = this.getFileName(name);
    let file = await this.jsZip.file(fileName).async("uint8array");
    if (this.pathToProcessors[fileName]) {
      for (const processor of this.pathToProcessors[fileName]) {
        file = await processor(file);
      }
    }
    return file;
  }
  hasFile(name) {
    return this.names.has(name.toLowerCase());
  }
  getFileName(name) {
    return this.names.get(name.toLowerCase());
  }
}
const resourceExtensionToMimeType = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  tiff: "image/tiff",
  tif: "image/tiff",
  heic: "image/heic",
  avif: "image/avif",
  css: "text/css",
  // video
  mp4: "video/mp4",
  mkv: "video/mkv",
  webm: "video/webm",
  // audio
  mp3: "audio/mp3",
  wav: "audio/wav",
  ogg: "audio/ogg",
  // font
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
  eot: "font/eot"
};
const savedResourceMediaTypePrefixes = new Set(Object.values(resourceExtensionToMimeType));
const prefixMatch = /(?!xmlns)^.*:/;
function extractEncryptionKeys(options) {
  const encryptionKeys = {};
  if (options.rsaPrivateKey) {
    encryptionKeys.rsaPrivateKey = typeof options.rsaPrivateKey === "string" ? Uint8Array.from(atob(options.rsaPrivateKey), (c) => c.charCodeAt(0)) : options.rsaPrivateKey;
  }
  if (options.aesSymmetricKey) {
    encryptionKeys.aesSymmetricKey = typeof options.aesSymmetricKey === "string" ? Uint8Array.from(atob(options.aesSymmetricKey), (c) => c.charCodeAt(0)) : options.aesSymmetricKey;
  }
  return encryptionKeys;
}
function withMemoize(fn) {
  const cache = /* @__PURE__ */ new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
function smilTimeToSeconds(timeStr) {
  if (timeStr.endsWith("s")) {
    return Number.parseFloat(timeStr);
  }
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  } else {
    return Number(timeStr);
  }
}
const cachedSmilTimeToSeconds = withMemoize(smilTimeToSeconds);

const HREF_PREFIX = "epub:";

async function decryptRsa(privateKey, base64Data, hash = "sha256") {
  {
    const encryptedData = node_buffer.Buffer.from(base64Data, "base64");
    const keyObj = nodeCrypto.createPrivateKey({
      key: node_buffer.Buffer.from(privateKey),
      format: "der",
      type: "pkcs8"
    });
    const decryptedData = nodeCrypto.privateDecrypt(
      {
        key: keyObj,
        padding: nodeCrypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: hash
      },
      encryptedData
    );
    return new Uint8Array(decryptedData);
  }
}
async function decryptAes(name, symmetricKey, fileData) {
  {
    const isGcm = name.endsWith("gcm");
    const ivLength = isGcm ? 12 : 16;
    const authTagLength = isGcm ? 16 : 0;
    const iv = fileData.slice(0, ivLength);
    const authTag = isGcm ? fileData.slice(fileData.length - authTagLength) : void 0;
    const encrypted = fileData.slice(ivLength, fileData.length - authTagLength);
    const decipher = nodeCrypto.createDecipheriv(name, symmetricKey, iv);
    if (isGcm && authTag) {
      decipher.setAuthTag(authTag);
    }
    const decrypted = node_buffer.Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    return new Uint8Array(decrypted);
  }
}

function parseMimeType(file) {
  const fileContent = file.trim().toLowerCase();
  if (fileContent !== "application/epub+zip") {
    throw new Error("Unsupported mime type. The mimetype file must be the application/epub+zip");
  }
  return fileContent;
}
function parseContainer(containerAST) {
  const xmlContainer = containerAST.container;
  if (!xmlContainer || !xmlContainer.rootfiles || xmlContainer.rootfiles.length === 0) {
    throw new Error("No <rootfiles></rootfiles> tag found in meta-inf/container.xml");
  }
  const rootFile = xmlContainer.rootfiles[0].rootfile[0];
  const mediaType = rootFile.$["media-type"];
  if (mediaType !== "application/oebps-package+xml") {
    throw new Error("media-type of <rootfile/> application/oebps-package+xml");
  }
  const fullPath = rootFile.$["full-path"];
  if (shared.path.isAbsolutePosix(fullPath)) {
    throw new Error("full-path must be a relative path");
  }
  return fullPath;
}
function parseMetadata(metadataAST) {
  const metadata = {
    title: "",
    language: "",
    identifier: {
      id: ""
    },
    packageIdentifier: {
      id: ""
    },
    metas: {}
  };
  const idToElement = /* @__PURE__ */ new Map();
  for (const key in metadataAST) {
    const elements = metadataAST[key];
    const keyName = key.split(":").pop();
    switch (keyName) {
      case "title":
      case "language":
      case "description":
      case "publisher":
      case "type":
      case "format":
      case "source":
      case "relation":
      case "coverage":
      case "rights": {
        metadata[keyName] = elements[0]._ ?? elements[0];
        break;
      }
      case "date": {
        metadata.date = {};
        for (const dateEl of elements) {
          const eventName = dateEl.$?.["opf:event"] ?? "publication";
          metadata.date[eventName] = dateEl._ ?? dateEl;
        }
        break;
      }
      case "identifier": {
        for (const idEl of elements) {
          const identifier = {
            id: idEl._,
            scheme: idEl.$?.["opf:scheme"] ?? ""
          };
          const idAttr = idEl.$ && idEl.$.id;
          if (idAttr) {
            metadata.packageIdentifier = identifier;
            idToElement.set(idAttr, identifier);
          } else {
            metadata.identifier = identifier;
          }
        }
        break;
      }
      case "subject": {
        metadata.subject = [];
        for (const subjectEl of elements) {
          const $ = subjectEl.$;
          const subject = {
            subject: subjectEl._ ?? subjectEl,
            authority: $?.authority ?? "",
            term: $?.term ?? ""
          };
          metadata.subject.push(subject);
          if (subjectEl.$?.id) {
            idToElement.set(subjectEl.$.id, subject);
          }
        }
        break;
      }
      case "creator":
      case "contributor": {
        metadata[keyName] = [];
        for (const contributorEl of elements) {
          const $ = contributorEl.$;
          const contributor = {
            contributor: contributorEl._ ?? contributorEl,
            fileAs: $?.["opf:file-as"] ?? "",
            role: $?.["opf:role"] ?? ""
          };
          metadata[keyName].push(contributor);
          if ($?.id) {
            idToElement.set($.id, contributor);
          }
        }
        break;
      }
    }
  }
  const metas = metadataAST.meta ?? [];
  for (const meta of metas) {
    const $ = meta.$;
    if (meta._) {
      if ($.refines) {
        const refinesId = $.refines.slice(1);
        const element = idToElement.get(refinesId);
        if (!element) {
          console.warn(`No element with id "${refinesId}" found when parsing <metadata>`);
          continue;
        }
        const property = shared.camelCase($.property);
        if ("contributor" in element) {
          element[property] || (element[property] = meta._);
        } else if ("subject" in element) {
          element[property] || (element[property] = meta._);
        } else if ("id" in element) {
          element[property] || (element[property] = meta._);
          element.scheme = element.scheme || $.scheme;
        }
      } else {
        const property = $.property;
        metadata.metas[property] = meta._;
      }
    } else {
      const name = $.name;
      metadata.metas[name] = $.content;
    }
  }
  const linksTag = metadataAST.link ?? [];
  const links = [];
  for (const link of linksTag) {
    const $ = link.$;
    if (!$.refines) {
      const element = {
        href: "",
        rel: ""
      };
      for (const key in $) {
        element[shared.camelCase(key)] = $[key];
      }
      links.push(element);
    } else {
      const refinesId = $.refines.slice(1);
      const element = idToElement.get(refinesId);
      if (!element) {
        console.warn(`No element with id "${refinesId}" found when parsing <metadata>`);
        continue;
      }
      const rel = shared.camelCase($.rel);
      const href = $.href;
      element[rel] = href;
    }
  }
  metadata.links = links;
  return metadata;
}
function parseManifest(manifestAST, contentBaseDir) {
  const items = manifestAST.item;
  if (!items) {
    throw new Error("The manifest element must contain one or more item elements");
  }
  const manifest = {};
  const needToFallback = [];
  for (const item of items) {
    const $ = item.$;
    const {
      id,
      href,
      "media-type": mediaType,
      "media-overlay": mediaOverlay,
      properties
    } = $;
    if (!$ || !id || !href || !mediaType) {
      console.warn("The item in manifest must have attributes id, href and mediaType. So skip this item.");
      continue;
    }
    manifest[id] = {
      id,
      href: shared.path.joinPosix(contentBaseDir, href),
      mediaType,
      properties: properties || "",
      mediaOverlay: mediaOverlay || ""
    };
    if ($.fallback) {
      manifest[id].fallback = [$.fallback];
      needToFallback.push(manifest[id]);
    }
  }
  for (const item of needToFallback) {
    const set = /* @__PURE__ */ new Set();
    set.add(item.id);
    let nextItem = manifest[item.fallback[0]];
    while (nextItem && nextItem.fallback) {
      set.add(nextItem.id);
      const fallback = nextItem.fallback;
      if (fallback.length > 1) {
        item.fallback.push(...fallback);
        break;
      }
      const fallbackId = fallback[0];
      if (set.has(fallbackId)) {
        console.warn(`Cycle references have appeard when next item id is "${fallbackId}". Therefore stop parsing.`);
        break;
      }
      item.fallback.push(fallbackId);
      nextItem = manifest[fallbackId];
    }
  }
  return manifest;
}
function parseSpine(spineAST, manifest) {
  let tocPath = "";
  if (spineAST.$?.toc) {
    tocPath = manifest[spineAST.$.toc]?.href ?? "";
  }
  const spine = [];
  const itemrefs = spineAST.itemref;
  if (!itemrefs) {
    throw new Error("The spine element must contain one or more itemref elements");
  }
  for (const itemref of itemrefs) {
    const $ = itemref.$;
    if ($.idref) {
      const element = manifest[$.idref];
      spine.push({
        ...element,
        href: `epub:${element.href}`,
        // default to 'yes'
        linear: $.linear || "yes"
      });
    }
  }
  return {
    tocPath,
    spine
  };
}
function parseGuide(guideAST, baseDir) {
  const guide = [];
  const references = guideAST.reference;
  if (!references) {
    throw new Error("Within the package there may be one guide element, containing one or more reference elements.");
  }
  for (const reference of references) {
    const element = reference.$;
    if (element.href && element.href.length > 0) {
      element.href = HREF_PREFIX + shared.path.joinPosix(baseDir, element.href);
    }
    guide.push(element);
  }
  return guide;
}
function parseCollection(collectionAST, contentBaseDir) {
  const collections = [];
  for (const collection of collectionAST) {
    const role = collection.$.role;
    const links = [];
    for (const link of collection.link) {
      links.push(shared.path.joinPosix(contentBaseDir, link.$.href));
    }
    collections.push({
      role,
      links
    });
  }
  return collections;
}
function parseNavMap(navMap, hrefToIdMap, ncxBaseDir) {
  const output = [];
  walkNavMap(output, navMap.navPoint, hrefToIdMap, ncxBaseDir);
  return output;
}
function walkNavMap(output, navPoints, hrefToIdMap, ncxBaseDir) {
  for (const navPoint of navPoints) {
    let element = {
      label: "",
      href: "",
      id: "",
      playOrder: ""
    };
    if (navPoint.navLabel) {
      const href = shared.path.joinPosix(ncxBaseDir, decodeURIComponent(navPoint.content[0].$?.src));
      const hrefPath = href.split("#")[0];
      element = {
        label: navPoint.navLabel[0].text?.[0] ?? "",
        href: HREF_PREFIX + href,
        id: hrefToIdMap[hrefPath],
        playOrder: navPoint.$?.playOrder ?? ""
      };
      output.push(element);
    }
    if (navPoint.navPoint) {
      element.children = [];
      walkNavMap(
        element.children,
        navPoint.navPoint,
        hrefToIdMap,
        ncxBaseDir
      );
    }
  }
}
function parsePageList(pageList, hrefToIdMap, ncxBaseDir) {
  let label = "";
  if (pageList.navLabel) {
    label = pageList.navLabel[0].text[0];
  }
  const output = [];
  for (const pageTarget of pageList.pageTarget) {
    const src = shared.path.joinPosix(ncxBaseDir, decodeURIComponent(pageTarget.content[0].$?.src));
    const href = src.split("#")[0];
    const $ = pageTarget.$;
    const element = {
      label: pageTarget.navLabel[0].text[0] || "",
      value: $.value || "",
      href: HREF_PREFIX + src,
      playOrder: $.playOrder || "",
      type: $.type || "",
      correspondId: hrefToIdMap[href]
    };
    output.push(element);
  }
  return {
    label,
    pageTargets: output
  };
}
function parseNavList(navList, hrefToIdMap, ncxBaseDir) {
  let label = "";
  if (navList.navLabel) {
    label = navList.navLabel[0].text[0];
  }
  const navTargets = [];
  for (const navTarget of navList.navTarget) {
    const src = shared.path.joinPosix(ncxBaseDir, decodeURIComponent(navTarget.content[0].$?.src));
    const href = src.split("#")[0];
    const element = {
      label: navTarget.navLabel[0]?.text?.[0] || "",
      href: HREF_PREFIX + src,
      correspondId: hrefToIdMap[href]
    };
    navTargets.push(element);
  }
  return {
    label,
    navTargets
  };
}
async function parseEncryptedKeys(encryptedKeysAST, rsaPrivateKey) {
  if (!encryptedKeysAST) {
    return {};
  }
  const idToKeyMap = {};
  for (const encryptedKey of encryptedKeysAST) {
    const id = encryptedKey.$.Id;
    const encryptionMethod = encryptedKey.EncryptionMethod[0];
    const algorithm = encryptionMethod.$.Algorithm.split("#")[1];
    if (!algorithm.startsWith("rsa")) {
      throw new Error(`Unsupported encryption algorithm: ${algorithm}. Only RSA and AES algorithms are supported.`);
    }
    let sha = "sha1";
    if (algorithm === "rsa-oaep") {
      sha = encryptionMethod.DigestMethod[0].$.Algorithm.split("#")[1];
    }
    const encryptedKeyDataBase64 = encryptedKey.CipherData[0].CipherValue[0].trim();
    const decryptedKey = await decryptRsa(rsaPrivateKey, encryptedKeyDataBase64, sha);
    idToKeyMap[id] = decryptedKey;
  }
  return idToKeyMap;
}
function parseEncryptedDatas(encryptedDatasAST, idToKeyMap, aesSymmetricKey) {
  const fileToProcessors = {};
  for (const encryptedData of encryptedDatasAST) {
    const algorithmInXml = encryptedData.EncryptionMethod[0].$.Algorithm.split("#")[1];
    if (!algorithmInXml.startsWith("aes")) {
      console.warn(`Unsupported encryption algorithm: ${algorithmInXml}. Only AES and RSA algorithms are supported.`);
      continue;
    }
    const algorithm = algorithmInXml.replace("aes", "aes-");
    const filePath = encryptedData.CipherData[0].CipherReference[0].$.URI;
    fileToProcessors[filePath] = [];
    const processors = fileToProcessors[filePath];
    const keyInfo = encryptedData.KeyInfo?.[0];
    if (keyInfo && keyInfo.RetrievalMethod) {
      const keyId = keyInfo.RetrievalMethod[0].$.URI.slice(1);
      const symmetricKey = idToKeyMap[keyId];
      if (!symmetricKey) {
        throw new Error(`No symmetric key found for id "${keyId}". Skipping decryption for file "${filePath}".`);
      }
      const decryptAesProcessor = async (file) => {
        return await decryptAes(algorithm, symmetricKey, file);
      };
      processors.push(decryptAesProcessor);
    } else {
      const decryptAesProcessor = async (file) => {
        return await decryptAes(algorithm, aesSymmetricKey, file);
      };
      processors.push(decryptAesProcessor);
    }
    const encryptionPropertys = encryptedData.EncryptionProperties?.[0].EncryptionProperty;
    if (encryptionPropertys) {
      for (const encryptionProperty of encryptionPropertys) {
        const compression = encryptionProperty.Compression[0];
        if (compression && compression.$.Method === "8") {
          processors.push(fflate.inflateSync);
        }
      }
    }
    fileToProcessors[filePath] = processors;
  }
  return fileToProcessors;
}
async function parseEncryption(encryptionAST, options) {
  const encryption = encryptionAST.encryption;
  const encryptedKeys = encryption.EncryptedKey;
  const encryptedDatas = encryption.EncryptedData;
  if (encryptedKeys && !options.rsaPrivateKey) {
    throw new Error("Please provide the RSA private key to decrypt the encrypted AES keys. ");
  }
  if (!encryptedKeys && encryptedDatas && !options.aesSymmetricKey) {
    throw new Error("The file is only enctypted with AES, but no symmetric key is provided. ");
  }
  const idToKeyMap = await parseEncryptedKeys(encryptedKeys, options.rsaPrivateKey);
  const pathToProcessors = parseEncryptedDatas(encryptedDatas, idToKeyMap, options.aesSymmetricKey);
  return pathToProcessors;
}

function getResourceUrl(src, htmlDir, resourceSaveDir) {
  const resourceName = shared.path.joinPosix(htmlDir, src).replace(/\//g, "_");
  let resourceSrc = shared.path.resolve(resourceSaveDir, resourceName);
  return resourceSrc;
}
function replaceBodyResources(str, htmlDir, resourceSaveDir) {
  str = str.replace(/<(img|video|audio|source)[^>]*>/g, (imgTag) => {
    const src = imgTag.match(/src="([^"]*)"/)?.[1];
    if (src) {
      const imageSrc = getResourceUrl(src, htmlDir, resourceSaveDir);
      imgTag = imgTag.replace(src, imageSrc);
    }
    const poster = imgTag.match(/poster="([^"]*)"/)?.[1];
    if (poster) {
      const posterSrc = getResourceUrl(poster, htmlDir, resourceSaveDir);
      imgTag = imgTag.replace(poster, posterSrc);
    }
    return imgTag;
  });
  str = str.replace(/<image[^>]*>/g, (imgTag) => {
    const hrefMatch = imgTag.match(/href="([^"]*)"/)?.[1];
    if (hrefMatch) {
      const imageSrc = getResourceUrl(hrefMatch, htmlDir, resourceSaveDir);
      imgTag = imgTag.replace(hrefMatch, imageSrc);
    }
    return imgTag;
  });
  str = str.replace(/<svg[^>]*>[\s\S]*?<\/svg>/g, (svgBlock) => {
    if (svgBlock.includes("<image")) {
      const svgOpenTag = svgBlock.match(/<svg[^>]*>/)?.[0];
      if (svgOpenTag && !svgOpenTag.includes("viewBox")) {
        const widthMatch = svgOpenTag.match(/width="([^"]*)"/);
        const heightMatch = svgOpenTag.match(/height="([^"]*)"/);
        if (widthMatch && heightMatch) {
          const width = widthMatch[1];
          const height = heightMatch[1];
          const viewBox = ` viewBox="0 0 ${width} ${height}"`;
          const newSvgTag = svgOpenTag.endsWith("/>") ? svgOpenTag.replace("/>", `${viewBox}/>`) : svgOpenTag.replace(">", `${viewBox}>`);
          svgBlock = svgBlock.replace(svgOpenTag, newSvgTag);
        }
      }
    }
    return svgBlock;
  });
  str = str.replace(/<a[^>]*>/g, (aTag) => {
    const href = aTag.match(/href="([^"]*)"/)?.[1];
    if (href && !/^https?|mailto/.test(href)) {
      const transformedHref = shared.path.joinPosix(htmlDir, href);
      aTag = aTag.replace(href, HREF_PREFIX + decodeURIComponent(transformedHref));
    }
    return aTag;
  });
  return str;
}
function transformHTML(html, htmlDir, resourceSaveDir) {
  const head = html.match(/<head[^>]*>([\s\S]*)<\/head>/i);
  const css = [];
  if (head) {
    const links = head[1].match(/<link[^>]*>/g);
    if (links) {
      for (const link of links) {
        const linkHref = link.match(/href="([^"]*)"/)[1];
        if (linkHref.endsWith(".css")) {
          const cssFilePath = shared.path.joinPosix(htmlDir, linkHref);
          const cssName = cssFilePath.replace(/\//g, "_");
          let realPath = shared.path.resolve(resourceSaveDir, cssName);
          let fileContent = new TextDecoder().decode(readFileSync(realPath));
          fileContent = fileContent.replace(/url\(([^)]*)\)/g, (_, url) => {
            url = url.replace(/['"]/g, "");
            const realUrl = getResourceUrl(url.trim(), shared.path.dirname(cssFilePath), resourceSaveDir);
            return `url(${realUrl})`;
          });
          writeFileSync(realPath, new TextEncoder().encode(fileContent));
          css.push({
            id: cssName,
            href: realPath
          });
        }
      }
    }
  }
  const body = html.match(/<body[^>]*>(.*?)<\/body>/is);
  const bodyReplaced = body ? replaceBodyResources(body[1], htmlDir, resourceSaveDir) : "";
  return {
    css,
    html: bodyReplaced
  };
}
function traversePar(pars, smilDir, resourceSaveDir, parsedAudios) {
  for (const par of pars) {
    if (par["#name"] === "par") {
      const textDOMId = par.text[0].$.src.split("#")[1];
      const audioAttrs = par.audio[0].$;
      const audioSrc = getResourceUrl(audioAttrs.src, smilDir, resourceSaveDir);
      const clipBegin = cachedSmilTimeToSeconds(audioAttrs.clipBegin);
      const clipEnd = cachedSmilTimeToSeconds(audioAttrs.clipEnd);
      if (!parsedAudios[audioSrc]) {
        parsedAudios[audioSrc] = {
          audioSrc,
          pars: []
        };
      }
      parsedAudios[audioSrc].pars.push({ textDOMId, clipBegin, clipEnd });
    } else {
      traversePar(par.children, smilDir, resourceSaveDir, parsedAudios);
    }
  }
}
function parseSmil(smilAST, smilDir, resourceSaveDir) {
  const parsedAudios = {};
  const body = smilAST.smil.body[0].children;
  traversePar(body, smilDir, resourceSaveDir, parsedAudios);
  return Object.values(parsedAudios);
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
async function initEpubFile(epubPath, resourceSaveDir = "./images", options = {}) {
  const epub = new EpubFile(epubPath, resourceSaveDir, options);
  await epub.loadEpub();
  await epub.parse();
  return epub;
}
class EpubFile {
  constructor(epub, resourceSaveDir = "./images", options = {}) {
    this.epub = epub;
    this.options = options;
    __publicField(this, "fileName", "");
    __publicField(this, "mimeType", "");
    /**
     * <metadata> in .opf file
     */
    __publicField(this, "metadata");
    /**
     * <manifest> in .opf file
     */
    __publicField(this, "manifest", {});
    /**
     * <spine> in .opf file
     */
    __publicField(this, "spine", []);
    /**
     * <guide> in .opf file
     */
    __publicField(this, "guide", []);
    /**
     * <collection> in .opf file
     */
    __publicField(this, "collections", []);
    /**
     * <navMap> in .ncx file
     *  which is default value if there is no <navMap> in epub file
     */
    __publicField(this, "navMap", []);
    /**
     * <pageList> in .ncx file
     *  which is default value if there is no <pageList> in epub file
     */
    __publicField(this, "pageList");
    /**
     * <navList> in .ncx file,
     *  which is default value if there is no <navList> in epub file
     */
    __publicField(this, "navList");
    /**
     * zip processing class
     */
    __publicField(this, "zip");
    __publicField(this, "opfPath", "");
    __publicField(this, "opfDir", "");
    __publicField(this, "resourceSaveDir");
    __publicField(this, "encryptionKeys", {});
    __publicField(this, "savedResourcePath", []);
    __publicField(this, "hrefToIdMap", {});
    __publicField(this, "chapterCache", /* @__PURE__ */ new Map());
    if (typeof epub === "string") {
      this.fileName = shared.path.basename(epub);
    } else if (epub instanceof Uint8Array) {
      this.fileName = "";
    } else {
      this.fileName = epub.name;
    }
    this.resourceSaveDir = resourceSaveDir;
    if (!existsSync(this.resourceSaveDir)) {
      mkdirSync(this.resourceSaveDir, { recursive: true });
    }
    this.encryptionKeys = extractEncryptionKeys(this.options);
  }
  getFileInfo() {
    return {
      fileName: this.fileName,
      mimetype: this.mimeType
    };
  }
  getMetadata() {
    return this.metadata;
  }
  getManifest() {
    return this.manifest;
  }
  getSpine() {
    return this.spine;
  }
  getGuide() {
    return this.guide;
  }
  getCollection() {
    return this.collections;
  }
  getToc() {
    return this.navMap;
  }
  getPageList() {
    return this.pageList;
  }
  getNavList() {
    return this.navList;
  }
  async loadEpub() {
    this.zip = await createZipFile(this.epub);
  }
  async parse() {
    const mimetype = await this.zip.readFile("mimetype");
    this.mimeType = parseMimeType(mimetype);
    const containerXml = await this.zip.readFile("meta-inf/container.xml");
    const containerAST = await shared.parsexml(containerXml);
    this.opfPath = parseContainer(containerAST);
    this.opfDir = shared.path.dirname(this.opfPath);
    if (this.zip.hasFile("meta-inf/encryption.xml")) {
      const encryptionXml = await this.zip.readFile("meta-inf/encryption.xml");
      const encryptionAST = await shared.parsexml(encryptionXml, {
        tagNameProcessors: [(str) => str.replace(prefixMatch, "")]
      });
      const pathToProcessors = await parseEncryption(encryptionAST, this.encryptionKeys);
      this.zip.useDeprocessors(pathToProcessors);
    }
    await this.parseRootFile();
  }
  /**
   * parse .opf file
   */
  async parseRootFile() {
    const rootFileOPF = await this.zip.readFile(this.opfPath);
    const xml = await shared.parsexml(rootFileOPF);
    const rootFile = xml.package;
    let tocPath = "";
    for (const key in rootFile) {
      switch (key) {
        case "metadata": {
          this.metadata = parseMetadata(rootFile[key][0]);
          break;
        }
        case "manifest": {
          this.manifest = parseManifest(rootFile[key][0], this.opfDir);
          for (const key2 in this.manifest) {
            const manifestItem = this.manifest[key2];
            this.hrefToIdMap[manifestItem.href] = manifestItem.id;
            if (savedResourceMediaTypePrefixes.has(manifestItem.mediaType) || manifestItem.mediaType.startsWith("text/css")) {
              const fileName = manifestItem.href.replace(/\//g, "_");
              const filePath = shared.path.resolve(this.resourceSaveDir, fileName);
              this.savedResourcePath.push(filePath);
              writeFileSync(
                filePath,
                await this.zip.readResource(manifestItem.href)
              );
            }
          }
          break;
        }
        case "spine": {
          const res = parseSpine(rootFile[key][0], this.manifest);
          tocPath = res.tocPath;
          this.spine = res.spine;
          break;
        }
        case "guide": {
          this.guide = parseGuide(rootFile[key][0], this.opfDir);
          break;
        }
        case "collection": {
          this.collections = parseCollection(rootFile[key], this.opfDir);
          break;
        }
      }
    }
    if (tocPath.length > 0) {
      const tocDir = shared.path.dirname(tocPath);
      const tocNcxFile = await this.zip.readFile(tocPath);
      const ncx = (await shared.parsexml(tocNcxFile)).ncx;
      if (ncx.navMap)
        this.navMap = parseNavMap(ncx.navMap[0], this.hrefToIdMap, tocDir);
      if (ncx.pageList)
        this.pageList = parsePageList(ncx.pageList[0], this.hrefToIdMap, tocDir);
      if (ncx.navList)
        this.navList = parseNavList(ncx.navList[0], this.hrefToIdMap, tocDir);
    }
  }
  /**
   * replace <img> src absolute path or blob url
   * @param id the manifest item id of the chapter
   * @returns replaced html string
   */
  async loadChapter(id) {
    if (this.chapterCache.has(id)) {
      return this.chapterCache.get(id);
    }
    const htmlManifest = this.manifest[id];
    const xmlHref = htmlManifest.href;
    const htmlDir = shared.path.dirname(xmlHref);
    const transformed = transformHTML(
      await this.zip.readFile(xmlHref),
      htmlDir,
      this.resourceSaveDir
    );
    const mediaOverlayId = htmlManifest.mediaOverlay;
    if (mediaOverlayId) {
      const smilManifest = this.manifest[mediaOverlayId];
      const smilHref = smilManifest.href;
      const audios = parseSmil(
        await shared.parsexml(
          await this.zip.readFile(smilHref),
          {
            preserveChildrenOrder: true,
            explicitChildren: true,
            childkey: "children"
          }
        ),
        shared.path.dirname(smilHref),
        this.resourceSaveDir
      );
      transformed.mediaOverlays = audios;
    }
    this.chapterCache.set(id, transformed);
    return transformed;
  }
  resolveHref(href) {
    if (!href.startsWith(HREF_PREFIX)) {
      return void 0;
    }
    href = href.slice(5).trim();
    const [urlPath, hrefId] = href.split("#");
    let id = "";
    if (this.hrefToIdMap[urlPath]) {
      id = this.hrefToIdMap[urlPath];
    } else {
      return void 0;
    }
    let selector = "";
    if (hrefId) {
      selector = `[id="${hrefId}"]`;
    }
    return {
      id,
      selector
    };
  }
  getCoverImage() {
    let imageId = "";
    const coverGuideRef = this.guide.find((ref) => ref.type === "cover");
    if (coverGuideRef) {
      imageId = this.resolveHref(coverGuideRef.href).id;
    } else if (this.metadata?.metas?.cover) {
      imageId = this.metadata.metas.cover;
    } else {
      return "";
    }
    const imageManifest = this.manifest[imageId];
    const imageSrc = getResourceUrl(imageManifest.href, "", this.resourceSaveDir);
    return imageSrc;
  }
  destroy() {
    this.savedResourcePath.forEach((filePath) => {
      if (existsSync(filePath)) {
        unlink(filePath);
      }
    });
    this.savedResourcePath.length = 0;
  }
}

exports.EPUB_HREF_PREFIX = HREF_PREFIX;
exports.initEpubFile = initEpubFile;
