import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'

type EntryMiniGameProps = {
  disabled: boolean
  isEntering: boolean
}

type Player = {
  vx: number
  vy: number
  x: number
  y: number
}

type Platform = {
  h: number
  id: string
  type: 'grass' | 'plank'
  w: number
  x: number
  y: number
}

type Coin = {
  collected: boolean
  id: string
  x: number
  y: number
}

type InputState = {
  jump: boolean
  jumpQueued: boolean
  left: boolean
  right: boolean
}

const GAME_ASSET_ROOT = '/art/game/kenney-new-platformer/Vector'
const PLAYER_IDLE = `${GAME_ASSET_ROOT}/Characters/character_green_idle.svg`
const PLAYER_WALK_A = `${GAME_ASSET_ROOT}/Characters/character_green_walk_a.svg`
const PLAYER_JUMP = `${GAME_ASSET_ROOT}/Characters/character_green_jump.svg`
const TILE_GRASS = `${GAME_ASSET_ROOT}/Tiles/grass.svg`
const TILE_PLANK = `${GAME_ASSET_ROOT}/Tiles/block_plank.svg`
const COIN_GOLD = `${GAME_ASSET_ROOT}/Tiles/coin_gold.svg`
const GEM_YELLOW = `${GAME_ASSET_ROOT}/Tiles/gem_yellow.svg`

const GRAVITY = 0.00118
const MOVE_ACCEL = 0.00042
const FRICTION = 0.88
const MAX_SPEED = 0.19
const JUMP_SPEED = 0.42
const WORLD_W = 178
const WORLD_H = 56
const VIEW_W = 100

const platforms: Platform[] = [
  { id: 'ground-a', x: 2, y: 47, w: 36, h: 3.8, type: 'grass' },
  { id: 'ground-b', x: 36, y: 47, w: 34, h: 3.8, type: 'grass' },
  { id: 'ground-c', x: 73, y: 47, w: 34, h: 3.8, type: 'grass' },
  { id: 'ground-d', x: 112, y: 47, w: 32, h: 3.8, type: 'grass' },
  { id: 'ground-e', x: 146, y: 47, w: 30, h: 3.8, type: 'grass' },
  { id: 'step-a', x: 22, y: 38, w: 14, h: 3, type: 'plank' },
  { id: 'step-b', x: 50, y: 34, w: 16, h: 3, type: 'plank' },
  { id: 'step-c', x: 82, y: 37, w: 15, h: 3, type: 'plank' },
  { id: 'step-d', x: 116, y: 32, w: 17, h: 3, type: 'plank' },
  { id: 'step-e', x: 148, y: 38, w: 14, h: 3, type: 'plank' },
]

const initialCoins: Coin[] = [
  { id: 'coin-a', x: 28, y: 32, collected: false },
  { id: 'coin-b', x: 58, y: 28, collected: false },
  { id: 'coin-c', x: 89, y: 31, collected: false },
  { id: 'coin-d', x: 124, y: 26, collected: false },
  { id: 'coin-e', x: 154, y: 32, collected: false },
]

export default function EntryMiniGame({ disabled, isEntering }: EntryMiniGameProps) {
  const [player, setPlayer] = useState<Player>({ x: 12, y: 38, vx: 0, vy: 0 })
  const [coins, setCoins] = useState(initialCoins)
  const [grounded, setGrounded] = useState(false)
  const keysRef = useRef<InputState>({ left: false, right: false, jump: false, jumpQueued: false })
  const playerRef = useRef(player)
  const coinsRef = useRef(coins)
  const groundedRef = useRef(false)

  useEffect(() => {
    playerRef.current = player
  }, [player])

  useEffect(() => {
    coinsRef.current = coins
  }, [coins])

  useEffect(() => {
    groundedRef.current = grounded
  }, [grounded])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled || isEntering) return

      const key = event.key.toLowerCase()
      if (event.key === 'ArrowLeft' || key === 'a') keysRef.current.left = true
      if (event.key === 'ArrowRight' || key === 'd') keysRef.current.right = true
      if (event.key === ' ' || event.key === 'ArrowUp' || key === 'w') {
        if (!keysRef.current.jump) {
          keysRef.current.jumpQueued = true
        }
        keysRef.current.jump = true
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (event.key === 'ArrowLeft' || key === 'a') keysRef.current.left = false
      if (event.key === 'ArrowRight' || key === 'd') keysRef.current.right = false
      if (event.key === ' ' || event.key === 'ArrowUp' || key === 'w') keysRef.current.jump = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [disabled, isEntering])

  useEffect(() => {
    if (disabled || isEntering) return

    let frame = 0
    let last = window.performance.now()

    const tick = (now: number) => {
      const delta = Math.min(32, now - last)
      last = now

      const keys = keysRef.current
      let next = { ...playerRef.current }

      if (keys.left) next.vx -= MOVE_ACCEL * delta
      if (keys.right) next.vx += MOVE_ACCEL * delta
      if (!keys.left && !keys.right) next.vx *= FRICTION

      next.vx = MathUtilsClamp(next.vx, -MAX_SPEED, MAX_SPEED)

      if (keys.jumpQueued && groundedRef.current) {
        next.vy = -JUMP_SPEED
        groundedRef.current = false
        keys.jumpQueued = false
      }

      next.vy += GRAVITY * delta
      next.x = MathUtilsClamp(next.x + next.vx * delta, 2, WORLD_W - 4)
      next.y += next.vy * delta

      let isGrounded = false
      for (const platform of platforms) {
        const playerBottom = next.y + 6
        const wasAbove = playerRef.current.y + 6 <= platform.y + 1.4
        const insideX = next.x + 3 > platform.x && next.x < platform.x + platform.w
        const crossing = playerBottom >= platform.y && playerBottom <= platform.y + platform.h + 3

        if (insideX && crossing && wasAbove && next.vy >= 0) {
          next.y = platform.y - 6
          next.vy = 0
          isGrounded = true
        }
      }

      if (next.y > WORLD_H) {
        next = { x: 12, y: 38, vx: 0, vy: 0 }
        isGrounded = false
      }

      const nextCoins = coinsRef.current.map((coin) => {
        if (coin.collected) return coin

        const dx = next.x + 2.5 - coin.x
        const dy = next.y + 3 - coin.y
        return Math.hypot(dx, dy) < 5 ? { ...coin, collected: true } : coin
      })

      playerRef.current = next
      coinsRef.current = nextCoins
      groundedRef.current = isGrounded
      setPlayer(next)
      setCoins(nextCoins)
      setGrounded(isGrounded)
      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [disabled, isEntering])

  const cameraX = MathUtilsClamp(player.x - 42, 0, WORLD_W - VIEW_W)
  const styleVars = useMemo(
    () =>
      ({
        '--bg-shift': `${50 - cameraX * 0.16}%`,
        '--player-x': `${player.x - cameraX}%`,
        '--player-y': `${player.y}%`,
      }) as CSSProperties,
    [cameraX, player.x, player.y],
  )
  const score = coins.filter((coin) => coin.collected).length
  const playerImage = grounded ? (Math.abs(player.vx) > 0.06 ? PLAYER_WALK_A : PLAYER_IDLE) : PLAYER_JUMP

  return (
    <section className="entry-mini-game" style={styleVars} aria-label="Entry platform mini game">
      <div className="entry-game-hud" aria-hidden="true">
        <span>KENNEY BUFFER</span>
        <b>{score}/{coins.length}</b>
      </div>

      <div className="entry-game-world" aria-hidden="true">
        {platforms.map((platform) => (
          <img
            alt=""
            className={`entry-platform entry-platform-${platform.type}`}
            key={platform.id}
            src={platform.type === 'grass' ? TILE_GRASS : TILE_PLANK}
            style={{
              height: `${platform.h}%`,
              left: `${platform.x - cameraX}%`,
              top: `${platform.y}%`,
              width: `${platform.w}%`,
            }}
          />
        ))}

        {coins.map((coin, index) => (
          <img
            alt=""
            className={`entry-game-coin ${coin.collected ? 'is-collected' : ''}`}
            key={coin.id}
            src={index === coins.length - 1 ? GEM_YELLOW : COIN_GOLD}
            style={{ left: `${coin.x - cameraX}%`, top: `${coin.y}%` }}
          />
        ))}

        <img alt="" className="entry-game-player" src={playerImage} />
      </div>
    </section>
  )
}

function MathUtilsClamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
