// Fullscreen abstract light field. Reads --mh/--ms/--ml (all UNITLESS numbers:
// hue deg, sat %, light %) from an ancestor; the page tweens those vars so the
// hue drifts without re-rendering React. No linear gradients — a near-flat
// tint, one very soft ambient light pool, and a faint procedural grain.

export default function HueField() {
  return (
    <>
      <style>{`
        .huefield {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background:
            radial-gradient(
              130% 100% at 50% 18%,
              hsl(calc(var(--mh,32) - 14) calc(var(--ms,22) * 0.7%) calc(var(--ml,94) * 1%)) 0%,
              hsl(var(--mh,32) calc(var(--ms,22) * 1%) calc(var(--ml,94) * 1%)) 46%,
              hsl(calc(var(--mh,32) + 10) calc(var(--ms,22) * 1.05%) calc(var(--ml,94) * 0.985%)) 100%
            );
        }
        .huefield-glow {
          position: absolute;
          left: 50%;
          top: 30%;
          width: 78vmin;
          height: 78vmin;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            hsla(calc(var(--mh,32) + 24), calc(var(--ms,22) * 1.3%), 86%, 0.5) 0%,
            hsla(var(--mh,32), calc(var(--ms,22) * 1%), 90%, 0) 70%
          );
          filter: blur(40px);
        }
        .huefield-grain {
          position: absolute;
          inset: 0;
          opacity: 0.5;
          mix-blend-mode: soft-light;
        }
      `}</style>

      <div className="huefield">
        <div className="huefield-glow" />
        <svg className="huefield-grain" xmlns="http://www.w3.org/2000/svg">
          <filter id="hfNoise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves={2}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.045" />
            </feComponentTransfer>
          </filter>
          <rect width="100%" height="100%" filter="url(#hfNoise)" />
        </svg>
      </div>
    </>
  )
}
