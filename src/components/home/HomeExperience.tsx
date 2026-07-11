import { type CSSProperties, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { voidRelicDataUri } from "../../assets/voidRelic";
import "./HomeExperience.css";

const scenes = [
  { index: "01", label: "OPENING", title: "Signal", sub: "A quiet frequency appears." },
  { index: "02", label: "COMPRESSION", title: "Matter", sub: "Noise collapses into form." },
  { index: "03", label: "EXPANSION", title: "Archive", sub: "Experiments become worlds." },
  { index: "04", label: "DRIFT", title: "Process", sub: "Systems learn to breathe." },
  { index: "05", label: "EXIT", title: "Contact", sub: "Leave a trace in the realm." },
];

const projects = [
  { no: "01", name: "SAKURA1TAP", type: "IMMERSIVE WEB", note: "Live2D / Three.js / GSAP" },
  { no: "02", name: "BLACKOUT RUN", type: "CANVAS GAME", note: "Motion / Collision / Rhythm" },
  { no: "03", name: "MOTION LAB", type: "INTERACTION R&D", note: "Scroll / Cursor / Material" },
];

export default function HomeExperience() {
  const experienceRef = useRef<HTMLElement>(null);
  const relicRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    document.body.classList.add("signal-mode");
    gsap.registerPlugin(ScrollTrigger);
    const root = experienceRef.current;
    const relic = relicRef.current;
    if (!root || !relic) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      gsap.set("[data-reveal]", { yPercent: 112, opacity: 0 });
      gsap.set(".hud-line, .brand-lockup, .top-nav, .runtime-strip", { opacity: 0 });

      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .to(".hud-line", { opacity: 1, duration: 0.8, stagger: 0.05 })
        .to(".brand-lockup, .top-nav", { opacity: 1, duration: 0.8 }, 0.15)
        .to("[data-reveal]", { yPercent: 0, opacity: 1, duration: 1.15, stagger: 0.11 }, 0.3)
        .fromTo(relic, { opacity: 0, scale: 0.82, filter: "blur(18px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.7 }, 0.4)
        .to(".runtime-strip", { opacity: 1, duration: 0.8 }, 0.85);

      if (reduced) {
        gsap.set(".story-panel", { opacity: 1 });
        return;
      }

      const story = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.15,
          onUpdate: (self) => {
            const active = Math.min(4, Math.floor(self.progress * 5));
            root.dataset.scene = String(active);
            root.style.setProperty("--story-progress", self.progress.toFixed(4));
            if (progressRef.current) progressRef.current.textContent = String(Math.round(self.progress * 100)).padStart(3, "0");
          },
        },
      });

      story
        .to(".opening-copy", { opacity: 0, y: -80, filter: "blur(10px)", duration: 0.15 }, 0.13)
        .to(relic, { xPercent: -28, rotate: -18, scale: 0.76, duration: 0.2 }, 0.12)
        .fromTo(".compression-copy", { opacity: 0, x: 90 }, { opacity: 1, x: 0, duration: 0.13 }, 0.2)
        .to(".compression-copy", { opacity: 0, x: -70, duration: 0.1 }, 0.34)
        .to(relic, { xPercent: 31, rotate: 22, scale: 1.18, duration: 0.2 }, 0.32)
        .fromTo(".archive-copy", { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 0.14 }, 0.4)
        .fromTo(".project-row", { opacity: 0, x: 70 }, { opacity: 1, x: 0, stagger: 0.025, duration: 0.11 }, 0.43)
        .to(".archive-copy, .project-row", { opacity: 0, y: -45, duration: 0.1 }, 0.56)
        .to(relic, { xPercent: -3, rotate: 132, scale: 0.58, yPercent: -8, duration: 0.2 }, 0.55)
        .fromTo(".drift-copy", { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.15 }, 0.62)
        .to(".drift-copy", { opacity: 0, filter: "blur(12px)", duration: 0.1 }, 0.75)
        .to(relic, { rotate: 180, scale: 0.9, xPercent: 34, yPercent: 2, duration: 0.18 }, 0.74)
        .fromTo(".exit-copy", { opacity: 0, x: -75 }, { opacity: 1, x: 0, duration: 0.15 }, 0.82);

      const xTo = gsap.quickTo(relic, "--parallax-x", { duration: 0.8, ease: "power3.out" });
      const yTo = gsap.quickTo(relic, "--parallax-y", { duration: 0.8, ease: "power3.out" });
      const onMove = (event: PointerEvent) => {
        const nx = event.clientX / window.innerWidth - 0.5;
        const ny = event.clientY / window.innerHeight - 0.5;
        xTo(nx * 26);
        yTo(ny * 20);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    }, root);

    return () => {
      ctx.revert();
      document.body.classList.remove("signal-mode");
    };
  }, []);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let frame = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;

    const render = () => {
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = requestAnimationFrame(render);
    };
    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.dataset.visible = "true";
    };
    const onDown = (event: PointerEvent) => {
      const ripple = document.createElement("i");
      ripple.className = "click-ripple";
      ripple.style.left = `${event.clientX}px`;
      ripple.style.top = `${event.clientY}px`;
      document.body.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 900);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  const scrollToScene = (index: number) => {
    const root = experienceRef.current;
    if (!root) return;
    const travel = root.scrollHeight - window.innerHeight;
    window.scrollTo({ top: root.offsetTop + travel * (index / 4), behavior: "smooth" });
  };

  return (
    <main className="signal-experience" data-scene="0" ref={experienceRef}>
      <div className="grain" aria-hidden="true" />
      <div className="cursor-lens" ref={cursorRef} aria-hidden="true"><span /></div>

      <div className="sticky-stage">
        <div className="hud-corners" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="coordinate coordinate-left hud-line">35.6762° N</div>
        <div className="coordinate coordinate-right hud-line">139.6503° E</div>

        <header className="site-header">
          <button className="brand-lockup" onClick={() => scrollToScene(0)} aria-label="返回开场">
            <strong>SAKURA1TAP</strong>
            <span><i /> DIGITAL REALM 01</span>
          </button>
          <nav className="top-nav" aria-label="章节导航">
            {scenes.map((scene, index) => (
              <button key={scene.label} onClick={() => scrollToScene(index)} data-nav={index}>
                <span>0{index + 1}</span>{scene.label}
              </button>
            ))}
          </nav>
        </header>

        <div className="relic-field" ref={relicRef} aria-hidden="true">
          <div className="relic-aura" />
          <img
            src={voidRelicDataUri}
            alt=""
            className="relic-image"
            draggable={false}
            onError={(event) => {
              event.currentTarget.hidden = true
            }}
          />
          <div className="relic-core" />
          <div className="water-plane"><i /><i /><i /></div>
          <div className="particle-field">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}</div>
        </div>

        <section className="story-panel opening-copy" aria-label="Opening">
          <p className="eyebrow"><span /> INTERACTIVE SYSTEM / 2026</p>
          <h1><span><b data-reveal>A WORLD BETWEEN</b></span><span><b data-reveal>SIGNAL <em>&amp;</em> DREAM</b></span></h1>
          <p className="hero-note" data-reveal>Not a portfolio to browse.<br />A frequency to enter.</p>
          <button className="signal-button" data-reveal onClick={() => scrollToScene(1)}>
            <i><span /></i><b>ENTER THE SIGNAL</b><span>↘</span>
          </button>
        </section>

        <section className="story-panel compression-copy" aria-label="Compression">
          <p className="scene-kicker">02 — COMPRESSION</p>
          <h2>NOISE<br />BECOMES<br /><em>MATTER.</em></h2>
          <div className="spec-list">
            <span><b>INPUT</b> curiosity / pressure / time</span>
            <span><b>PROCESS</b> prototype → break → rebuild</span>
            <span><b>OUTPUT</b> interaction with a pulse</span>
          </div>
        </section>

        <section className="story-panel archive-copy" aria-label="Archive">
          <p className="scene-kicker">03 — EXPANSION / SELECTED SIGNALS</p>
          <h2>THE<br />ARCHIVE</h2>
          <div className="project-list">
            {projects.map((project) => (
              <article className="project-row" key={project.no}>
                <span>{project.no}</span><strong>{project.name}</strong><em>{project.type}</em><small>{project.note}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="story-panel drift-copy" aria-label="Process">
          <p className="scene-kicker">04 — DRIFT / WORKING PRINCIPLE</p>
          <blockquote>“The interface should not decorate the idea. It should <em>become</em> the idea.”</blockquote>
          <div className="drift-meta"><span>DESIGN</span><span>CODE</span><span>MOTION</span><span>FEEDBACK</span></div>
        </section>

        <section className="story-panel exit-copy" aria-label="Contact">
          <p className="scene-kicker">05 — EXIT / THE KEEPER</p>
          <h2>SAKURA<br />1TAP</h2>
          <p>An evolving digital realm built between logic, motion and atmosphere.</p>
          <div className="exit-actions">
            <a href="https://github.com/sakura1tap-afk" target="_blank" rel="noreferrer">GITHUB <span>↗</span></a>
            <button onClick={() => scrollToScene(0)}>REPLAY <span>↑</span></button>
          </div>
        </section>

        <aside className="scene-rail" aria-label="当前章节">
          {scenes.map((scene, index) => <button key={scene.label} onClick={() => scrollToScene(index)} data-rail={index}><i /><span>{scene.index}</span><b>{scene.label}</b></button>)}
        </aside>

        <footer className="runtime-strip">
          <span><i /> REACT / THREE / GSAP / 60 FPS</span>
          <span className="scroll-readout"><b ref={progressRef}>000</b> / 100</span>
          <span>SIGNAL STABLE <i /></span>
        </footer>
      </div>
    </main>
  );
}
