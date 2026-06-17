import { LoginForm } from '../components/auth/LoginForm'

export function Login() {
  return (
    <div className="flex min-h-screen bg-zinc-950 overflow-hidden">

      {/* Left panel — form pinned to top */}
      <div className="relative z-10 flex w-[380px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 px-10 pt-14 pb-12 min-h-screen">
        <h1 className="mb-1 text-2xl font-semibold text-white">DapplePot</h1>
        <p className="mb-8 text-sm text-zinc-400">Sign in to your account</p>
        <LoginForm />
      </div>

      {/* Right panel */}
      <div className="relative flex-1 overflow-hidden bg-zinc-950">

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Right-side gradient: smooth bottom-to-top fade */}
            <linearGradient id="grad-right" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%"   stopColor="#a1a1aa" stopOpacity="0.42" />
              <stop offset="18%"  stopColor="#a1a1aa" stopOpacity="0.32" />
              <stop offset="38%"  stopColor="#71717a" stopOpacity="0.18" />
              <stop offset="60%"  stopColor="#3f3f46" stopOpacity="0.07" />
              <stop offset="82%"  stopColor="#09090b" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
            </linearGradient>

            {/* Clip: region to the right of the curve */}
            <clipPath id="clip-right">
              <path d="M660,1010 L660,650 Q660,560 520,553 L490,550 Q450,548 450,490 L450,240 L1000,240 L1000,1010 Z" />
            </clipPath>

            {/* Curve stroke: bright at bottom, fades out at top */}
            <linearGradient id="curve-fade" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.65" />
              <stop offset="55%"  stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="85%"  stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>


            {/* Radial gradient for emblem spokes — brighter at hub, fades to tips */}
            <radialGradient id="spoke-grad" cx="0" cy="0" r="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="white" stopOpacity="0.28" />
              <stop offset="35%"  stopColor="white" stopOpacity="0.16" />
              <stop offset="100%" stopColor="white" stopOpacity="0.04" />
            </radialGradient>

            {/* Grain filter */}
            <filter id="grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>

          {/* Gradient fill — right of curve */}
          <rect width="1000" height="1000" fill="url(#grad-right)" clipPath="url(#clip-right)" />

          {/* Geometric radial emblem — single path so overlapping regions don't stack opacity */}
          <g transform="translate(160, 760)">
            <path
              d="M-9,0 L9,0 L16,-108 L13,-116 L-13,-116 L-16,-108Z M-4.5,-7.8 L4.5,7.8 L101.5,-40.1 L107,-46.7 L94,-69.3 L85.5,-67.9Z M4.5,-7.8 L-4.5,7.8 L85.5,67.9 L94,69.3 L107,46.7 L101.5,40.1Z M9,0 L-9,0 L-16,108 L-13,116 L13,116 L16,108Z M4.5,7.8 L-4.5,-7.8 L-101.5,40.1 L-107,46.7 L-94,69.3 L-85.5,67.9Z M-4.5,7.8 L4.5,-7.8 L-85.5,-67.9 L-94,-69.3 L-107,-46.7 L-101.5,-40.1Z"
              fill="white"
              fillOpacity={0.11}
              fillRule="nonzero"
            />
          </g>

          {/* Curve divider */}
          <path
            d="M660,1010 L660,650 Q660,560 520,553 L490,550 Q450,548 450,490 L450,240"
            stroke="url(#curve-fade)"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Grain on top */}
          <rect width="100%" height="100%" filter="url(#grain)" opacity="0.16" />
        </svg>

        {/* Ghost watermark — full screen height, right edge */}
        <div
          className="absolute pointer-events-none select-none"
          style={{
            width: '100vh',
            height: '18vh',
            right: '-41vh',
            top: '50%',
            transform: 'translateY(-50%) rotate(-90deg)',
          }}
        >
          <span
            className="block w-full text-center font-bold text-white/[0.13] whitespace-nowrap"
            style={{
              fontSize: '18vh',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: 1,
            }}
          >
            DapplePot
          </span>
        </div>

      </div>

    </div>
  )
}
