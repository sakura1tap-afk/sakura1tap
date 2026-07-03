import type { RefObject } from 'react'
import { gsap, useGSAP } from '../motion/gsap'
import { motionEases, motionQueries } from '../motion/motionTokens'

type EntryMotionControllerProps = {
  isEntering: boolean
  modelReady: boolean
  rootRef: RefObject<HTMLDivElement | null>
}

export default function EntryMotionController({ isEntering, modelReady, rootRef }: EntryMotionControllerProps) {
  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      const mm = gsap.matchMedia()

      mm.add(
        {
          reduceMotion: motionQueries.reducedMotion,
        },
        (context) => {
          const reduceMotion = Boolean(context.conditions?.reduceMotion)

          if (reduceMotion) {
            gsap.set(root, {
              '--entry-motion-scan': 0,
              '--entry-motion-ready': modelReady ? 1 : 0,
            })
            return
          }

          const miniGame = root.querySelector('.entry-mini-game')
          const gate = root.querySelector('.city-gate-entry')

          const intro = gsap.timeline({
            defaults: {
              ease: motionEases.emphasis,
              overwrite: 'auto',
            },
          })

          intro
            .set(root, {
              '--entry-motion-scan': 0,
              '--entry-motion-ready': modelReady ? 1 : 0,
            })
            .from(
              miniGame,
              {
                autoAlpha: 0,
                duration: 0.72,
                scale: 0.96,
                y: 20,
              },
            )
            .from(
              gate,
              {
                autoAlpha: 0,
                duration: 0.52,
                scale: 0.94,
                stagger: 0.09,
                y: 18,
              },
              '<0.08',
            )

          const idle = gsap.timeline({
            repeat: -1,
            defaults: {
              ease: 'sine.inOut',
              overwrite: 'auto',
            },
          })

          idle
            .to(root, {
              '--entry-motion-scan': 1,
              duration: 1.8,
            })
            .to(root, {
              '--entry-motion-scan': 0,
              duration: 1.35,
            })
            .to(
              miniGame,
              {
                rotation: 1.8,
                scale: 1.012,
                transformOrigin: '50% 50%',
                yoyo: true,
                repeat: 1,
                duration: 1.6,
              },
              0,
            )

          return () => {
            intro.kill()
            idle.kill()
          }
        },
        root,
      )

      return () => mm.revert()
    },
    { dependencies: [modelReady, rootRef], scope: rootRef },
  )

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      gsap.to(root, {
        '--entry-motion-ready': modelReady ? 1 : 0,
        '--entry-motion-warp': isEntering ? 1 : 0,
        duration: isEntering ? 0.62 : 0.32,
        ease: isEntering ? motionEases.section : motionEases.ripple,
        overwrite: 'auto',
      })
    },
    { dependencies: [isEntering, modelReady], scope: rootRef },
  )

  return null
}
