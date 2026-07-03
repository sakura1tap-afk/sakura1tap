import type { RefObject } from 'react'
import type { SectionKey } from '../../data/mainSections'
import { gsap, useGSAP } from '../../motion/gsap'
import { mainMotionTiming, motionEases, motionQueries } from '../../motion/motionTokens'

type MainMotionControllerProps = {
  active: SectionKey
  nodeOpen: boolean
  rootRef: RefObject<HTMLDivElement | null>
  wheelDirection: 'next' | 'prev' | null
}

export default function MainMotionController({
  active,
  nodeOpen,
  rootRef,
  wheelDirection,
}: MainMotionControllerProps) {
  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      const direction = wheelDirection === 'prev' ? -1 : 1
      const mm = gsap.matchMedia()

      mm.add(
        {
          isDesktop: motionQueries.desktop,
          isMobile: motionQueries.mobile,
          reduceMotion: motionQueries.reducedMotion,
        },
        (context) => {
          const reduceMotion = Boolean(context.conditions?.reduceMotion)
          const isMobile = Boolean(context.conditions?.isMobile)

          if (reduceMotion) {
            gsap.set(root, {
              '--motion-depth': 1,
              '--motion-drift': 0,
              '--motion-scan': 0,
              '--motion-surface': nodeOpen ? 1 : 0,
            })
            return
          }

          const drift = isMobile ? 6 : 12
          const panelTargets = gsap.utils.toArray<HTMLElement>('.realm-hero-panel, .realm-map-card', root)
          const nodes = gsap.utils.toArray<HTMLElement>('.realm-nav button', root)
          const supportingTargets = gsap.utils.toArray<HTMLElement>('.realm-system-strip', root)
          const hotspots = gsap.utils.toArray<HTMLElement>('.realm-map-orbit', root)
          const timeline = gsap.timeline({
            defaults: {
              ease: motionEases.section,
              overwrite: 'auto',
            },
          })

          timeline
            .set(root, {
              '--motion-direction': direction,
              '--motion-scan': 0,
              '--motion-sequence': 0,
            })
            .addLabel('leave')
            .to(
              [...panelTargets, ...supportingTargets],
              {
                autoAlpha: nodeOpen ? 0.42 : 0.72,
                duration: mainMotionTiming.leave,
                scale: nodeOpen ? 0.985 : 0.992,
                y: direction * -8,
              },
              'leave',
            )
            .to(
              nodes,
              {
                autoAlpha: 0.46,
                duration: mainMotionTiming.leave,
                stagger: { amount: 0.12, from: direction > 0 ? 'start' : 'end' },
                x: direction * -8,
              },
              'leave',
            )
            .to(
              hotspots,
              {
                autoAlpha: 0.24,
                duration: mainMotionTiming.leave,
                scale: 0.78,
                stagger: { amount: 0.08, from: 'center' },
              },
              'leave',
            )
            .addLabel('transit')
            .fromTo(
              root,
              {
                '--motion-depth': nodeOpen ? 0.985 : 0.995,
                '--motion-drift': direction * -drift,
                '--motion-surface': nodeOpen ? 0.72 : 0.18,
              },
              {
                '--motion-depth': nodeOpen ? 0.965 : 1,
                '--motion-drift': 0,
                '--motion-scan': 1,
                '--motion-sequence': 1,
                '--motion-surface': nodeOpen ? 1 : 0,
                duration: mainMotionTiming.transit,
              },
              'transit-=0.08',
            )
            .addLabel('enter')
            .to(
              root,
              {
                '--motion-scan': 0,
                duration: mainMotionTiming.enter,
                ease: motionEases.ripple,
              },
              'enter-=0.18',
            )
            .to(
              [...panelTargets, ...supportingTargets],
              {
                autoAlpha: 1,
                clearProps: 'transform,visibility,opacity',
                duration: mainMotionTiming.enter,
                scale: 1,
                y: 0,
              },
              'enter-=0.08',
            )
            .to(
              nodes,
              {
                autoAlpha: 1,
                clearProps: 'transform,visibility,opacity',
                duration: mainMotionTiming.enter,
                stagger: { amount: 0.14, from: direction > 0 ? 'end' : 'start' },
                x: 0,
              },
              'enter-=0.1',
            )
            .to(
              hotspots,
              {
                autoAlpha: 1,
                clearProps: 'transform,visibility,opacity',
                duration: mainMotionTiming.enter,
                scale: 1,
                stagger: { amount: 0.1, from: 'center' },
              },
              'enter',
            )

          return () => timeline.kill()
        },
        root,
      )

      return () => mm.revert()
    },
    { dependencies: [active, nodeOpen, wheelDirection], scope: rootRef },
  )

  return null
}
