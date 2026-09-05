import { Label } from '../system'

const STACK = [
  {
    name: 'Python',
    role: 'Reference pipeline',
    detail: 'The algorithm reference implementation — image processing, estimation and control.',
  },
  {
    name: 'OpenCV',
    role: 'Computer vision',
    detail: 'Thresholding, connected components and measurement extraction on real frames.',
  },
  {
    name: 'NumPy',
    role: 'Numerical core',
    detail: 'Matrix work behind detection statistics, filtering and the simulation itself.',
  },
  {
    name: 'PyTorch',
    role: 'Detection model',
    detail: 'The CNN beacon detector, trained on labelled frames this simulator generates.',
  },
  {
    name: 'Kalman filtering',
    role: 'State estimation',
    detail: 'Constant-velocity model fusing noisy detections into position and velocity.',
  },
  {
    name: 'React · TypeScript · Canvas',
    role: 'This console',
    detail: 'The interactive loop you are reading runs entirely in the browser, in real time.',
  },
] as const

export function TechStack() {
  return (
    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
      {STACK.map((s) => (
        <div key={s.name} className="card-interactive flex flex-col gap-8 rounded-md border border-rule bg-surface p-16">
          <Label tone="beam">{s.role}</Label>
          <h3 className="text-small font-medium text-ink">{s.name}</h3>
          <p className="text-caption text-ink-muted">{s.detail}</p>
        </div>
      ))}
    </div>
  )
}
