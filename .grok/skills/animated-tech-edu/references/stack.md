# Stack reference — animated technical education sites

## Recommended baseline (2025–2026)

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
npm install motion gsap @gsap/react zustand clsx tailwind-merge lucide-react
npm install katex react-katex gray-matter next-mdx-remote
# optional diagrams / editors
npm install d3 @types/d3 @uiw/react-codemirror @codemirror/lang-javascript
```

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js App Router | RSC for content shell, client islands for stages |
| Language | TypeScript strict | Lesson props stay typed |
| Styling | Tailwind CSS v4 | Fast systems UI |
| UI motion | `motion` (Motion One / Framer lineage) | React-native API, layout animations |
| Timelines | GSAP + ScrollTrigger | Long scroll essays, precise scrubbing |
| Interactive vectors | Rive | State-machine characters / UI widgets |
| Charts / force diagrams | D3 or pure SVG | Technical accuracy |
| State | Zustand | Lesson player + lab knobs |
| Content | MDX or typed TS modules | Structured steps |
| Math | KaTeX | Algorithms / formulas |
| Icons | lucide-react | Consistent stroke icons |

## When to reach for heavier tools

- **Remotion**: export YouTube-quality explainers from React; not primary site runtime.
- **Motion Canvas**: real-time code-driven presentations.
- **Three.js / React Three Fiber**: only if spatial/3D is the learning goal.
- **Lottie**: brand flourishes, loaders — weak for step pedagogy (hard to map to lesson state).
- **Spline**: marketing 3D, rarely ideal for precise CS diagrams.

## Performance budget

- LCP < 2.5s on mid mobile
- Prefer CSS/Motion on compositor props
- Code-split each heavy diagram: `next/dynamic`
- Cap simultaneous animated nodes (~50 simple SVG nodes)
- Pause offscreen animations with IntersectionObserver

## Accessibility

- Visible focus rings on transport controls
- `aria-live="polite"` for captions when step changes
- Keyboard map documented in UI
- Contrast ≥ WCAG AA on captions and labels
- `prefers-reduced-motion: reduce` path required

## Quality references to emulate (study, don’t copy)

- Josh W. Comeau interactive essays (CSS transitions, etc.) — scrubbable demos, action-driven motion
- 3Blue1Brown / Manim — one visual metaphor per idea
- Algorithm Visualizer / visualgo — step state for algorithms
- Stripe / Linear marketing motion — polish bar for chrome only
