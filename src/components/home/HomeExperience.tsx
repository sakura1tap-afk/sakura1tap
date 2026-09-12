import { type CSSProperties, type PointerEvent as ReactPointerEvent, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { handleRouteClick } from "../../app/routes";
import CinematicCanvas from "./CinematicCanvas";
import CinematicCursor from "./CinematicCursor";
import CursorRipple from "./CursorRipple";
import "./HomeExperience.css";

const chapters = ["首页", "互动", "功能", "片段", "继续"];

const destinations = [
  {
    index: "01",
    name: "功能空间",
    href: "/play",
    page: "play",
  },
  {
    index: "02",
    name: "动效实验室",
    href: "/lab",
    page: "lab",
  },
] as const;

export default function HomeExperience() {
  const experienceRef = useRef<HTMLElement>(null);
  const progressLabelRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef(0);
  const scrollVelocityRef = useRef(0);

  useEffect(() => {
    document.body.classList.add("cinematic-mode");
    return () => document.body.classList.remove("cinematic-mode");
  }, []);


  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const root = experienceRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const panels = () => root.querySelectorAll<HTMLElement>(".chapter-panel");
    const syncActiveChapter = (active: number) => {
      root.dataset.scene = String(active);
      panels().forEach((panel, index) => {
        const isActive = index === active;
        panel.toggleAttribute("inert", !isActive);
        panel.setAttribute("aria-hidden", String(!isActive));
      });
    };

    // Reduced motion: drop the scroll narrative and lay the acts out as a plain,
    // fully reachable document. Without this every act stayed `inert` and the
    // destination links kept `pointer-events: none`, so /play and /lab were
    // unreachable for anyone with the OS motion preference on.
    if (reducedMotion) {
      root.dataset.motion = "reduced";
      panels().forEach((panel) => {
        panel.removeAttribute("inert");
        panel.removeAttribute("aria-hidden");
      });
      gsap.set("[data-intro]", { clearProps: "all" });
      gsap.set(".site-chrome", { opacity: 1 });

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const index = Array.prototype.indexOf.call(panels(), entry.target);
            if (index < 0) continue;
            root.dataset.scene = String(index);
            root.querySelectorAll<HTMLElement>("[data-chapter]").forEach((element) => {
              if (Number(element.dataset.chapter) === index) element.setAttribute("aria-current", "step");
              else element.removeAttribute("aria-current");
            });
            if (progressLabelRef.current) {
              const ratio = index / (chapters.length - 1);
              progressLabelRef.current.textContent = String(Math.round(ratio * 100)).padStart(3, "0");
            }
          }
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
      );
      panels().forEach((panel) => observer.observe(panel));

      return () => {
        observer.disconnect();
        delete root.dataset.motion;
      };
    }

    syncActiveChapter(0);
    const context = gsap.context(() => {
      gsap.set("[data-intro]", { y: 34, opacity: 0 });
      gsap.set(".site-chrome", { opacity: 0 });
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .to(".site-chrome", { opacity: 1, duration: 1.1 }, 0.2)
        .to("[data-intro]", { y: 0, opacity: 1, duration: 1.25, stagger: 0.09 }, 0.35);

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
            syncActiveChapter(active);
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

    // Scroll speed is published as a CSS variable (and a ref the WebGL layer reads) so
    // the backdrop can answer to the scroll instead of only to the scroll position.
    let raf = 0;
    let lastScrollY = window.scrollY;
    let velocity = 0;
    let direction = 1;
    const publishVelocity = () => {
      const current = window.scrollY;
      const delta = current - lastScrollY;
      lastScrollY = current;
      if (Math.abs(delta) > 0.5) direction = delta > 0 ? 1 : -1;
      velocity += (Math.min(1, Math.abs(delta) / 70) - velocity) * 0.16;
      if (velocity < 0.001) velocity = 0;
      scrollVelocityRef.current = velocity;
      root.style.setProperty("--scroll-velocity", velocity.toFixed(3));
      root.style.setProperty("--scroll-direction", String(direction));
      raf = window.requestAnimationFrame(publishVelocity);
    };
    raf = window.requestAnimationFrame(publishVelocity);

    return () => {
      window.cancelAnimationFrame(raf);
      scrollVelocityRef.current = 0;
      context.revert();
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
      <CinematicCursor />

      <div className="cinematic-stage">
        <picture className="scene-fallback">
          <source media="(max-width: 760px)" srcSet="/cinematic/scene-mobile.webp" />
          <img src="/cinematic/bridge.webp" alt="" draggable={false} decoding="async" fetchPriority="high" />
        </picture>
        <CinematicCanvas progressRef={progressRef} velocityRef={scrollVelocityRef} />
        <CursorRipple />
        <div className="color-wash" aria-hidden="true" />
        <div className="soft-grain" aria-hidden="true" />
        <div className="scanline" aria-hidden="true" />
        <div className="petals" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => <i key={index} style={{ "--petal": index } as CSSProperties} />)}
        </div>

        <header className="site-chrome site-header">
          <button className="identity" type="button" onClick={() => scrollToChapter(0)} aria-label="返回首页">
            <strong>Sakura1Tap</strong>
          </button>
          <nav className="chapter-nav" aria-label="页面章节">
            {chapters.map((chapter, index) => (
              <button key={chapter} type="button" data-chapter={index} onClick={() => scrollToChapter(index)}>
                <i>0{index + 1}</i><span>{chapter}</span>
              </button>
            ))}
          </nav>
        </header>

        <section className="chapter-panel arrival-panel" aria-label="首页">
          <p className="chapter-mark" data-intro>01 / 首页</p>
          <h1 data-intro>Sakura1Tap</h1>
          <button className="weather-button" type="button" data-intro onClick={() => scrollToChapter(1)}>
            <span>开始探索</span><i>↓</i>
          </button>
        </section>

        <section className="chapter-panel proximity-panel" aria-label="互动说明">
          <p className="chapter-mark">02 / 互动</p>
          <h2>互动</h2>
        </section>

        <section className="chapter-panel archive-panel" aria-label="功能入口">
          <div className="archive-heading">
            <p className="chapter-mark">03 / 功能</p>
            <h2>功能</h2>
          </div>
          <div className="destination-list">
            {destinations.map((item) => (
              <a
                className="destination"
                data-cursor={item.name}
                href={item.href}
                key={item.name}
                onClick={handleRouteClick(item.page)}
                onPointerMove={tiltDestination}
                onPointerLeave={resetTilt}
              >
                <span className="destination-index">{item.index}</span>
                <span className="destination-main"><strong>{item.name}</strong></span>
                <b>↗</b>
              </a>
            ))}
          </div>
        </section>

        <div className="afterimage-portrait" aria-hidden="true">
          <img src="/cinematic/awakening.webp" alt="" draggable={false} />
        </div>
        <section className="chapter-panel afterimage-panel" aria-label="片段">
          <p className="chapter-mark">04 / 片段</p>
          <blockquote>哥布林万岁！</blockquote>
        </section>

        <section className="chapter-panel exit-panel" aria-label="继续探索">
          <p className="chapter-mark">05 / 继续</p>
          <h2>继续<br /><em>探索</em></h2>
          <div className="exit-actions">
            <button type="button" onClick={() => scrollToChapter(0)}>返回首页 <span>↺</span></button>
            <a href="https://github.com/sakura1tap-afk" target="_blank" rel="noreferrer">GitHub <span>↗</span></a>
          </div>
        </section>

        <aside className="chapter-rail site-chrome" aria-label="章节位置">
          {chapters.map((chapter, index) => (
            <button key={chapter} type="button" data-chapter={index} onClick={() => scrollToChapter(index)} aria-label={`前往${chapter}`}>
              <i /><span>0{index + 1}</span>
            </button>
          ))}
        </aside>

        <footer className="runtime site-chrome">
          <span><i /> Sakura1Tap</span>
          <span className="journey-count"><b ref={progressLabelRef}>000</b> / 100</span>
        </footer>
      </div>
    </main>
  );
}
