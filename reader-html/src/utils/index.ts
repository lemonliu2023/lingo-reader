import type { ShallowRef } from 'vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useDebounce(fn: Function, delay: number) {
  let timer: any = null
  return (...args: any[]) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export function useThrottle(fn: Function, delay: number) {
  let timer: any = null
  return (...args: any[]) => {
    if (!timer) {
      fn(...args)
      timer = setTimeout(() => {
        timer = null
      }, delay)
    }
  }
}

export function withPx(value: number) {
  return `${value}px`
}

export function useDomSize(domRef: Readonly<ShallowRef<HTMLElement | null>>) {
  const width = ref<number>(0)
  const height = ref<number>(0)

  const getRect = () => {
    width.value = domRef.value!.clientWidth
    height.value = domRef.value!.clientHeight
  }

  onMounted(() => {
    getRect()
    window.addEventListener('resize', getRect)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', getRect)
  })

  return { width, height }
}

export function toFixedOne(val: number): number {
  return Number.parseFloat(val.toFixed(1))
}
