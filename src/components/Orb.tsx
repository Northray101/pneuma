import { useEffect, useState } from 'react'

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'

// Liquid frosted-glass sphere. Frosting (backdrop-filter) and the liquid edge
// (SVG displacement) live on SEPARATE sibling nodes — Safari mishandles both
// on one node. Color comes from --mh/--ms/--ml on an ancestor.

function supportsBackdrop(): boolean {
  if (typeof CSS === 'undefined' || !CSS.supports) return true
  return (
    CSS.supports('backdrop-filter', 'blur(1px)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
  )
}

export default function Orb({ state }: { state: OrbState }) {
  const [frost, setFrost] = useState(true)
  useEffect(() => setFrost(supportsBackdrop()), [])

  return (
    <>
      <style>{`
        .orb {
          --breathe: 7s;
          --rim: 0.16;
          position: relative;
          width: clamp(220px, 42vmin, 420px);
          aspect-ratio: 1;
          border-radius: 50%;
          will-change: transform;
          animation: orbBreathe var(--breathe) ease-in-out infinite;
          transform: scale(var(--pulse, 1));
          transition: transform 600ms cubic-bezier(.22,.61,.36,1);
        }
        .orb.is-listening { --breathe: 3.6s; --rim: 0.26; }
        .orb.is-thinking  { --breathe: 2.4s; }
        .orb.is-speaking  { --breathe: 5s; }

        .orb-layer { position: absolute; inset: 0; border-radius: 50%; }

        /* 1 — frosting (no SVG filter on this node) */
        .orb-frost {
          backdrop-filter: blur(14px) saturate(1.35) brightness(1.04);
          -webkit-backdrop-filter: blur(14px) saturate(1.35) brightness(1.04);
          background: hsla(var(--mh,32), calc(var(--ms,22) * 1%), 100%, 0.10);
        }
        .orb-frost.no-bd {
          background: hsla(var(--mh,32), calc(var(--ms,22) * 1%), 97%, 0.78);
        }
        /* 2 — glass body: faint spherical light + mood tint */
        .orb-body {
          background:
            radial-gradient(circle at 36% 30%,
              rgba(255,255,255,0.55) 0%,
              rgba(255,255,255,0.12) 26%,
              rgba(255,255,255,0) 52%),
            radial-gradient(circle at 50% 50%,
              hsla(calc(var(--mh,32) + 8), calc(var(--ms,22) * 1%), 68%, 0.16) 0%,
              hsla(var(--mh,32), calc(var(--ms,22) * 1%), 72%, 0.04) 70%);
        }
        /* 3 — liquid inner caustic */
        .orb-caustic {
          filter: url(#orbCaustic);
          background: radial-gradient(circle at 50% 56%,
            rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%);
          mix-blend-mode: soft-light;
          opacity: 0.7;
        }
        /* 4 — liquid rim (only this node carries the displacement filter) */
        .orb-rim {
          filter: url(#orbDisplace);
          box-shadow:
            inset 0 0 60px rgba(255,255,255,0.5),
            inset 0 2px 4px rgba(255,255,255,0.7),
            0 0 90px hsla(var(--mh,32), calc(var(--ms,22) * 1%), 70%, var(--rim));
          border: 1px solid rgba(255,255,255,0.6);
          transition: box-shadow 900ms ease;
        }
        .orb.is-thinking .orb-rim { filter: url(#orbDisplaceActive); }

        @keyframes orbBreathe {
          0%, 100% { transform: scale(calc(var(--pulse,1) * 1)); }
          50%      { transform: scale(calc(var(--pulse,1) * 1.02)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .orb { animation: none; }
        }
      `}</style>

      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="orbDisplace" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.012"
            numOctaves={2}
            seed={7}
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="22s"
              repeatCount="indefinite"
              values="0.008 0.012; 0.011 0.009; 0.008 0.012"
              calcMode="spline"
              keyTimes="0;0.5;1"
              keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="22"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="orbDisplaceActive" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.009 0.013"
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="34" />
        </filter>
        <filter id="orbCaustic" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.018 0.02"
            numOctaves={2}
            seed={19}
            result="n2"
          >
            <animate
              attributeName="seed"
              dur="40s"
              repeatCount="indefinite"
              values="19;23;19"
              calcMode="spline"
              keyTimes="0;0.5;1"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n2" scale="14" />
        </filter>
      </svg>

      <div className={`orb is-${state}`}>
        <div className={`orb-layer orb-frost${frost ? '' : ' no-bd'}`} />
        <div className="orb-layer orb-body" />
        <div className="orb-layer orb-caustic" />
        <div className="orb-layer orb-rim" />
      </div>
    </>
  )
}
