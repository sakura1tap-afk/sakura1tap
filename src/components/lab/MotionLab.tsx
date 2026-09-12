import { useRef } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { gsap, useGSAP } from '../../motion/gsap'
import './MotionLab.css'

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    title: '入口动效规范',
    body: '把首屏动效压缩成可阅读的节奏：标题、说明和行动按钮按优先级进入，不再抢走内容本身。',
  },
  {
    title: '内容滚动呈现',
    body: '使用 ScrollTrigger 做轻量 reveal，卡片和文本只在需要时分批出现，保持页面像产品而不是演示板。',
  },
  {
    title: '可替换视觉层',
    body: '背景、光场和分割线全部由 CSS 变量控制，后续可以替换成正式素材而不改动信息结构。',
  },
  {
    title: '性能边界',
    body: '限制动画属性在 transform、opacity 和 filter 内，减少大面积重绘，并支持 reduced motion。',
  },
]

const metrics = [
  ['4 modules', 'landing structure'],
  ['1200px', 'container width'],
  ['0 deps', 'no new runtime cost'],
]

const introPoints = [
  'H1 / H2 / body / caption scale is bounded and reusable.',
  'Each section carries multiple readable points instead of one oversized slogan.',
  'Motion stays as reveal and feedback; layout owns the hierarchy.',
]

const deliveryNotes = ['Design tokens first', 'Content density raised', 'Formal pages untouched']

const depthNotes = [
  {
    title: 'Scroll rhythm',
    body: 'Hero holds longer, features move at a medium pace, and the CTA resolves faster so the page does not scroll evenly.',
  },
  {
    title: 'Spatial continuity',
    body: 'Each layer keeps the same design system while shifting position, scale, and depth against a slower background.',
  },
  {
    title: 'Production boundary',
    body: 'The engine stays CSS and GSAP only, so it can be merged, removed, or replaced without touching main site logic.',
  },
]

const SPACE_PHYSICS = {
  baseY: 72,
  depthBlur: 0.26,
  depthBrightness: 0.03,
  depthContrast: 0.045,
  hoverField: 0.34,
  scrub: 0.72,
  scale: 0.022,
}

export default function MotionLab() {
  const rootRef = useRef<HTMLElement | null>(null)
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const magneticRef = useRef<HTMLAnchorElement | null>(null)

  useGSAP(
    (_, contextSafe) => {
      const root = rootRef.current
      const cursor = cursorRef.current
      const magnetic = magneticRef.current
      if (!root || !cursor) return undefined

      const safe = contextSafe ?? (<T extends (...args: never[]) => unknown>(handler: T) => handler)
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const featureAnchors = gsap.utils.toArray<HTMLElement>('.lab-feature-region h3, .lab-feature-region p', root)
      const sections = gsap.utils.toArray<HTMLElement>('.lab-product-section', root)
      const layerFrames = gsap.utils.toArray<HTMLElement>('.lab-layer-frame', root)
      const depthAnchors = gsap.utils.toArray<HTMLElement>('.lab-depth-region h3, .lab-depth-region p', root)
      const quickCursorX = gsap.quickTo(cursor, 'x', { duration: 0.22, ease: 'power3.out' })
      const quickCursorY = gsap.quickTo(cursor, 'y', { duration: 0.22, ease: 'power3.out' })
      const quickLightX = gsap.quickTo(root, '--lab-light-x', { duration: 0.72, ease: 'power3.out' })
      const quickLightY = gsap.quickTo(root, '--lab-light-y', { duration: 0.72, ease: 'power3.out' })
      const quickDriftX = gsap.quickTo(root, '--lab-bg-drift-x', { duration: 1.2, ease: 'power3.out' })
      const quickHover = gsap.quickTo(root, '--lab-hover-energy', { duration: 0.42, ease: 'power3.out' })

      gsap.set(root, {
        '--lab-bg-drift-x': 0,
        '--lab-bg-drift-y': 0,
        '--lab-hover-energy': 0,
        '--lab-light-x': window.innerWidth / 2,
        '--lab-light-y': window.innerHeight / 2,
        '--lab-scroll-depth': 0,
        '--lab-space-bg-y': 0,
        '--lab-space-float-y': 0,
      })
      gsap.set(cursor, { autoAlpha: 0.72, xPercent: -50, yPercent: -50 })

      ScrollTrigger.create({
        end: 'bottom bottom',
        onUpdate: (self) => {
          if (reduceMotion) return

          gsap.set(root, {
            '--lab-bg-drift-y': self.progress * -64,
            '--lab-scroll-depth': self.progress,
            '--lab-space-bg-y': self.progress * -48,
            '--lab-space-float-y': self.progress * -112,
          })
        },
        start: 'top top',
        trigger: root,
      })

      sections.forEach((section) => {
        gsap.to(root, {
          '--lab-section-tone': section.dataset.tone ?? '#111312',
          duration: reduceMotion ? 0.01 : 0.45,
          ease: 'power2.out',
          scrollTrigger: {
            end: 'bottom 40%',
            start: 'top 58%',
            toggleActions: 'play reverse play reverse',
            trigger: section,
          },
        })
      })

      layerFrames.forEach((frame, index) => {
        const section = frame.closest<HTMLElement>('.lab-product-section')
        if (!section) return

        const layerDepth = Number(section.dataset.depth ?? index)
        const depthFactor = 1 + layerDepth * 0.16
        const startY = index === 0 ? 0 : SPACE_PHYSICS.baseY * depthFactor
        const endY = -SPACE_PHYSICS.baseY * (0.8 + layerDepth * 0.12)
        const startScale = 1 - SPACE_PHYSICS.scale * layerDepth
        const endScale = 1 - SPACE_PHYSICS.scale * (layerDepth + 1.5)
        const startOpacity = index === 0 ? 1 : 0.66 + layerDepth * 0.045
        const endOpacity = index === 0 ? 0.72 : 1
        const startBlur = SPACE_PHYSICS.depthBlur * Math.max(0, layerDepth - 0.2)
        const endBlur = index === 0 ? SPACE_PHYSICS.depthBlur * 1.25 : SPACE_PHYSICS.depthBlur * Math.max(0, layerDepth - 3.2)
        const startContrast = 1 - SPACE_PHYSICS.depthContrast * Math.min(layerDepth, 3)
        const endContrast = index === 0 ? 0.94 : 1 + SPACE_PHYSICS.depthContrast * 0.45
        const startBrightness = 1 - SPACE_PHYSICS.depthBrightness * Math.min(layerDepth, 3)
        const endBrightness = index === 0 ? 0.96 : 1 + SPACE_PHYSICS.depthBrightness * 0.35

        gsap.fromTo(
          frame,
          {
            autoAlpha: reduceMotion ? 1 : startOpacity,
            filter: reduceMotion
              ? 'none'
              : `blur(${startBlur.toFixed(2)}px) contrast(${startContrast.toFixed(3)}) brightness(${startBrightness.toFixed(3)})`,
            scale: reduceMotion ? 1 : startScale,
            y: reduceMotion ? 0 : startY,
          },
          {
            autoAlpha: reduceMotion ? 1 : endOpacity,
            ease: 'none',
            filter: reduceMotion
              ? 'none'
              : `blur(${endBlur.toFixed(2)}px) contrast(${endContrast.toFixed(3)}) brightness(${endBrightness.toFixed(3)})`,
            scale: reduceMotion ? 1 : endScale,
            scrollTrigger: {
              end: index === 0 ? 'bottom top' : 'bottom 18%',
              scrub: SPACE_PHYSICS.scrub,
              start: index === 0 ? 'top top' : 'top 82%',
              trigger: section,
            },
            y: reduceMotion ? 0 : endY,
          },
        )

        ScrollTrigger.create({
          id: `lab-space-layer-${index + 1}`,
          onEnter: () => root.setAttribute('data-active-layer', section.dataset.layer ?? `${index}`),
          onEnterBack: () => root.setAttribute('data-active-layer', section.dataset.layer ?? `${index}`),
          start: 'top center',
          trigger: section,
        })
      })

      gsap.from(featureAnchors, {
        autoAlpha: reduceMotion ? 1 : 0.58,
        ease: 'none',
        scrollTrigger: {
          end: 'bottom 30%',
          scrub: 0.65,
          start: 'top 78%',
          trigger: '.lab-feature-grid',
        },
        stagger: 0.04,
        y: reduceMotion ? 0 : SPACE_PHYSICS.baseY * 0.9,
      })

      gsap.from(depthAnchors, {
        autoAlpha: reduceMotion ? 1 : 0.56,
        ease: 'none',
        scrollTrigger: {
          end: 'bottom 26%',
          scrub: 0.5,
          start: 'top 78%',
          trigger: '.lab-depth-grid',
        },
        stagger: 0.04,
        y: reduceMotion ? 0 : SPACE_PHYSICS.baseY * 0.8,
      })

      const onPointerMove = safe((event: PointerEvent) => {
        quickCursorX(event.clientX)
        quickCursorY(event.clientY)
        quickLightX(event.clientX)
        quickLightY(event.clientY)
        quickDriftX(gsap.utils.mapRange(0, window.innerWidth, -10, 10, event.clientX))
        quickHover(event.target instanceof Element && event.target.closest('a, button') ? 1 : SPACE_PHYSICS.hoverField)
      })

      const onPointerOver = safe((event: PointerEvent) => {
        const target = event.target
        if (target instanceof Element && target.closest('a, button')) {
          quickHover(1)
        }
      })

      const onPointerOut = safe((event: PointerEvent) => {
        const target = event.target
        if (target instanceof Element && target.closest('a, button')) {
          quickHover(SPACE_PHYSICS.hoverField)
        }
      })

      const onPointerLeave = safe(() => {
        quickHover(0)
      })

      const onMagneticMove = safe((event: PointerEvent) => {
        if (!magnetic || reduceMotion) return

        const rect = magnetic.getBoundingClientRect()
        const x = event.clientX - rect.left - rect.width / 2
        const y = event.clientY - rect.top - rect.height / 2
        gsap.to(magnetic, { duration: 0.34, ease: 'power3.out', x: x * 0.18, y: y * 0.18 })
        magnetic.style.setProperty('--shine-x', `${event.clientX - rect.left}px`)
        magnetic.style.setProperty('--shine-y', `${event.clientY - rect.top}px`)
        quickHover(1)
      })

      const onMagneticLeave = safe(() => {
        if (!magnetic) return

        gsap.to(magnetic, { duration: 0.42, ease: 'power3.out', x: 0, y: 0 })
        quickHover(0)
      })

      root.addEventListener('pointermove', onPointerMove)
      root.addEventListener('pointerover', onPointerOver)
      root.addEventListener('pointerout', onPointerOut)
      root.addEventListener('pointerleave', onPointerLeave)
      magnetic?.addEventListener('pointermove', onMagneticMove)
      magnetic?.addEventListener('pointerleave', onMagneticLeave)
      ScrollTrigger.refresh()

      return () => {
        root.removeEventListener('pointermove', onPointerMove)
        root.removeEventListener('pointerover', onPointerOver)
        root.removeEventListener('pointerout', onPointerOut)
        root.removeEventListener('pointerleave', onPointerLeave)
        magnetic?.removeEventListener('pointermove', onMagneticMove)
        magnetic?.removeEventListener('pointerleave', onMagneticLeave)
      }
    },
    { scope: rootRef },
  )

  return (
    <section className="motion-lab lab-product-page" ref={rootRef}>
      <div className="lab-cursor" ref={cursorRef} aria-hidden="true" />
      <div className="lab-product-bg lab-depth-layer" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <header className="lab-site-header lab-float-layer">
        <a className="lab-brand-mark" href="/">
          Sakura1Tap Lab
        </a>
        <nav aria-label="Motion Lab sections">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#depth">Depth</a>
          <a href="#contact">Start</a>
        </nav>
      </header>

      <main>
        <section className="lab-product-section lab-hero-section" data-depth="0" data-layer="entry" data-tone="#101312">
          <div className="lab-layer-frame lab-container lab-hero-grid">
            <div className="lab-hero-content lab-anchor-layer">
              <p className="lab-kicker lab-reveal">Sakura1Tap Motion Prototype</p>
              <h1 className="lab-hero-title">Readable motion for an interactive site.</h1>
              <p className="lab-hero-copy">
                A production-grade landing page foundation for Sakura1Tap: tighter typography, aligned sections, quiet
                GSAP enhancement, and room for real assets when the direction settles.
              </p>
              <div className="lab-hero-actions lab-float-layer">
                <a className="lab-primary-action" href="#features" ref={magneticRef}>
                  <span>View modules</span>
                </a>
                <a className="lab-secondary-action" href="/">
                  Back to site
                </a>
              </div>
            </div>

            <aside className="lab-hero-field lab-float-layer" aria-label="Prototype status">
              <div className="lab-field-topline">
                <span>Design system</span>
                <i />
              </div>
              <h2>Motion supports the reading path.</h2>
              <p>
                This pass keeps the interaction layer but tightens the surface into a website structure: message, proof,
                modules, and next action.
              </p>
              <div className="lab-metric-row">
                {metrics.map(([value, label]) => (
                  <span key={label}>
                    <strong>{value}</strong>
                    {label}
                  </span>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="lab-product-section lab-intro-section" data-depth="1" data-layer="transition" data-tone="#14110f" id="about">
          <div className="lab-layer-frame lab-container lab-two-column">
            <div className="lab-section-heading lab-reveal lab-anchor-layer">
              <p className="lab-kicker">Structure pass</p>
              <h2>From motion demo to product layout.</h2>
            </div>
            <div className="lab-section-body lab-reveal lab-float-layer">
              <p>
                This page is now a product-facing prototype: it has a brand entrance, a short explanation layer, a
                feature grid, and a closing CTA. The design leaves room for later visuals without depending on them.
              </p>
              <p>
                Motion remains present, but it is no longer the page structure. ScrollTrigger only supports rhythm:
                reveal, subtle background tone, and small interaction feedback.
              </p>
              <ul className="lab-check-list">
                {introPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="lab-product-section lab-feature-section" data-depth="2" data-layer="content" data-tone="#101418" id="features">
          <div className="lab-layer-frame lab-container">
            <div className="lab-feature-head lab-reveal lab-anchor-layer">
              <p className="lab-kicker">System modules</p>
              <h2>A quieter base for future art direction.</h2>
            </div>
            <div className="lab-feature-grid lab-float-layer">
              {features.map((feature) => (
                <article className="lab-feature-region" key={feature.title}>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lab-product-section lab-depth-section" data-depth="3" data-layer="depth" data-tone="#11151a" id="depth">
          <div className="lab-layer-frame lab-container lab-depth-layout">
            <div className="lab-section-heading lab-reveal lab-anchor-layer">
              <p className="lab-kicker">Depth layer</p>
              <h2>Scroll becomes structure, not decoration.</h2>
            </div>
            <div className="lab-depth-grid lab-float-layer">
              {depthNotes.map((note) => (
                <article className="lab-depth-region" key={note.title}>
                  <h3>{note.title}</h3>
                  <p>{note.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lab-product-section lab-cta-section" data-depth="4" data-layer="exit" data-tone="#12110d" id="contact">
          <div className="lab-layer-frame lab-container lab-cta-grid">
            <div className="lab-reveal lab-anchor-layer">
              <p className="lab-kicker">Next production pass</p>
              <h2>Replace abstract layers after structure holds.</h2>
            </div>
            <div className="lab-cta-region lab-reveal lab-float-layer">
              <p>
                Recommended next step: decide whether this prototype becomes a separate design case study, or whether its
                layout system should be merged back into the real Sakura1Tap pages.
              </p>
              <ul className="lab-delivery-list">
                {deliveryNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <a href="/">Return to Sakura1Tap</a>
            </div>
          </div>
        </section>
      </main>
    </section>
  )
}
