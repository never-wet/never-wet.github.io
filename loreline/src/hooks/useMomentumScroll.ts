import { useEffect } from 'react'

const MAX_WHEEL_DELTA = 96
const MAX_VELOCITY = 120
const MOMENTUM_SCALE = 0.28
const MOMENTUM_FRICTION = 0.94
const MIN_VELOCITY = 0.08

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeWheelDelta(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 16
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * window.innerHeight
  }

  return event.deltaY
}

function maxScrollY() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
}

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function canScrollElement(element: HTMLElement, deltaY: number) {
  const style = window.getComputedStyle(element)
  const canOverflow = /(auto|scroll|overlay)/.test(style.overflowY)

  if (!canOverflow || element.scrollHeight <= element.clientHeight + 1) {
    return false
  }

  if (deltaY > 0) {
    return element.scrollTop + element.clientHeight < element.scrollHeight - 1
  }

  return element.scrollTop > 1
}

function shouldLetNestedScrollerHandle(target: EventTarget | null, deltaY: number) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  let element: HTMLElement | null = target

  while (element && element !== document.body && element !== document.documentElement) {
    if (canScrollElement(element, deltaY)) {
      return true
    }

    element = element.parentElement
  }

  return false
}

export function useMomentumScroll(enabled = true) {
  useEffect(() => {
    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    let velocity = 0
    let frame = 0

    const stopMomentum = () => {
      velocity = 0
      if (frame) {
        window.cancelAnimationFrame(frame)
        frame = 0
      }
    }

    const tick = () => {
      if (Math.abs(velocity) <= MIN_VELOCITY) {
        stopMomentum()
        return
      }

      const before = window.scrollY
      window.scrollBy({ top: velocity, behavior: 'auto' })
      const atTop = window.scrollY <= 0 && velocity < 0
      const atBottom = window.scrollY >= maxScrollY() - 1 && velocity > 0

      if (window.scrollY === before && (atTop || atBottom)) {
        stopMomentum()
        return
      }

      velocity *= MOMENTUM_FRICTION
      frame = window.requestAnimationFrame(tick)
    }

    const startMomentum = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(tick)
      }
    }

    const handleWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey) {
        return
      }

      const rawDelta = normalizeWheelDelta(event)

      if (isEditableElement(event.target) || shouldLetNestedScrollerHandle(event.target, rawDelta)) {
        stopMomentum()
        return
      }

      event.preventDefault()

      const immediateDelta = clamp(rawDelta, -MAX_WHEEL_DELTA, MAX_WHEEL_DELTA)
      window.scrollBy({ top: immediateDelta, behavior: 'auto' })
      velocity = clamp(velocity + immediateDelta * MOMENTUM_SCALE, -MAX_VELOCITY, MAX_VELOCITY)
      startMomentum()
    }

    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      stopMomentum()
    }
  }, [enabled])
}
