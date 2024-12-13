import type { Ref } from 'vue'
import type { Mode } from '../DropDown'

interface AdjusterConfig {
  type: 'adjuster'
  name: string
  max: number
  min: number
  delta: number
  value: Ref
}

interface SelectionConfig {
  type: 'selection'
  name: string
  selectOptions: Mode[]
  value: Ref
}

export type Config = AdjusterConfig | SelectionConfig

export function generateAdjusterConfig(
  name: string,
  max: number,
  min: number,
  delta: number,
  value: Ref,
): AdjusterConfig {
  if (max < min) {
    throw new Error(`max(${max}) must be greater than min(${min}).`)
  }
  return {
    type: 'adjuster',
    name,
    max,
    min,
    delta,
    value,
  }
}

export function generateSelectionConfig(
  name: string,
  selectOptions: Mode[],
  value: Ref,
): SelectionConfig {
  return {
    type: 'selection',
    name,
    selectOptions,
    value,
  }
}
