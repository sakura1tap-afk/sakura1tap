import { type CSSProperties, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CinematicCanvas from "./CinematicCanvas";

const chapters = ["ARRIVAL", "PROXIMITY", "ARCHIVE", "AFTERIMAGE", "EXIT"];

const destinations = [
  {
    index: "01",
    name: "SAKURA1TAP",
    kind: "THE ORIGIN",
    line: "Enter the living interface.",
    href: "https://www.sakura1tap.com",
  },
  {
    index: "02",
    name: "BLACKOUT RUN",
    kind: "PLAYABLE SIGNAL",
    line: "Run until the light remembers you.",
    href: "https://www.sakura1tap.com/play/blackout",
  },
  {
    index: "03",
    name: "MOTION LAB",
    kind: "EXPERIMENTAL ROOM",
    line: "Touch the unfinished ideas.",
    href: "https://www.sakura1tap.com/lab",
  },
];

export default function HomeExperience() {
  const experienceRef = useRef<HTMLElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const progressLabelRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef(0);
  const readyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    document.body.classList.add("cinematic-mode");
    return () => document.body.classList.remove("cinematic-mode");
  }, []);

  const revealExperience = useCallback(() => {
    if (readyTimerRef.current !== null) return;
    readyTimerRef.current = window.setTimeout(() => {
      experienceRef.current?.setAttribute("data-render-ready", "true");
    }, 720);
  }, []);

  useEffect(() => {
    const fallback = window.setTimeout(revealExperience, 1800);
    return () => {
      window.clearTimeout(fallback);
      if (readyTimerRef.current !== null) window.clearTimeout(readyTimerRef.current);
    };
  }, [revealExperience]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const root = experienceRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      gsap.set("[data-intro]", { y: 34, opacity: 0 });
      gsap.set(".site-chrome", { opacity: 0 });
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .to(".site-chrome", { opacity: 1, duration: 1.1 }, 0.2)
        .to("[data-intro]", { y: 0, opacity: 1, duration: 1.25, stagger: 0.09 }, 0.35);

      if (reducedMotion) {
        gsap.set(".chapter-panel:first-of-type", { opacity: 1 });
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.05,
          invalidateOnRefresh: true,
          onUpdate: ({ progress }) => {
            progressRef.current = progress;
            const active = Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
            root.dataset.scene = String(active);
            root.style.setProperty("--journey", progress.toFixed(4));
            if (progressLabelRef.current) {
              progressLabelRef.current.textContent = String(Math.round(progress * 100)).padStart(3, "0");
            }
            root.querySelectorAll<HTMLElement>("[data-chapter]").forEach((element) => {
              if (Number(element.dataset.chapter) === active) element.setAttribute("aria-current", "step");
              else element.removeAttribute("aria-current");
            });
          },
        },
      });

      timeline
        .to(".arrival-panel", { opacity: 0, y: -90, filter: "blur(10px)", duration: 0.12 }, 0.11)
        .fromTo(".proximity-panel", { opacity: 0, y: 65 }, { opacity: 1, y: 0, duration: 0.13 }, 0.18)
        .to(".proximity-panel", { opacity: 0, x: -70, filter: "blur(9px)", duration: 0.1 }, 0.34)
        .fromTo(".archive-panel", { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 0.14 }, 0.4)
        .fromTo(".destination", { opacity: 0, x: 60 }, { opacity: 1, x: 0, stagger: 0.025, duration: 0.12 }, 0.43)
        .to(".archive-panel", { opacity: 0, y: -65, filter: "blur(8px)", duration: 0.12 }, 0.58)
        .fromTo(".afterimage-panel", { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.14 }, 0.64)
        .fromTo(".afterimage-portrait", { opacity: 0, scale: 1.12 }, { opacity: 0.32, scale: 1, duration: 0.18 }, 0.63)
        .to(".afterimage-panel, .afterimage-portrait", { opacity: 0, filter: "blur(14px)", duration: 0.1 }, 0.76)
        .fromTo(".exit-panel", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.15 }, 0.82);
    }, root);

    return () => context.revert();
  }, []);

  useEffect(() => {
    const cursor = cursorRef.current;
    const pointerFine = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!cursor || !pointerFine || reducedMotion) return;

    const moveX = gsap.quickTo(cursor, "x", { duration: 0.24, ease: "power3.out" });
    const moveY = gsap.quickTo(cursor, "y", { duration: 0.24, ease: "power3.out" });
    const onMove = (event: PointerEvent) => {
      moveX(event.clientX);
      moveY(event.clientY);
      cursor.dataset.visible = "true";
    };
    const onOver = (event: PointerEvent) => {
      cursor.dataset.hover = (event.target as HTMLElement).closest("a, button") ? "true" : "false";
    };
    const onLeave = () => { cursor.dataset.visible = "false"; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  const scrollToChapter = (index: number) => {
    const root = experienceRef.current;
    if (!root) return;
    const distance = root.scrollHeight - window.innerHeight;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: root.offsetTop + distance * (index / (chapters.length - 1)),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  const tiltDestination = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--tilt-x", `${((event.clientX - bounds.left) / bounds.width - 0.5) * 8}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${((event.clientY - bounds.top) / bounds.height - 0.5) * -7}deg`);
  };

  const resetTilt = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <main className="cinematic-experience" data-scene="0" ref={experienceRef}>
      <div className="awakening-veil" aria-hidden="true">
        <picture>
          <source media="(max-width: 760px)" srcSet="/cinematic/awakening-mobile.webp" />
          <img src="/cinematic/awakening.webp" alt="" draggable={false} />
        </picture>
        <div className="veil-shade" />
        <div className="veil-copy"><strong>SAKURA1TAP</strong><span>AWAKENING THE SILENCE</span></div>
      </div>

      <div className="cursor-orbit" ref={cursorRef} aria-hidden="true"><i /><span>DRAG</span></div>

      <div className="cinematic-stage">
        <picture className="scene-fallback">
          <source media="(max-width: 760px)" srcSet="/cinematic/scene-mobile.webp" />
          <img src="/cinematic/bridge.webp" alt="" draggable={false} />
        </picture>
        <CinematicCanvas progressRef={progressRef} onReady={revealExperience} />
        <div className="color-wash" aria-hidden="true" />
        <div className="soft-grain" aria-hidden="true" />
        <div className="scanline" aria-hidden="true" />
        <div className="petals" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => <i key={index} style={{ "--petal": index } as CSSProperties} />)}
        </div>

        <header className="site-chrome site-header">
          <button className="identity" type="button" onClick={() => scrollToChapter(0)} aria-label="Return to arrival">
            <strong>SAKURA1TAP</strong><span>INTERACTIVE REALM / 01</span>
          </button>
          <nav className="chapter-nav" aria-label="Journey chapters">
            {chapters.map((chapter, index) => (
              <button key={chapter} type="button" data-chapter={index} onClick={() => scrollToChapter(index)}>
                <i>0{index + 1}</i><span>{chapter}</span>
              </button>
            ))}
          </nav>
        </header>

        <section className="chapter-panel arrival-panel" aria-label="Arrival">
          <p className="chapter-mark" data-intro>01 / ARRIVAL · SOMEWHERE AFTER THE RAIN</p>
          <h1><span data-intro>BETWEEN</span><span data-intro>SILENCE <em>&amp;</em> SIGNAL</span></h1>
          <p className="opening-line" data-intro>A living interface by Sakura1tap.<br />Scroll to cross the distance.</p>
          <button className="weather-button" type="button" data-intro onClick={() => scrollToChapter(1)}>
            <span>ENTER THE WEATHER</span><i>↓</i>
          </button>
        </section>

        <section className="chapter-panel proximity-panel" aria-label="Proximity">
          <p className="chapter-mark">02 / PROXIMITY</p>
          <h2>THE IMAGE<br />REMEMBERS<br /><em>YOUR TOUCH.</em></h2>
          <div className="gesture-note"><i /><span>MOVE TO DISTURB THE LIGHT<br />HOLD + DRAG TO BEND THE AIR</span></div>
        </section>

        <section className="chapter-panel archive-panel" aria-label="Archive">
          <div className="archive-heading">
            <p className="chapter-mark">03 / ARCHIVE · SELECTED SIGNALS</p>
            <h2>THREE<br />DOORS<br /><em>REMAIN.</em></h2>
          </div>
          <div className="destination-list">
            {destinations.map((item) => (
              <a
                className="destination"
                href={item.href}
                key={item.name}
                onPointerMove={tiltDestination}
                onPointerLeave={resetTilt}
              >
                <span className="destination-index">{item.index}</span>
                <span className="destination-main"><strong>{item.name}</strong><small>{item.line}</small></span>
                <em>{item.kind}</em><b>↗</b>
              </a>
            ))}
          </div>
        </section>

        <div className="afterimage-portrait" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cinematic/awakening.webp" alt="" draggable={false} />
        </div>
        <section className="chapter-panel afterimage-panel" aria-label="Afterimage">
          <p className="chapter-mark">04 / AFTERIMAGE</p>
          <blockquote>“NOT EVERYTHING<br />THAT DISAPPEARS<br /><em>IS GONE.</em>”</blockquote>
          <span>THE ARCHIVE KEEPS BREATHING</span>
        </section>

        <section className="chapter-panel exit-panel" aria-label="Exit">
          <p className="chapter-mark">05 / EXIT · OR BEGIN AGAIN</p>
          <h2>STAY<br />A LITTLE<br /><em>LONGER.</em></h2>
          <p>There is no final page here. Only another signal waiting to be touched.</p>
          <div className="exit-actions">
            <button type="button" onClick={() => scrollToChapter(0)}>REPLAY <span>↺</span></button>
            <a href="https://github.com/sakura1tap-afk" target="_blank" rel="noreferrer">GITHUB <span>↗</span></a>
          </div>
        </section>

        <aside className="chapter-rail site-chrome" aria-label="Chapter position">
          {chapters.map((chapter, index) => (
            <button key={chapter} type="button" data-chapter={index} onClick={() => scrollToChapter(index)} aria-label={`Go to ${chapter}`}>
              <i /><span>0{index + 1}</span>
            </button>
          ))}
        </aside>

        <footer className="runtime site-chrome">
          <span><i /> SAKURA1TAP / DIGITAL REALM</span>
          <span className="journey-count"><b ref={progressLabelRef}>000</b> / 100</span>
          <span>DRAG THE WEATHER <i /></span>
        </footer>
      </div>
    </main>
  );
}
