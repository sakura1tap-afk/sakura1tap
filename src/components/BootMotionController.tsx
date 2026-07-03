import type { RefObject } from 'react'
import { gsap, useGSAP } from '../motion/gsap'
import { motionEases, motionQueries } from '../motion/motionTokens'

type BootMotionControllerProps = {
  isRevealing: boolean
  progress: number
  rootRef: RefObject<HTMLDivElement | null>
}

export default function BootMotionController({ isRevealing, progress, rootRef }: BootMotionControllerProps) {
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
              '--boot-motion-scan': 0,
              '--boot-motion-swell': isRevealing ? 1 : 0,
            })
            return
          }

          const field = root.querySelector('.boot-realm-gate')
          const orbits = root.querySelectorAll('.boot-realm-orbit')
          const nodes = root.querySelectorAll('.boot-realm-sparks span')
          const console = root.querySelector('.boot-console')

          const intro = gsap.timeline({
            defaults: {
              ease: motionEases.emphasis,
              overwrite: 'auto',
            },
          })

          intro
            .set(root, {
              '--boot-motion-scan': 0,
              '--boot-motion-swell': 0,
            })
            .from(field, {
              autoAlpha: 0,
              duration: 0.72,
              scale: 0.82,
              y: 18,
            })
            .from(
              orbits,
              {
                autoAlpha: 0,
                duration: 0.82,
                rotation: (_, target) => (target.classList.contains('boot-realm-orbit-inner') ? -42 : 42),
                scale: 0.72,
                stagger: 0.12,
              },
              '<0.06',
            )
            .from(
              nodes,
              {
                autoAlpha: 0,
                duration: 0.58,
                scale: 0,
                stagger: { amount: 0.42, from: 'center' },
                y: 18,
              },
              '<0.08',
            )
            .from(
              console,
              {
                autoAlpha: 0,
                duration: 0.54,
                y: 16,
              },
              '<0.12',
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
              '--boot-motion-scan': 1,
              duration: 1.4,
            })
            .to(root, {
              '--boot-motion-scan': 0,
              duration: 1.1,
            })
            .to(
              nodes,
              {
                autoAlpha: (_, target) => (target instanceof HTMLElement && Number(target.style.getPropertyValue('--node-index')) % 2 ? 0.42 : 0.9),
                duration: 0.72,
                stagger: { amount: 0.34, from: 'random' },
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
    { dependencies: [isRevealing, rootRef], scope: rootRef },
  )

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      gsap.to(root, {
        '--boot-motion-swell': isRevealing ? 1 : progress / 100,
        duration: isRevealing ? 0.62 : 0.28,
        ease: isRevealing ? motionEases.section : motionEases.ripple,
        overwrite: 'auto',
      })
    },
    { dependencies: [isRevealing, progress], scope: rootRef },
  )

  return null
}
