# Void Relic Experience

> Production direction locked on 2026-07-10.

## Experience statement

Sakura1tap is an interactive world between signal and dream. The interface is the work: typography, the central relic, pointer refraction, water rings, and scroll timing form one continuous installation.

## Visual system

- Background: obsidian black with restrained telemetry and grid traces.
- Primary object: optimized 79 KB WebP relic embedded as a build-owned data URI.
- Accent: sakura gold with a small icy-cyan refraction edge.
- Type: condensed editorial display plus monospaced system metadata.
- Content hierarchy: artifact first, movement second, text third.

## Scroll narrative

One scrubbed GSAP + ScrollTrigger timeline drives five acts:

1. Opening — the signal appears.
2. Compression — noise becomes matter.
3. Expansion — selected experiments enter the archive.
4. Drift — the working principle is revealed.
5. Exit — creator identity, GitHub, and replay.

The relic changes position, scale, rotation, and depth with the same master progress. Text panels only animate with transform, opacity, and filter.

## Interaction

- Soft-follow cursor lens and click ripple.
- Direct scene rail and header navigation.
- Smooth jump into the signal from the primary action.
- Pointer parallax on the artifact.
- Mobile layout removes the custom cursor and simplifies project metadata.
- Reduced-motion mode collapses the long scroll sequence to a static opening composition.

## Route contract

- `/` keeps the Boot → Live2D entry and opens the Void Relic main experience.
- `/lab` preserves the previous Realm installation as an experiment archive.
- `/play` and `/play/blackout` remain unchanged.

## Performance contract

- No new runtime dependency: existing GSAP is reused.
- Hero art is stored as WebP and embedded to avoid an extra repository-binary workflow.
- Motion uses transform, opacity, filter, and CSS custom properties.
- No additional WebGL context is created for the main experience.
- Mobile omits expensive cursor effects.
- Production build must pass before merge.
