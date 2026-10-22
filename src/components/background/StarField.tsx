import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'

type Star = {
  x: number
  y: number
  radius: number
  alpha: number
  phase: number
  speed: number
  layer: 0 | 1 | 2
}

type Meteor = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

const TWO_PI = Math.PI * 2

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    let width = window.innerWidth
    let height = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let stars: Star[] = []
    let meteors: Meteor[] = []
    let raf = 0
    let isVisible = !document.hidden
    let isStatic = Boolean(reduceMotion)
    let lastMeteorAt = performance.now()
    let nextMeteorDelay = 8000 + Math.random() * 7000
    let lastFrameAt = 0
    const frameDurations: number[] = []
    const pointer = { x: 0, y: 0 }
    let scrollY = window.scrollY

    const buildStars = () => {
      const isMobile = width < 640
      const factor = isMobile ? 0.6 : 1
      const counts = [Math.round(200 * factor), Math.round(80 * factor), Math.round(25 * factor)]

      const next: Star[] = []
      counts.forEach((count, layerIndex) => {
        const layer = layerIndex as 0 | 1 | 2

        for (let index = 0; index < count; index += 1) {
          const radius =
            layer === 0 ? 0.5 + Math.random() * 0.5 : layer === 1 ? 0.8 + Math.random() * 0.7 : 1.3 + Math.random()

          next.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius,
            alpha:
              layer === 0
                ? 0.22 + Math.random() * 0.3
                : layer === 1
                  ? 0.4 + Math.random() * 0.35
                  : 0.6 + Math.random() * 0.35,
            phase: Math.random() * TWO_PI,
            speed: 0.0004 + Math.random() * 0.0009,
            layer,
          })
        }
      })

      stars = next
    }

    const drawStars = (time: number) => {
      context.clearRect(0, 0, width, height)

      for (const star of stars) {
        const depth = star.layer === 0 ? 0.25 : star.layer === 1 ? 0.6 : 1
        const offsetX = pointer.x * 12 * depth
        // 用取模限制滚动视差，避免长页面滚动后星星整体移出视口
        const offsetY =
          pointer.y * 8 * depth + (height > 0 ? (scrollY * 0.02 * depth) % height : 0)
        const twinkle = isStatic ? 1 : 0.6 + 0.4 * Math.sin(time * star.speed + star.phase)

        context.globalAlpha = Math.max(0, Math.min(1, star.alpha * twinkle))
        context.fillStyle = star.layer === 2 ? '#F2F4FF' : '#CBD5F5'

        if (star.layer === 2) {
          context.shadowBlur = 10
          context.shadowColor = 'rgba(124, 156, 255, 0.65)'
        }

        context.beginPath()
        context.arc(star.x + offsetX, star.y + offsetY, star.radius, 0, TWO_PI)
        context.fill()

        if (star.layer === 2) context.shadowBlur = 0
      }

      context.globalAlpha = 1
    }

    const drawMeteors = (delta: number) => {
      // vx/vy 以「每 16ms」为基准，按实际帧间隔缩放，避免高刷或掉帧时速度异常
      const step = delta / 16

      for (const meteor of meteors) {
        meteor.x += meteor.vx * step
        meteor.y += meteor.vy * step
        meteor.life += delta

        const progress = meteor.life / meteor.maxLife
        const alpha = Math.max(0, 1 - progress)

        const gradient = context.createLinearGradient(
          meteor.x,
          meteor.y,
          meteor.x - meteor.vx * 0.08,
          meteor.y - meteor.vy * 0.08,
        )
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
        gradient.addColorStop(1, 'rgba(124, 156, 255, 0)')

        context.strokeStyle = gradient
        context.lineWidth = 1.4
        context.beginPath()
        context.moveTo(meteor.x, meteor.y)
        context.lineTo(meteor.x - meteor.vx * 0.08, meteor.y - meteor.vy * 0.08)
        context.stroke()
      }

      meteors = meteors.filter((meteor) => meteor.life < meteor.maxLife)
    }

    const drawFrame = (time: number) => {
      const delta = lastFrameAt === 0 ? 16 : Math.min(time - lastFrameAt, 48)
      lastFrameAt = time

      drawStars(time)

      if (!isStatic) {
        if (time - lastMeteorAt > nextMeteorDelay) {
          lastMeteorAt = time
          nextMeteorDelay = 8000 + Math.random() * 7000
          meteors.push({
            x: Math.random() * width * 0.7 + width * 0.2,
            y: Math.random() * height * 0.4,
            vx: 5 + Math.random() * 3,
            vy: 3 + Math.random() * 2,
            life: 0,
            maxLife: 900,
          })
        }

        drawMeteors(delta)

        if (time > 0) {
          frameDurations.push(delta)
          if (frameDurations.length > 120) {
            const average =
              frameDurations.reduce((sum, value) => sum + value, 0) / frameDurations.length
            frameDurations.length = 0
            if (average > 26) {
              isStatic = true
              meteors = []
              drawStars(time)
            }
          }
        }
      }
    }

    const loop = (time: number) => {
      if (isStatic || !isVisible) return
      drawFrame(time)
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      cancelAnimationFrame(raf)
      lastFrameAt = 0
      if (isStatic) {
        drawStars(0)
        return
      }
      raf = requestAnimationFrame(loop)
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      buildStars()
      if (isStatic) drawStars(0)
    }

    const handlePointer = (event: MouseEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1
    }

    const handleScroll = () => {
      scrollY = window.scrollY
    }

    const handleVisibility = () => {
      isVisible = !document.hidden
      if (isVisible) start()
      else cancelAnimationFrame(raf)
    }

    let resizeTimer = 0
    const handleResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(resize, 150)
    }

    resize()
    start()
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handlePointer, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handlePointer)
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [reduceMotion])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  )
}
