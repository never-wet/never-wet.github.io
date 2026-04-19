import { useEffect, useState, type RefObject } from 'react'

export const useElementSize = <T extends HTMLElement>(ref: RefObject<T | null>) => {
  const [size, setSize] = useState({ width: 960, height: 640 })

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return
      }

      const { width, height } = entry.contentRect
      const nextSize = {
        width: Math.max(Math.floor(width), 320),
        height: Math.max(Math.floor(height), 240),
      }

      setSize((current) =>
        current.width === nextSize.width && current.height === nextSize.height
          ? current
          : nextSize,
      )
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}
