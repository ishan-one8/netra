export type TrackState = 'SEARCHING' | 'ACQUIRED' | 'LOCKED' | 'TRACK_LOST'

export type LogSeverity = 'info' | 'signal' | 'lock' | 'fault'

export type LogEntry = {
  id: number
  /** Mission-elapsed timestamp, already formatted mono-safe. */
  t: string
  severity: LogSeverity
  message: string
}

export type Telemetry = {
  azimuth: number
  elevation: number
  range: number
  confidence: number
  latency: number
  frame: number
  rmsError: number
  snr: number
}
