/**
 * The virtual camera and its gimbal.
 *
 * Coarse alignment is an angular problem, so the model is angular throughout:
 * the target has a true bearing, the camera has a commanded bearing, and the
 * error between them is what the loop is trying to drive to zero. Pixels are
 * derived from that geometry rather than being the source of truth — which is
 * also why the console can report both, and say how one becomes the other.
 */

/** Horizontal field of view, degrees. */
export const FOV_H = 24
/** Vertical field of view, degrees. */
export const FOV_V = 16
/** Sensor width in pixels. */
export const SENSOR_W = 1280
/** Sensor height in pixels. */
export const SENSOR_H = Math.round((SENSOR_W * FOV_V) / FOV_H)

/** Degrees covered by one pixel — the instrument's angular resolution. */
export const DEG_PER_PX = FOV_H / SENSOR_W
/** Milliradians per pixel. Quoted in the UI so the two units stay tied together. */
export const MRAD_PER_PX = (DEG_PER_PX * Math.PI) / 180 / 0.001

/** Gimbal slew limit, degrees per second. A real pan/tilt stage cannot teleport. */
export const SLEW_MAX_DEG_S = 22

/** Angular error under which the loop counts as locked, degrees. */
export const LOCK_DEG = 1.2
/** Angular error under which a detection counts as acquired, degrees. */
export const ACQUIRE_DEG = 4

export const degToMrad = (deg: number) => (deg * Math.PI) / 180 / 0.001

/** Where a bearing lands on the sensor, in normalised frame coordinates. */
export function project(
  targetAz: number,
  targetEl: number,
  pan: number,
  tilt: number,
): { x: number; y: number; inFrame: boolean } {
  const dAz = targetAz - pan
  const dEl = targetEl - tilt
  const x = 0.5 + dAz / FOV_H
  const y = 0.5 - dEl / FOV_V
  return { x, y, inFrame: x > 0.02 && x < 0.98 && y > 0.02 && y < 0.98 }
}

/** Angular separation between two bearings, degrees. */
export function angularError(az: number, el: number, pan: number, tilt: number) {
  return Math.hypot(az - pan, el - tilt)
}

/** Move a commanded angle toward a goal, respecting the slew limit. */
export function slew(current: number, goal: number, dtSeconds: number) {
  const maxStep = SLEW_MAX_DEG_S * dtSeconds
  const delta = goal - current
  if (Math.abs(delta) <= maxStep) return goal
  return current + Math.sign(delta) * maxStep
}
