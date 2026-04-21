import { createElement, useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

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

    const observer = new window.IntersectionObserver(
      (entries) => {
        const [entry] = entries

        if (!entry) {
          return
        }

        if (entry.isIntersecting) {
          setIsVisible(true)

          if (once) {
            observer.unobserve(entry.target)
          }

          return
        }

        if (!once) {
          setIsVisible(false)
        }
      },
      {
        rootMargin,
        threshold,
      },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [once, rootMargin, threshold])

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
      } as CSSProperties,
    },
    children,
  )
}
