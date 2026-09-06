# NETRA — handoff

For whoever is picking up the detector / backend work.

Live: <https://ishan-one8.github.io/netra/> · Repo: <https://github.com/ishan-one8/netra>

```bash
git clone https://github.com/ishan-one8/netra.git
cd netra && npm install
npm run dev          # http://localhost:5173
```

## What exists today

A complete frontend and a **working tracking loop that runs entirely in the
browser**. There is no server, no API, no database. Nothing calls out anywhere.

The loop lives in `src/sim/engine.ts` as one plain function —
`stepEngine(engine, params, dtMs, rand)` — with no React in it. That is
deliberate: the same code the UI runs can be driven headlessly.

```bash
npm run bench        # 11 scenarios, deterministic seed, prints mean/peak/lock%
npm run bench:emit   # same, and writes src/sim/bench-results.json
```

The site reads that JSON, so the numbers on the page and the numbers the code
produces cannot drift apart. **If you change the loop, re-run `bench:emit` and
commit the JSON**, or the page will be quoting stale results.

## The two things you need to know before starting

**1. The detector is classical, not learned.** It is a centroid / correlation
detector with a Kalman-gated associator. The problem statement says
"AI-based", the site says plainly that the CNN is still to build. That gap is
the main piece of work left.

**2. There is no image.** This is the part that surprises people. The virtual
camera does not render pixels. `stepEngine` computes where the beacon *is*
analytically, projects it to sensor coordinates, adds noise, and hands that
straight to the association stage:

```ts
// src/sim/engine.ts, the Detector block
const candidates: Candidate[] = []
if (beaconVisible) {
  const proj = project(trueAz + jitter, trueEl + jitter, pan, tilt)
  candidates.push({ x: proj.x, y: proj.y, score: ..., decoy: false })
}
for (const d of e.decoys) { /* same, decoy: true */ }
```

`CameraViewport` draws a *visualisation* of that state. It is not a sensor
frame anyone reads back. So a CNN has nothing to look at yet — **frame
synthesis is step one**, not the model.

## The seam

Everything downstream of detection — association, gating, estimation,
prediction, the rate-limited gimbal — is already written and measured. Do not
rewrite it. The contract you have to satisfy is one array:

```ts
type Candidate = {
  x: number      // normalised sensor coordinate, 0..1 across the frame
  y: number      // normalised, 0..1 down the frame
  score: number  // confidence, higher is better; the associator gates on this
  decoy: boolean // ground truth, for drawing rejections only — a real
                 // detector cannot know this, so emit false
}
```

Replace the block above with `detect(frame) => Candidate[]` and the rest of the
loop does not change. Sensor geometry is in `src/sim/camera.ts`
(`FOV_H = 24°`, `FOV_V = 16°`, `SENSOR_W = 1280 px`, `0.33 mrad/px`) — use
`project()` and `degToMrad()` from there rather than re-deriving them.

## Suggested order of work

1. **Render the frame.** Grayscale buffer at sensor resolution: beacon PSF,
   decoy glints, star field, sensor noise, scintillation. The physics for all
   of it already exists in `stepEngine` — it just isn't rasterised.
2. **Emit a dataset.** Every frame already comes with ground truth, so labels
   are free and unlimited. Extend `scripts/bench.ts`, which already drives the
   engine headlessly, to dump `frame + label` pairs.
3. **Train the detector.** Python, wherever you like — that part does not live
   in this repo.
4. **Make the decoys hard enough to matter.** Right now `Centroid + decoys`
   passes at 0.6 mrad, which means the classical detector handles them fine.
   Until a scenario exists where it visibly fails, a CNN cannot be shown to be
   necessary — and that argument matters more to a judge than the model does.
5. **Ship it.** Two options:
   - **ONNX Runtime Web / TF.js in the browser.** Site stays self-contained, no
     server to keep alive for the demo, works from GitHub Pages. Preferred.
   - **HTTP or WebSocket API.** Only if the model is too large to run client
     side. Note the loop steps at 60 fps — a per-frame round trip will not keep
     up, so you would batch or run the detector at a lower rate than the loop.

## Rules of engagement

- Branch off `master`, open a PR. Do not push to `master` directly.
- These must pass before a merge:
  ```bash
  npm run typecheck && npm run lint && npm run build && npm run bench
  ```
  `bench` exits non-zero if any scenario drops below the published thresholds,
  so a regression in the loop fails loudly rather than quietly.
- **Do not edit `src/styles/tokens.css`.** It is the design system, and it is
  built so that off-system values cannot be expressed — every colour, size and
  weight resolves through it. Changing a token changes the whole site.
- Do not relax the thresholds in `src/sim/useStressTest.ts` or `scripts/bench.ts`
  to make a run pass. The site's entire claim is that the bar is published
  before it is cleared.
- Frontend files (`src/components`, `src/routes`, `src/styles`) are Ishan's —
  raise it rather than editing in passing.

## Where things are

| Path | What |
| --- | --- |
| `src/sim/engine.ts` | The tracking loop. Pure function. **The seam is here.** |
| `src/sim/camera.ts` | Sensor geometry, FOV, slew limits, unit conversion |
| `src/sim/motion.ts` | Target motion patterns |
| `src/sim/useTracker.ts` | React wrapper — drives the engine, publishes telemetry |
| `src/sim/useStressTest.ts` | Eight-phase graded run, one uniform rule per phase |
| `scripts/bench.ts` | Headless harness, 11 scenarios, deterministic |
| `src/sim/bench-results.json` | Generated. The site reads it; do not hand-edit |
| `src/components/simulator/` | The console UI |
| `src/components/marketing/` | The landing page |
| `src/styles/tokens.css` | The design system. Off limits |
