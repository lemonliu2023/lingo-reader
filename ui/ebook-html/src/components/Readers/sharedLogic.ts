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

interface SelectionConfig<T extends Mode> {
  type: 'selection'
  name: string
  selectOptions: T[]
  selected: T
  value: Ref
}

export type Config = AdjusterConfig | SelectionConfig<Mode>

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
  selected: Mode,
  value: Ref,
): SelectionConfig<Mode> {
  return {
    type: 'selection',
    name,
    selectOptions,
    selected,
    value,
  }
}
