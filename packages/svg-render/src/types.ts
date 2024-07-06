export interface SvgRenderOptions {
  width?: number
  height?: number
  fontFamily?: string
  fontSize?: number

  // svg style
  opacity?: number
  lineHeightRatio?: number
  backgroundColor?: string
  borderRadius?: number
  selectionbgColor?: string
  selectionColor?: string
  cursor?: string
  padding?: string
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  
  // used for playwright font loading
  remoteFontCSSURL?: string
}

