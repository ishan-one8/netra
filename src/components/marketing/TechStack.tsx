import { Label } from '../system'

const STACK = [
  {
    name: 'Python',
    role: 'Reference pipeline',
    detail: 'Reference implementation of the whole pipeline.',
  },
  {
    name: 'OpenCV',
    role: 'Computer vision',
    detail: 'Thresholding, blobs, measurement extraction.',
  },
  {
    name: 'NumPy',
    role: 'Numerical core',
    detail: 'The matrix work behind filtering and the sim.',
  },
  {
    name: 'PyTorch',
    role: 'Detection model',
    detail: 'The CNN detector, trained on frames this sim makes.',
  },
  {
    name: 'Kalman filtering',
    role: 'State estimation',
    detail: 'Constant-velocity fusion of noisy detections.',
  },
  {
    name: 'React · TypeScript · Canvas',
    role: 'This console',
    detail: 'This console. Real time, in your browser.',
  },
] as const

export function TechStack() {
  return (
    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
      {STACK.map((s) => (
        <div key={s.name} className="glass-card glass-card-hover flex flex-col gap-8 rounded-md p-16">
          <Label tone="beam">{s.role}</Label>
          <h3 className="text-small font-medium text-ink">{s.name}</h3>
          <p className="text-caption text-ink-muted">{s.detail}</p>
        </div>
      ))}
    </div>
  )
}
