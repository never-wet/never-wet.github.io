import { createElement, useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

const REVEAL_DURATION_MS = 420

type ScrollRevealProps = {
  as?: ElementType
  children: ReactNode
  className?: string
  delay?: number
  once?: boolean
  rootMargin?: string
  threshold?: number
} & Record<string, unknown>

export function ScrollReveal({
  as = 'div',
  children,
  className = '',
  delay = 0,
  once = true,
  rootMargin = '0px 0px -12% 0px',
  threshold = 0.16,
  ...restProps
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLElement | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const lockUntilRef = useRef(0)
  const intersectingRef = useRef(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true)
      return
    }

    const element = elementRef.current

    if (!element) {
      return
    }

    const clearHideTimer = () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }

    const observer = new window.IntersectionObserver(
      (entries) => {
        const [entry] = entries

        if (!entry) {
          return
        }

        intersectingRef.current = entry.isIntersecting

        if (entry.isIntersecting) {
          clearHideTimer()
          setIsVisible(true)
          lockUntilRef.current = window.performance.now() + delay + REVEAL_DURATION_MS

          if (once) {
            observer.unobserve(entry.target)
          }

          return
        }

        if (!once) {
          clearHideTimer()

          const remaining = Math.max(0, lockUntilRef.current - window.performance.now())

          hideTimerRef.current = window.setTimeout(() => {
            if (!intersectingRef.current) {
              setIsVisible(false)
            }
          }, remaining)
        }
      },
      {
        rootMargin,
        threshold,
      },
    )

    observer.observe(element)

    return () => {
      clearHideTimer()
      observer.disconnect()
    }
  }, [delay, once, rootMargin, threshold])

  const resolvedClassName = `scroll-reveal ${isVisible ? 'scroll-reveal--visible' : ''} ${className}`.trim()

  return createElement(
    as,
    {
      ...restProps,
      className: resolvedClassName,
      ref: (node: HTMLElement | null) => {
        elementRef.current = node
      },
      style: {
        '--reveal-delay': `${delay}ms`,
        '--reveal-duration': `${REVEAL_DURATION_MS}ms`,
      } as CSSProperties,
    },
    children,
  )
}
