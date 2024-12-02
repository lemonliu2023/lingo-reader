import { onUnmounted, ref } from 'vue'

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

export function useDomSize(dom: HTMLElement) {
  if (!dom) {
    throw new Error('Please pass dom when component mounted.')
  }
  const width = ref<number>(0)
  const height = ref<number>(0)
  const domObserver = new ResizeObserver(useThrottle((entries: ResizeObserverEntry[]) => {
    const targetEntry = entries.find(entry => entry.target === dom)
    width.value = targetEntry!.contentRect.width
    height.value = targetEntry!.contentRect.height
  }, 50))

  domObserver.observe(dom)
  onUnmounted(() => [
    domObserver.unobserve(dom),
  ])
  return { width, height }
}
