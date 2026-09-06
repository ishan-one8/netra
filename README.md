# NETRA

AI-based virtual camera tracking for the coarse-alignment stage of mobile
free-space optical communication (FSOC) terminals.

**Smart India Hackathon 2026 · Problem Statement SIH26169 · ISRO, Department of Space**

> Software simulation. The camera, the beacon and every disturbance exist only
> in software — no optical hardware is involved, and no real ISRO or
> operational FSOC telemetry has been used.

## What it does

Coarse alignment is the stage where a transmitting terminal must locate the
remote terminal and hold it inside its camera field of view. Testing that on
real hardware needs expensive cameras, pan-tilt mechanisms and optical benches,
so NETRA closes the loop in software instead: a virtual camera renders what the
sensor would see, a detector proposes candidates, an estimator holds the track,
and a rate-limited gimbal steers the boresight.

## Picking up the work

Whoever is building the detector should start with [HANDOFF.md](HANDOFF.md):
what exists, where the seam is, and the two things that surprise people.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

## Measuring it

The tracking loop lives in `src/sim/engine.ts` as a plain function, so it can be
driven without a browser:

```bash
npm run bench
```

That runs eleven scenarios and reports pointing error and lock retention. It is
how the loop is checked — a UI can render a broken tracker perfectly happily.

Nominal pointing is 0.8 mrad against a 20.9 mrad lock window.

## Scope

The detector is classical: centroid, Kalman-gated association, and correlation.
The CNN described in the pipeline is the next stage of work, to be trained on
labelled frames this simulator generates. Adapting any of it to real sensor data
is future work.
