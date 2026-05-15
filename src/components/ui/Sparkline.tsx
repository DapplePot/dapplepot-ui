interface SparklineProps {
  data: number[]
  color: string
  height?: number
  id: string
}

export function Sparkline({ data, color, height = 36, id }: SparklineProps) {
  const nums = data.map(Number).filter(n => isFinite(n))

  if (nums.length < 2) {
    // Reserve the space so the card height never shifts when data arrives.
    return (
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        <line x1="0" y1={height / 2} x2="100" y2={height / 2} stroke={color} strokeWidth="1" strokeOpacity="0.2" strokeDasharray="3 3" />
      </svg>
    )
  }

  const W = 100
  const H = height
  const pad = 2
  const min = Math.max(0, Math.min(...nums) - pad)
  const max = Math.max(min + 1, Math.max(...nums) + pad)
  const range = max - min

  const pts = nums.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / (max - min)) * H,
  }))

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`
  const gradId = `spark-grad-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
