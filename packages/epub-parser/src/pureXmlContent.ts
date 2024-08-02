export function pureXmlContent(xmlContent: string) {
  // remove <span> b strong i em u s small mark
  // /<\/?b[^o][^>]*>/gi will remove <b> and its content, keep body, and <i>, <u> is
  xmlContent = xmlContent
    .replace(/<\/?(span|strong|s|small|mark|header|footer|section|figure|aside|code|blockquote)[^>]*>/gi, '')
    .replace(/<\/?(([biua]|em)|([biua]|em)\s[^>]*)>/g, '')

  // remove <tag></tag> with no content
  xmlContent = xmlContent.replace(/<([a-z][a-z0-9]*)\b[^>]*><\/\1>/gi, '')
  // remove <hr /> <br /> <a />
  xmlContent = xmlContent.replace(/<(hr|br|a)[^>]*>/gi, '')
  // remove useless attrs, class, id, style, epub:type
  xmlContent = xmlContent.replace(/\s*(class|id|style|epub:type)=["'][^"']*["']/g, '')

  // mutiple (\n| ) to one (\n| )
  xmlContent = xmlContent.replace(/(^|[^\n])\n(?!\n)/g, '$1 ')
  xmlContent = xmlContent.replace(/[ \f\t\v]+/g, ' ')

  return xmlContent
}
