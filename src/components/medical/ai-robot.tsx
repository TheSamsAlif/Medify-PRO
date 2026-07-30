"use client"

import { useEffect, useRef } from "react"

export function AiRobot({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }[]>([])
  const frameRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number

    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        const rect = parent.getBoundingClientRect()
        canvas.width = rect.width || 400
        canvas.height = rect.height || 300
      }
    }

    resize()
    window.addEventListener("resize", resize)

    const draw = () => {
      frameRef.current++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const cx = canvas.width / 2
      const cy = canvas.height / 2
      const scale = Math.min(canvas.width, canvas.height) / 320
      const t = frameRef.current * 0.02

      /* ── Floating vertical offset ── */
      const floatY = Math.sin(t * 1.2) * 6 * scale
      /* ── Breathing scale ── */
      const breath = 1 + Math.sin(t * 0.6) * 0.012

      const bx = cx
      const by = cy + floatY + 10 * scale

      /* ── Floor glow / reflection ── */
      const floorGrad = ctx.createRadialGradient(bx, by + 60 * scale, 0, bx, by + 60 * scale, 80 * scale)
      floorGrad.addColorStop(0, "rgba(249,104,1,0.08)")
      floorGrad.addColorStop(0.3, "rgba(37,194,195,0.04)")
      floorGrad.addColorStop(1, "rgba(249,104,1,0)")
      ctx.fillStyle = floorGrad
      ctx.beginPath()
      ctx.ellipse(bx, by + 60 * scale, 80 * scale, 16 * scale, 0, 0, Math.PI * 2)
      ctx.fill()

      /* ── Reflection (mirrored robot silhouette) ── */
      ctx.save()
      ctx.globalAlpha = 0.12
      ctx.translate(0, (by + 38 * scale) * 2)
      ctx.scale(1, -1)
      drawRobot(ctx, bx, by - 40 * scale, scale, t, breath)
      ctx.restore()

      /* ── Main robot ── */
      drawRobot(ctx, bx, by, scale, t, breath)

      /* ── Particles ── */
      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife)
      if (frameRef.current % 2 === 0) {
        const angle = Math.random() * Math.PI * 2
        const dist = 10 + Math.random() * 100
        particlesRef.current.push({
          x: bx + Math.cos(angle) * dist * scale,
          y: by + Math.sin(angle) * dist * scale,
          vx: (Math.random() - 0.5) * 0.6 * scale,
          vy: (Math.random() - 0.5) * 0.6 * scale - 0.2 * scale,
          life: 0,
          maxLife: 40 + Math.random() * 80,
          size: 0.8 + Math.random() * 2.5,
        })
      }

      particlesRef.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.life++
        const alpha = 1 - p.life / p.maxLife
        const alphaSq = alpha * alpha
        ctx.shadowColor = "rgba(249,104,1,0.5)"
        ctx.shadowBlur = 12 * scale * alpha
        ctx.fillStyle = `rgba(249,104,1,${alphaSq * 0.5})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * scale * alpha, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowColor = "rgba(37,194,195,0.3)"
        ctx.shadowBlur = 8 * scale * alpha
        ctx.fillStyle = `rgba(37,194,195,${alphaSq * 0.3})`
        ctx.beginPath()
        ctx.arc(p.x - 2 * scale, p.y - 1 * scale, p.size * scale * alpha * 0.6, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.shadowBlur = 0

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: "260px" }}
    />
  )
}

function drawRobot(ctx: CanvasRenderingContext2D, bx: number, by: number, scale: number, t: number, breath: number) {
  ctx.save()
  ctx.translate(bx, by)
  ctx.scale(breath, breath)
  ctx.translate(-bx, -by)

  /* ── Massive outer glow rings (pulsing) ── */
  const glowPulse = Math.sin(t * 0.8) * 0.15 + 0.85
  for (let i = 0; i < 3; i++) {
    const ringOffset = Math.sin(t * 0.5 + i * 1.2) * 0.08 + 1
    const ringRadius = (80 + i * 35) * scale * ringOffset
    const ringAlpha = (0.06 - i * 0.015) * glowPulse
    ctx.strokeStyle = `rgba(249,104,1,${ringAlpha})`
    ctx.lineWidth = (2.5 - i * 0.5) * scale
    ctx.shadowColor = "rgba(249,104,1,0.3)"
    ctx.shadowBlur = (20 - i * 5) * scale * glowPulse
    ctx.beginPath()
    ctx.arc(bx, by - 5 * scale, ringRadius, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.shadowBlur = 0

  /* ── Core glow gradient ── */
  for (let g = 0; g < 3; g++) {
    const gScale = 1 + g * 0.3
    const gAlpha = 0.04 - g * 0.01
    const gRad = ctx.createRadialGradient(bx, by - 10 * scale, 0, bx, by - 10 * scale, 120 * scale * gScale)
    gRad.addColorStop(0, `rgba(249,104,1,${gAlpha * glowPulse})`)
    gRad.addColorStop(0.4, `rgba(37,194,195,${gAlpha * 0.7 * glowPulse})`)
    gRad.addColorStop(0.7, `rgba(249,104,1,${gAlpha * 0.3 * glowPulse})`)
    gRad.addColorStop(1, "rgba(249,104,1,0)")
    ctx.fillStyle = gRad
    ctx.beginPath()
    ctx.arc(bx, by - 10 * scale, 120 * scale * gScale, 0, Math.PI * 2)
    ctx.fill()
  }

  /* ── Floating energy beams ── */
  for (let e = 0; e < 6; e++) {
    const angle = (t * 0.3 + e * (Math.PI / 3)) % (Math.PI * 2)
    const dist = 55 * scale + Math.sin(t * 0.7 + e) * 20 * scale
    const ex = bx + Math.cos(angle) * dist
    const ey = by - 5 * scale + Math.sin(angle) * dist * 0.3
    const eSize = 1.5 + Math.sin(t * 1.3 + e * 0.7) * 0.8
    ctx.fillStyle = `rgba(249,104,1,${0.04 + Math.sin(t * 0.9 + e) * 0.02})`
    ctx.shadowColor = "rgba(249,104,1,0.4)"
    ctx.shadowBlur = 15 * scale * eSize
    ctx.beginPath()
    ctx.arc(ex, ey, eSize * scale, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  /* ── Orbit ring ── */
  ctx.shadowColor = "rgba(249,104,1,0.15)"
  ctx.shadowBlur = 10 * scale
  ctx.strokeStyle = `rgba(249,104,1,${0.08 * glowPulse})`
  ctx.lineWidth = 1.5 * scale
  ctx.setLineDash([3 * scale, 6 * scale])
  ctx.beginPath()
  ctx.ellipse(bx, by - 5 * scale, 75 * scale, 28 * scale, t * 0.2, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.shadowColor = "rgba(37,194,195,0.12)"
  ctx.shadowBlur = 8 * scale
  ctx.strokeStyle = `rgba(37,194,195,${0.05 * glowPulse})`
  ctx.lineWidth = 1.2 * scale
  ctx.beginPath()
  ctx.ellipse(bx, by - 5 * scale, 60 * scale, 20 * scale, -t * 0.15, 0, Math.PI * 2)
  ctx.stroke()
  ctx.shadowBlur = 0

  /* ── Body shadow ── */
  ctx.shadowColor = "rgba(249,104,1,0.3)"
  ctx.shadowBlur = 40 * scale

  /* ── Head ── */
  ctx.shadowBlur = 30 * scale
  ctx.shadowColor = "rgba(37,194,195,0.2)"
  ctx.fillStyle = "rgba(255,255,255,0.05)"
  ctx.beginPath()
  roundRect(ctx, bx - 30 * scale, by - 50 * scale, 60 * scale, 50 * scale, [12 * scale])
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.shadowColor = "rgba(37,194,195,0.15)"
  ctx.shadowBlur = 8 * scale
  ctx.strokeStyle = "rgba(37,194,195,0.12)"
  ctx.lineWidth = 1 * scale
  ctx.stroke()
  ctx.shadowBlur = 0

  /* ── Head top accent ── */
  ctx.shadowColor = "rgba(249,104,1,0.3)"
  ctx.shadowBlur = 12 * scale
  ctx.fillStyle = "rgba(249,104,1,0.15)"
  ctx.beginPath()
  roundRect(ctx, bx - 16 * scale, by - 48 * scale, 32 * scale, 4 * scale, [2 * scale])
  ctx.fill()
  ctx.shadowBlur = 0

  /* ── Face display ── */
  ctx.shadowColor = "rgba(37,194,195,0.1)"
  ctx.shadowBlur = 10 * scale
  ctx.fillStyle = "rgba(255,255,255,0.04)"
  ctx.beginPath()
  roundRect(ctx, bx - 20 * scale, by - 36 * scale, 40 * scale, 24 * scale, [6 * scale])
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = "rgba(37,194,195,0.08)"
  ctx.lineWidth = 0.5
  ctx.stroke()

  /* ── Eyes ── */
  const eyeY = by - 24 * scale
  const eyeOpen = Math.max(0.2, Math.sin(t * 2.5) * 0.25 + 0.75)
  const lookX = Math.sin(t * 0.8) * 2 * scale

  // Left eye glow
  ctx.shadowColor = "rgba(37,194,195,0.8)"
  ctx.shadowBlur = 24 * scale
  ctx.fillStyle = "rgba(37,194,195,0.95)"
  ctx.beginPath()
  ctx.ellipse(bx - 9 * scale + lookX, eyeY, 4.5 * scale, 5.5 * scale * eyeOpen, 0, 0, Math.PI * 2)
  ctx.fill()

  // Left eye inner
  ctx.shadowBlur = 0
  ctx.fillStyle = "#25C2C3"
  ctx.beginPath()
  ctx.ellipse(bx - 9 * scale + lookX, eyeY, 2 * scale, 2.5 * scale * eyeOpen, 0, 0, Math.PI * 2)
  ctx.fill()

  // Right eye glow
  ctx.shadowColor = "rgba(37,194,195,0.8)"
  ctx.shadowBlur = 24 * scale
  ctx.fillStyle = "rgba(37,194,195,0.95)"
  ctx.beginPath()
  ctx.ellipse(bx + 9 * scale + lookX, eyeY, 4.5 * scale, 5.5 * scale * eyeOpen, 0, 0, Math.PI * 2)
  ctx.fill()

  // Right eye inner
  ctx.shadowBlur = 0
  ctx.fillStyle = "#25C2C3"
  ctx.beginPath()
  ctx.ellipse(bx + 9 * scale + lookX, eyeY, 2 * scale, 2.5 * scale * eyeOpen, 0, 0, Math.PI * 2)
  ctx.fill()

  /* ── Mouth smile ── */
  ctx.shadowColor = "rgba(37,194,195,0.2)"
  ctx.shadowBlur = 6 * scale
  ctx.strokeStyle = "rgba(37,194,195,0.35)"
  ctx.lineWidth = 1.5 * scale
  ctx.beginPath()
  ctx.arc(bx, by - 14 * scale, 6 * scale, 0.2, Math.PI - 0.2)
  ctx.stroke()
  ctx.shadowBlur = 0

  /* ── Ear panels with orange glow ── */
  ctx.shadowColor = "rgba(249,104,1,0.35)"
  ctx.shadowBlur = 14 * scale
  ctx.fillStyle = "rgba(249,104,1,0.12)"
  ctx.strokeStyle = "rgba(249,104,1,0.2)"
  ctx.lineWidth = 0.8 * scale
  // left ear
  ctx.beginPath()
  roundRect(ctx, bx - 35 * scale, by - 38 * scale, 6 * scale, 14 * scale, [2 * scale])
  ctx.fill()
  ctx.stroke()
  // right ear
  ctx.beginPath()
  roundRect(ctx, bx + 29 * scale, by - 38 * scale, 6 * scale, 14 * scale, [2 * scale])
  ctx.fill()
  ctx.stroke()
  ctx.shadowBlur = 0

  /* ── Neck ── */
  ctx.fillStyle = "rgba(255,255,255,0.04)"
  ctx.shadowColor = "rgba(37,194,195,0.1)"
  ctx.shadowBlur = 6 * scale
  ctx.beginPath()
  roundRect(ctx, bx - 8 * scale, by + 1 * scale, 16 * scale, 6 * scale, [2 * scale])
  ctx.fill()
  ctx.shadowBlur = 0

  /* ── Body/chassis ── */
  ctx.shadowColor = "rgba(249,104,1,0.25)"
  ctx.shadowBlur = 25 * scale
  ctx.fillStyle = "rgba(255,255,255,0.05)"
  ctx.beginPath()
  roundRect(ctx, bx - 22 * scale, by + 6 * scale, 44 * scale, 26 * scale, [4 * scale, 4 * scale, 10 * scale, 10 * scale])
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.shadowColor = "rgba(37,194,195,0.1)"
  ctx.shadowBlur = 6 * scale
  ctx.strokeStyle = "rgba(37,194,195,0.1)"
  ctx.lineWidth = 0.8 * scale
  ctx.stroke()
  ctx.shadowBlur = 0

  /* ── Medical cross ── */
  const crossX = bx
  const crossY = by + 19 * scale
  ctx.shadowColor = "rgba(249,104,1,0.5)"
  ctx.shadowBlur = 16 * scale
  ctx.fillStyle = "rgba(249,104,1,0.6)"
  ctx.fillRect(crossX - 2 * scale, crossY - 5 * scale, 4 * scale, 10 * scale)
  ctx.fillRect(crossX - 5 * scale, crossY - 2 * scale, 10 * scale, 4 * scale)
  ctx.shadowBlur = 0

  // cross inner glow
  ctx.shadowColor = "rgba(255,255,255,0.2)"
  ctx.shadowBlur = 6 * scale
  ctx.fillStyle = "rgba(249,104,1,0.3)"
  ctx.fillRect(crossX - 1.2 * scale, crossY - 4 * scale, 2.4 * scale, 8 * scale)
  ctx.fillRect(crossX - 4 * scale, crossY - 1.2 * scale, 8 * scale, 2.4 * scale)
  ctx.shadowBlur = 0

  /* ── Heartbeat line ── */
  ctx.shadowColor = "rgba(37,194,195,0.3)"
  ctx.shadowBlur = 8 * scale
  ctx.strokeStyle = "rgba(37,194,195,0.5)"
  ctx.lineWidth = 1.5 * scale
  const hbY = by + 22 * scale
  const hbT = ((t * 2) % 4) / 4
  ctx.beginPath()
  for (let x = -16 * scale; x <= 16 * scale; x += 0.5) {
    const relX = x / (16 * scale)
    const val = (Math.abs(relX) < 0.25) ? Math.max(0, Math.sin(((relX + hbT + 1) % 2 - 1) * Math.PI * 6)) * 3 * scale : 0
    x === -16 * scale ? ctx.moveTo(bx + x, hbY) : ctx.lineTo(bx + x, hbY - val)
  }
  ctx.stroke()
  ctx.shadowBlur = 0

  /* ── Right arm projecting hologram ── */
  const armSwing = Math.sin(t * 0.9) * 0.25 + 0.55
  const armEndX = bx + 40 * scale
  const armEndY = by - 8 * scale * armSwing

  // Arm
  ctx.shadowColor = "rgba(249,104,1,0.2)"
  ctx.shadowBlur = 12 * scale
  ctx.strokeStyle = "rgba(249,104,1,0.25)"
  ctx.lineWidth = 3 * scale
  ctx.beginPath()
  ctx.moveTo(bx + 22 * scale, by + 14 * scale)
  ctx.quadraticCurveTo(bx + 42 * scale, by + 18 * scale, armEndX, armEndY)
  ctx.stroke()

  // Arm glow trail
  ctx.shadowColor = "rgba(37,194,195,0.1)"
  ctx.shadowBlur = 8 * scale
  ctx.strokeStyle = "rgba(37,194,195,0.12)"
  ctx.lineWidth = 1.5 * scale
  ctx.beginPath()
  ctx.moveTo(bx + 22 * scale, by + 14 * scale)
  ctx.quadraticCurveTo(bx + 40 * scale, by + 16 * scale, armEndX - 2 * scale, armEndY)
  ctx.stroke()
  ctx.shadowBlur = 0

  // Hand
  ctx.shadowColor = "rgba(249,104,1,0.4)"
  ctx.shadowBlur = 20 * scale
  ctx.fillStyle = "rgba(249,104,1,0.3)"
  ctx.beginPath()
  ctx.arc(armEndX, armEndY, 5 * scale, 0, Math.PI * 2)
  ctx.fill()

  // Hand inner
  ctx.shadowColor = "rgba(255,255,255,0.1)"
  ctx.shadowBlur = 4 * scale
  ctx.fillStyle = "rgba(249,104,1,0.15)"
  ctx.beginPath()
  ctx.arc(armEndX, armEndY, 2.5 * scale, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  /* ── Holographic projection ── */
  ctx.shadowBlur = 0
  const holoX = armEndX + 28 * scale
  const holoY = armEndY - 18 * scale
  const holoW = 50 * scale
  const holoH = 54 * scale

  // Hologram outer glow
  const holoOuterGrad = ctx.createRadialGradient(holoX, holoY, 0, holoX, holoY, holoW * 1.2)
  holoOuterGrad.addColorStop(0, "rgba(37,194,195,0.12)")
  holoOuterGrad.addColorStop(0.4, "rgba(37,194,195,0.04)")
  holoOuterGrad.addColorStop(1, "rgba(37,194,195,0)")
  ctx.fillStyle = holoOuterGrad
  ctx.shadowColor = "rgba(37,194,195,0.2)"
  ctx.shadowBlur = 20 * scale
  ctx.beginPath()
  ctx.arc(holoX, holoY, holoW * 1.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Hologram border
  ctx.shadowColor = "rgba(37,194,195,0.15)"
  ctx.shadowBlur = 10 * scale
  ctx.fillStyle = "rgba(37,194,195,0.04)"
  ctx.strokeStyle = "rgba(37,194,195,0.15)"
  ctx.lineWidth = 0.8 * scale
  ctx.setLineDash([2 * scale, 3 * scale])
  ctx.beginPath()
  roundRect(ctx, holoX - holoW / 2, holoY - holoH / 2, holoW, holoH, [5 * scale])
  ctx.fill()
  ctx.stroke()
  ctx.setLineDash([])
  ctx.shadowBlur = 0

  // Hologram scan line
  const scanY = ((t * 2) % 1) * holoH
  ctx.strokeStyle = "rgba(37,194,195,0.08)"
  ctx.lineWidth = 0.5 * scale
  ctx.beginPath()
  ctx.moveTo(holoX - holoW / 2, holoY - holoH / 2 + scanY)
  ctx.lineTo(holoX + holoW / 2, holoY - holoH / 2 + scanY)
  ctx.stroke()

  // Hologram glow
  const holoGrad = ctx.createRadialGradient(holoX, holoY, 0, holoX, holoY, holoW * 0.8)
  holoGrad.addColorStop(0, "rgba(37,194,195,0.08)")
  holoGrad.addColorStop(0.6, "rgba(37,194,195,0.03)")
  holoGrad.addColorStop(1, "rgba(37,194,195,0)")
  ctx.fillStyle = holoGrad
  ctx.beginPath()
  ctx.arc(holoX, holoY, holoW * 0.8, 0, Math.PI * 2)
  ctx.fill()

  // Bar chart
  const bars = [0.35, 0.65, 0.25, 0.85, 0.45, 0.75, 0.55]
  const barW = (holoW - 14 * scale) / bars.length
  bars.forEach((h, i) => {
    const barH = h * holoH * 0.3
    const bx2 = holoX - holoW / 2 + 7 * scale + i * barW
    const pulse = Math.sin(t * 2.5 + i * 1.2) * 0.08 + 0.92
    ctx.shadowColor = "rgba(249,104,1,0.2)"
    ctx.shadowBlur = 6 * scale
    ctx.fillStyle = `rgba(249,104,1,${0.15 + h * 0.15})`
    ctx.beginPath()
    roundRect(ctx, bx2, holoY + holoH * 0.12 - barH * pulse, barW * 0.55, barH * pulse, [1 * scale])
    ctx.fill()
  })
  ctx.shadowBlur = 0

  // Pill icon
  ctx.shadowColor = "rgba(249,104,1,0.3)"
  ctx.shadowBlur = 6 * scale
  ctx.fillStyle = "rgba(249,104,1,0.6)"
  ctx.beginPath()
  roundRect(ctx, holoX + 9 * scale, holoY - 14 * scale, 2.5 * scale, 7 * scale, [1.5 * scale])
  ctx.fill()
  ctx.shadowColor = "rgba(37,194,195,0.3)"
  ctx.fillStyle = "rgba(37,194,195,0.6)"
  ctx.beginPath()
  roundRect(ctx, holoX + 12 * scale, holoY - 10 * scale, 2.5 * scale, 7 * scale, [1.5 * scale])
  ctx.fill()
  ctx.shadowBlur = 0

  // Stethoscope icon
  ctx.shadowColor = "rgba(37,194,195,0.25)"
  ctx.shadowBlur = 5 * scale
  ctx.strokeStyle = "rgba(37,194,195,0.55)"
  ctx.lineWidth = 1.5 * scale
  ctx.beginPath()
  ctx.arc(holoX - 12 * scale, holoY - 8 * scale, 4 * scale, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(holoX - 12 * scale, holoY - 4 * scale)
  ctx.lineTo(holoX - 12 * scale, holoY + 2 * scale)
  ctx.stroke()
  ctx.shadowBlur = 0

  /* ── Connection lines from hand to hologram ── */
  ctx.shadowColor = "rgba(37,194,195,0.15)"
  ctx.shadowBlur = 6 * scale
  ctx.strokeStyle = `rgba(37,194,195,${0.08 + Math.sin(t * 1.5) * 0.03})`
  ctx.lineWidth = 0.8 * scale
  ctx.setLineDash([2 * scale, 4 * scale])
  ctx.beginPath()
  ctx.moveTo(armEndX, armEndY)
  ctx.lineTo(holoX - holoW / 2, holoY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(armEndX, armEndY)
  ctx.lineTo(holoX + holoW / 2, holoY)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.shadowBlur = 0

  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  const radii = Array.isArray(r) ? r : [r, r, r, r]
  ctx.moveTo(x + radii[0], y)
  ctx.lineTo(x + w - radii[1], y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radii[1])
  ctx.lineTo(x + w, y + h - radii[2])
  ctx.quadraticCurveTo(x + w, y + h, x + w - radii[2], y + h)
  ctx.lineTo(x + radii[3], y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radii[3])
  ctx.closePath()
}
