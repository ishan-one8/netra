export type TrackState = 'SEARCHING' | 'ACQUIRED' | 'LOCKED' | 'TRACK_LOST'

export type LogSeverity = 'info' | 'signal' | 'lock' | 'fault'

export type LogEntry = {
  id: number
  /** Mission-elapsed timestamp, already formatted. */
  t: string
  severity: LogSeverity
  message: string
}

/**
 * Everything the console reports. Angles are degrees in the platform frame;
 * error is carried in both the sensor's own unit (pixels) and the engineering
 * unit a pointing budget is written in (milliradians).
 */
export type Telemetry = {
  /** Commanded gimbal angles. */
  pan: number
  tilt: number
  /** Boresight-to-target angular error. */
  errorPx: number
  errorMrad: number
  peakErrorMrad: number
  /** Detector and estimator health. */
  confidence: number
  snr: number
  /** Loop behaviour. */
  frame: number
  fps: number
  processingMs: number
  /** Mission counters. */
  lockRetention: number
  acquisitionS: number
  reacquisitionS: number
  candidates: number
}
