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
        @keyframes speakRing {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes speakGlow {
          0%, 100% { box-shadow: 0 0 3px 1px rgba(34,197,94,0.3); }
          50% { box-shadow: 0 0 6px 2px rgba(34,197,94,0.5); }
        }
        .animate-speak-ring { animation: speakRing 1s infinite; }
        .animate-speak-glow { animation: speakGlow 2s ease-in-out infinite; }
        .animate-live-pulse { animation: livePulse 1.8s infinite; }
        .animate-fade-up { animation: fadeUp 0.3s ease; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
