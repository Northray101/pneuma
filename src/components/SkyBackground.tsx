// Drop your cloud video at public/bg.mp4 — it will be served at /pneuma/bg.mp4.
// The CSS cloud animation plays underneath as a fallback while the video loads.

const clouds = [
  { w: 260, h: 72, top: '6%',  dur: 45, delay:   0, op: 0.82 },
  { w: 380, h: 95, top: '16%', dur: 62, delay: -22, op: 0.78 },
  { w: 180, h: 52, top: '28%', dur: 36, delay:  -9, op: 0.70 },
  { w: 310, h: 82, top: '40%', dur: 54, delay: -38, op: 0.66 },
  { w: 220, h: 65, top: '52%', dur: 41, delay: -15, op: 0.60 },
  { w: 160, h: 48, top: '62%', dur: 33, delay: -28, op: 0.56 },
  { w: 290, h: 78, top: '11%', dur: 58, delay: -44, op: 0.80 },
  { w: 140, h: 44, top: '72%', dur: 30, delay:  -5, op: 0.50 },
  { w: 200, h: 60, top: '22%', dur: 39, delay: -18, op: 0.74 },
  { w: 340, h: 88, top: '46%', dur: 66, delay: -51, op: 0.58 },
]

export default function SkyBackground() {
  return (
    <>
      <style>{`
        .sky-root {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background: linear-gradient(180deg,#7EC8E3 0%,#A9D8EA 35%,#C6E8F2 65%,#E2F3F9 100%);
        }
        .sky-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cloud {
          position: absolute;
          left: -440px;
          background: rgba(255,255,255,0.88);
          border-radius: 9999px;
          animation: drift linear infinite;
          box-shadow: 0 8px 32px rgba(180,220,255,0.50);
        }
        .cloud::before {
          content: '';
          position: absolute;
          background: rgba(255,255,255,0.88);
          border-radius: 50%;
          width: 44%;
          height: 115%;
          top: -42%;
          left: 14%;
        }
        .cloud::after {
          content: '';
          position: absolute;
          background: rgba(255,255,255,0.88);
          border-radius: 50%;
          width: 30%;
          height: 88%;
          top: -28%;
          left: 52%;
        }
        @keyframes drift {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(100vw + 460px)); }
        }
      `}</style>

      <div className="sky-root">
        {/* CSS cloud fallback — visible while video loads or if no file yet */}
        {clouds.map((c, i) => (
          <div
            key={i}
            className="cloud"
            style={{
              width: c.w,
              height: c.h,
              top: c.top,
              opacity: c.op,
              animationDuration: `${c.dur}s`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}

        {/* Video background — place bg.mp4 in /public and it shows up here */}
        <video
          className="sky-video"
          src="bg.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
    </>
  )
}
