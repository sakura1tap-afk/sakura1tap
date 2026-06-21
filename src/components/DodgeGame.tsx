import { Play, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

type GamePhase = 'idle' | 'running' | 'over'

type Hazard = {
  height: number
  speedX: number
  speedY: number
  width: number
  x: number
  y: number
}

export default function DodgeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hazardsRef = useRef<Hazard[]>([])
  const playerRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
  const scoreRef = useRef(0)
  const spawnRef = useRef(0)
  const phaseRef = useRef<GamePhase>('idle')
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const resetGame = useCallback(() => {
    hazardsRef.current = []
    scoreRef.current = 0
    spawnRef.current = 0
    setScore(0)
    setPhase('running')
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    let width = 0
    let height = 0
    let animationFrame = 0
    let lastTime = performance.now()

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (!playerRef.current.x || !playerRef.current.y) {
        playerRef.current = {
          x: width * 0.5,
          y: height * 0.68,
          targetX: width * 0.5,
          targetY: height * 0.68,
        }
      }
    }

    const addHazard = () => {
      const vertical = Math.random() > 0.46
      const level = Math.min(1.8, 1 + scoreRef.current / 95)

      if (vertical) {
        const hazardWidth = 10 + Math.random() * 24
        const fromLeft = Math.random() > 0.5
        hazardsRef.current.push({
          height: height * (0.28 + Math.random() * 0.6),
          speedX: (fromLeft ? 1 : -1) * (95 + Math.random() * 65) * level,
          speedY: 0,
          width: hazardWidth,
          x: fromLeft ? -hazardWidth : width + hazardWidth,
          y: Math.random() * height * 0.72,
        })
      } else {
        const hazardHeight = 8 + Math.random() * 18
        hazardsRef.current.push({
          height: hazardHeight,
          speedX: 0,
          speedY: 105 + Math.random() * 90 * level,
          width: width * (0.34 + Math.random() * 0.42),
          x: Math.random() * width * 0.52,
          y: -hazardHeight,
        })
      }
    }

    const drawGrid = (time: number) => {
      context.fillStyle = '#050505'
      context.fillRect(0, 0, width, height)
      context.strokeStyle = 'rgba(255,255,255,0.07)'
      context.lineWidth = 1

      for (let x = ((time * 0.018) % 32) - 32; x < width + 32; x += 32) {
        context.beginPath()
        context.moveTo(x, 0)
        context.lineTo(x + width * 0.14, height)
        context.stroke()
      }

      for (let y = 0; y < height; y += 34) {
        context.beginPath()
        context.moveTo(0, y)
        context.lineTo(width, y)
        context.stroke()
      }
    }

    const loop = (time: number) => {
      const delta = Math.min(34, time - lastTime)
      lastTime = time
      const seconds = delta / 1000
      const phaseNow = phaseRef.current

      if (phaseNow === 'running') {
        scoreRef.current += seconds * 12
        const nextScore = Math.floor(scoreRef.current)
        setScore((value) => (value === nextScore ? value : nextScore))

        const player = playerRef.current
        player.x += (player.targetX - player.x) * Math.min(1, seconds * 9)
        player.y += (player.targetY - player.y) * Math.min(1, seconds * 9)

        spawnRef.current -= delta
        if (spawnRef.current <= 0) {
          addHazard()
          spawnRef.current = Math.max(280, 780 - scoreRef.current * 5)
        }

        hazardsRef.current = hazardsRef.current
          .map((hazard) => ({
            ...hazard,
            x: hazard.x + hazard.speedX * seconds,
            y: hazard.y + hazard.speedY * seconds,
          }))
          .filter(
            (hazard) =>
              hazard.x > -width * 0.4 &&
              hazard.x < width * 1.4 &&
              hazard.y > -height * 0.25 &&
              hazard.y < height * 1.25,
          )

        const radius = 9
        const hit = hazardsRef.current.some((hazard) => {
          const closestX = Math.max(hazard.x, Math.min(player.x, hazard.x + hazard.width))
          const closestY = Math.max(hazard.y, Math.min(player.y, hazard.y + hazard.height))
          const dx = player.x - closestX
          const dy = player.y - closestY
          return dx * dx + dy * dy < radius * radius
        })

        if (hit) {
          setBest((value) => Math.max(value, Math.floor(scoreRef.current)))
          setPhase('over')
        }
      }

      drawGrid(time)

      context.save()
      context.globalCompositeOperation = 'screen'
      hazardsRef.current.forEach((hazard, index) => {
        const alpha = 0.56 + Math.sin(time * 0.006 + index) * 0.16
        context.fillStyle = `rgba(255,255,255,${alpha})`
        context.shadowBlur = 18
        context.shadowColor = 'rgba(255,255,255,0.4)'
        context.fillRect(hazard.x, hazard.y, hazard.width, hazard.height)
      })
      context.restore()

      const player = playerRef.current
      context.save()
      context.translate(player.x, player.y)
      context.fillStyle = phaseNow === 'over' ? 'rgba(255,255,255,0.3)' : '#ffffff'
      context.shadowBlur = 22
      context.shadowColor = 'rgba(200,255,223,0.72)'
      context.beginPath()
      context.arc(0, 0, 8.5, 0, Math.PI * 2)
      context.fill()
      context.strokeStyle = 'rgba(255,255,255,0.38)'
      context.beginPath()
      context.arc(0, 0, 17, 0, Math.PI * 2)
      context.stroke()
      context.restore()

      context.fillStyle = 'rgba(255,255,255,0.58)'
      context.font = '10px Inter, sans-serif'
      context.letterSpacing = '2px'
      context.fillText(`SCORE ${Math.floor(scoreRef.current).toString().padStart(3, '0')}`, 18, 24)
      context.fillText(`BEST ${best.toString().padStart(3, '0')}`, 18, 42)

      animationFrame = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    animationFrame = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrame)
    }
  }, [best])

  const moveTarget = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    playerRef.current.targetX = Math.max(14, Math.min(rect.width - 14, clientX - rect.left))
    playerRef.current.targetY = Math.max(14, Math.min(rect.height - 14, clientY - rect.top))
  }

  return (
    <div className={`dodge-game is-${phase}`}>
      <canvas
        aria-label="黑白躲避小游戏"
        className="dodge-canvas"
        onPointerDown={(event) => {
          moveTarget(event.clientX, event.clientY)
          if (phase !== 'running') {
            resetGame()
          }
        }}
        onPointerMove={(event) => moveTarget(event.clientX, event.clientY)}
        ref={canvasRef}
      />
      <div className="dodge-hud">
        <span>BLACKOUT RUN</span>
        <strong>{score.toString().padStart(3, '0')}</strong>
      </div>
      {phase !== 'running' && (
        <button className="dodge-start" onClick={resetGame} type="button">
          {phase === 'over' ? <RotateCcw size={17} strokeWidth={1.8} /> : <Play size={17} strokeWidth={1.8} />}
          <span>{phase === 'over' ? 'RESTART' : 'START'}</span>
        </button>
      )}
    </div>
  )
}
