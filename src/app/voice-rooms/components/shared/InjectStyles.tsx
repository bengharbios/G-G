'use client';

export default function InjectStyles() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .voice-room-root { font-family: 'Cairo', sans-serif; }

        /* ── Speaking / live animations ── */
        @keyframes speakRing {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
        }
        @keyframes speakGlow {
          0%, 100% { box-shadow: 0 0 4px 2px rgba(34,197,94,0.25); }
          50% { box-shadow: 0 0 8px 3px rgba(34,197,94,0.5); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Audio level bar bounce (TUILiveKit AudioIcon inspired) ── */
        @keyframes audioBar1 {
          0%, 100% { height: 2px; }
          50% { height: 6px; }
        }
        @keyframes audioBar2 {
          0%, 100% { height: 4px; }
          50% { height: 10px; }
        }
        @keyframes audioBar3 {
          0%, 100% { height: 6px; }
          50% { height: 14px; }
        }
        @keyframes audioBar4 {
          0%, 100% { height: 4px; }
          50% { height: 11px; }
        }
        @keyframes audioBar5 {
          0%, 100% { height: 2px; }
          50% { height: 7px; }
        }

        /* ── Empty seat pulse ── */
        @keyframes emptyPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.04); }
        }

        /* ── Seat hover glow ── */
        @keyframes hoverGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(108,99,255,0); }
          50% { box-shadow: 0 0 12px 2px rgba(108,99,255,0.15); }
        }

        .animate-speak-ring { animation: speakRing 1s infinite; }
        .animate-speak-glow { animation: speakGlow 2s ease-in-out infinite; }
        .animate-live-pulse { animation: livePulse 1.8s infinite; }
        .animate-fade-up { animation: fadeUp 0.3s ease; }
        .animate-empty-pulse { animation: emptyPulse 2.5s ease-in-out infinite; }
        .animate-hover-glow { animation: hoverGlow 1.5s ease-in-out infinite; }

        /* Audio bar animations with staggered delays */
        .audio-bar-1 { animation: audioBar1 0.6s ease-in-out infinite; }
        .audio-bar-2 { animation: audioBar2 0.6s ease-in-out infinite 0.08s; }
        .audio-bar-3 { animation: audioBar3 0.6s ease-in-out infinite 0.16s; }
        .audio-bar-4 { animation: audioBar4 0.6s ease-in-out infinite 0.24s; }
        .audio-bar-5 { animation: audioBar5 0.6s ease-in-out infinite 0.32s; }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
