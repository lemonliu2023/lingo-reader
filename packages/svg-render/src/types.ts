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

export interface Measurement {
  /**
   * The width and height of the measured text
   */
  width: number
  height: number
}

export interface MeasureOptions {
  /**
   * The font size of the text
   */
  fontSize?: number
  /**
   * The font family of the text
   */
  fontFamily?: string
  /**
   * The remote font css url
   */
  remoteFontCSSURL?: string
}

