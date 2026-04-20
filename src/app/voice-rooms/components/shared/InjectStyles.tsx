'use client';

/**
 * InjectStyles — Global CSS injection matching TUILiveKit styles
 *
 * Includes:
 * - Cairo font
 * - TUILiveKit scrollbar (@mixin scrollbar from index.scss)
 * - Speaking / live animations
 * - Audio level bar bounce (TUILiveKit AudioIcon)
 * - Empty seat pulse
 * - Seat hover glow
 * - Notification slide-in animation
 */

export default function InjectStyles() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .voice-room-root { font-family: 'Cairo', sans-serif; }

        /* ═══ TUILiveKit Scrollbar (exact from @mixin scrollbar) ═══ */
        .tui-scrollbar::-webkit-scrollbar {
          width: 6px;
          background: transparent;
        }
        .tui-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .tui-scrollbar::-webkit-scrollbar-thumb {
          background: var(--uikit-color-gray-3, #58585A);
          border-radius: 3px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .tui-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--uikit-color-gray-3, #58585A);
        }

        /* ═══ Speaking / live animations ═══ */
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

        /* ═══ Audio level bar bounce (TUILiveKit AudioIcon .audio-level) ═══ */
        .audio-level-bar {
          width: 100%;
          background-color: var(--text-color-success, #22c55e);
          transition: height 0.2s;
        }

        /* ═══ Audio bar animations with staggered delays ═══ */
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
        .audio-bar-1 { animation: audioBar1 0.6s ease-in-out infinite; }
        .audio-bar-2 { animation: audioBar2 0.6s ease-in-out infinite 0.08s; }
        .audio-bar-3 { animation: audioBar3 0.6s ease-in-out infinite 0.16s; }
        .audio-bar-4 { animation: audioBar4 0.6s ease-in-out infinite 0.24s; }
        .audio-bar-5 { animation: audioBar5 0.6s ease-in-out infinite 0.32s; }

        /* ═══ Empty seat pulse ═══ */
        @keyframes emptyPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.04); }
        }

        /* ═══ Seat hover glow ═══ */
        @keyframes hoverGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(108,99,255,0); }
          50% { box-shadow: 0 0 12px 2px rgba(108,99,255,0.15); }
        }

        /* ═══ TUILiveKit Notification animation ═══ */
        @keyframes notificationSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes notificationSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }

        /* ═══ Loading spinner (TUILiveKit) ═══ */
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ═══ Icon hover animation (TUILiveKit arrow-icon) ═══ */
        .tui-icon-hover {
          transition: transform 0.2s ease-in-out;
        }
        .tui-icon-hover:hover {
          color: var(--text-color-link-hover, #4B8AE6);
        }

        /* ═══ TUILiveKit icon button container (custom-icon-container) ═══ */
        .tui-icon-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-width: 56px;
          width: auto;
          height: 56px;
          cursor: pointer;
          color: var(--text-color-primary, rgba(255,255,255,0.90));
          border-radius: 12px;
          position: relative;
          transition: all 0.2s ease;
        }
        .tui-icon-btn:hover {
          box-shadow: 0 0 10px 0 rgba(0,0,0,0.3);
          color: var(--text-color-link-hover, #4B8AE6);
        }
        .tui-icon-btn.disabled {
          cursor: not-allowed;
          opacity: 0.5;
          color: var(--text-color-tertiary, rgba(255,255,255,0.35));
        }

        /* ═══ TUILiveKit divider (dividing-line mixin) ═══ */
        .tui-divider-bottom {
          padding-bottom: 16px;
          border-bottom: 1px solid var(--stroke-color-primary, rgba(255,255,255,0.08));
        }
        .tui-divider-top {
          padding-top: 16px;
          border-top: 1px solid var(--stroke-color-primary, rgba(255,255,255,0.08));
        }

        /* ═══ Card title (TUILiveKit card-title) ═══ */
        .tui-card-title {
          font-size: 16px;
          font-weight: 600;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--stroke-color-primary, rgba(255,255,255,0.08));
        }

        /* ═══ Ellipsis (TUILiveKit @mixin ellipsis) ═══ */
        .tui-ellipsis {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ═══ Utility classes ═══ */
        .animate-speak-ring { animation: speakRing 1s infinite; }
        .animate-speak-glow { animation: speakGlow 2s ease-in-out infinite; }
        .animate-live-pulse { animation: livePulse 1.8s infinite; }
        .animate-fade-up { animation: fadeUp 0.3s ease; }
        .animate-empty-pulse { animation: emptyPulse 2.5s ease-in-out infinite; }
        .animate-hover-glow { animation: hoverGlow 1.5s ease-in-out infinite; }
        .animate-rotate { animation: rotate 1s linear infinite; }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
