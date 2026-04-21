"use client";

export default function GradientButton() {
  const layers = [
    { delay: "0s", duration: "25s" },
    { delay: "0.15s", duration: "15.9s" },
    { delay: "0.53s", duration: "26.4s" },
    { delay: "0.45s", duration: "17.8s" },
    { delay: "1.6s", duration: "19.2s" },
    { delay: "1.6s", duration: "29.2s" },
    { delay: "1.6s", duration: "20.2s" },
  ];

  return (
    <div className="relative flex items-center justify-center overflow-hidden rounded-[32px] border-2 border-white px-10 py-4 font-semibold text-xl isolate">
      {/* glow light */}
      <div className="absolute w-[80%] h-6 bg-white/30 blur-md rounded-full animate-pulse" />

      {/* animated layers */}
      {layers.map((l, i) => (
        <div
          key={i}
          className="absolute left-[-160px] w-[500%] aspect-square rounded-full mix-blend-difference"
          style={{
            background:
              "radial-gradient(circle at 65% 180%, #ff00ff, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00aa, #ff8800)",
            animation: `spin ${l.duration} linear infinite`,
            animationDelay: l.delay,
          }}
        />
      ))}

      {/* button */}
      <button className="relative z-10 px-10 py-3 rounded-[32px] font-semibold tracking-widest text-black mix-blend-difference">
        Start
      </button>

      {/* overlay text */}
      <div className="absolute z-20 pointer-events-none tracking-widest text-white mix-blend-multiply">
        Connect
      </div>

      {/* animation */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
