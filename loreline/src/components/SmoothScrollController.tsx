import { useEffect } from 'react'

const SCROLL_STIFFNESS = 0.14
const SCROLL_DAMPING = 0.82
const MAX_WHEEL_DELTA = 760

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeWheelDelta(event: WheelEvent) {
  let delta = event.deltaY

  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    delta *= 18
  } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    delta *= window.innerHeight * 0.9
  }

  return clamp(delta, -MAX_WHEEL_DELTA, MAX_WHEEL_DELTA)
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(target.closest('textarea, input, select, option, [contenteditable="true"]'))
}

function findScrollableAncestor(target: EventTarget | null, deltaY: number) {
  if (!(target instanceof HTMLElement)) {
    return null
  }

  let node: HTMLElement | null = target

  while (node && node !== document.body && node !== document.documentElement) {
    const styles = window.getComputedStyle(node)
    const overflowY = styles.overflowY
    const isScrollableY =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      node.scrollHeight > node.clientHeight + 1

    if (isScrollableY) {
      const canScrollUp = node.scrollTop > 1
      const canScrollDown = node.scrollTop + node.clientHeight < node.scrollHeight - 1

      if ((deltaY < 0 && canScrollUp) || (deltaY > 0 && canScrollDown)) {
        return node
      }
    }

    node = node.parentElement
  }

  return null
}

export function SmoothScrollController() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    if (window.matchMedia('(pointer: coarse)').matches) {
      return
    }

    const scrollingElement = document.scrollingElement ?? document.documentElement
    let targetScrollTop = scrollingElement.scrollTop
    let velocity = 0
    let animationFrame = 0
    let isControllerAnimating = false

    function getMaxScrollTop() {
      return Math.max(0, scrollingElement.scrollHeight - window.innerHeight)
    }

    function stopAnimation() {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
        animationFrame = 0
      }

      isControllerAnimating = false
      velocity = 0
    }

    function animateScroll() {
      animationFrame = 0

      const currentScrollTop = scrollingElement.scrollTop
      const maxScrollTop = getMaxScrollTop()
      targetScrollTop = clamp(targetScrollTop, 0, maxScrollTop)

      const distance = targetScrollTop - currentScrollTop
      velocity = (velocity + distance * SCROLL_STIFFNESS) * SCROLL_DAMPING

      if (Math.abs(distance) < 0.35 && Math.abs(velocity) < 0.35) {
        scrollingElement.scrollTop = targetScrollTop
        stopAnimation()
        return
      }

      isControllerAnimating = true
      scrollingElement.scrollTop = clamp(currentScrollTop + velocity, 0, maxScrollTop)
      animationFrame = window.requestAnimationFrame(animateScroll)
    }

    function requestAnimation() {
      if (animationFrame) {
        return
      }

      animationFrame = window.requestAnimationFrame(animateScroll)
    }

    function handleWheel(event: WheelEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey) {
        return
      }

      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return
      }

      if (isEditableTarget(event.target)) {
        return
      }

      const deltaY = normalizeWheelDelta(event)

      if (deltaY === 0 || findScrollableAncestor(event.target, deltaY)) {
        return
      }

      event.preventDefault()

      const maxScrollTop = getMaxScrollTop()

      if (!isControllerAnimating) {
        targetScrollTop = scrollingElement.scrollTop
      }

      targetScrollTop = clamp(targetScrollTop + deltaY, 0, maxScrollTop)
      requestAnimation()
    }

    function handleScroll() {
      if (!isControllerAnimating) {
        targetScrollTop = scrollingElement.scrollTop
      }
    }

    function handleResize() {
      const maxScrollTop = getMaxScrollTop()
      targetScrollTop = clamp(scrollingElement.scrollTop, 0, maxScrollTop)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      stopAnimation()
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return null
}
