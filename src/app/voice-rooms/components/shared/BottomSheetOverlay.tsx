'use client';

import { motion, AnimatePresence } from 'framer-motion';

/**
 * BottomSheetOverlay — Exact React port of TUILiveKit Drawer.vue
 *
 * .drawer-mask:  fixed inset-0, bg rgba(0,0,0,0.4), z-index prop, flex align-end
 * .drawer-panel: fixed bottom-0, bg #22262E, radius 12px, w-full,
 *                transition transform 0.3s cubic-bezier(.4,0,.2,1)
 * .drawer-header: 48px height, 17px font-weight 500, color #fff
 * .drawer-content: flex-1, overflow-y auto, padding 16px, color #fff
 */

interface BottomSheetOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  height?: string;
  zIndex?: number;
  children: React.ReactNode;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      transform: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
      opacity: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      transform: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
      opacity: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
  },
};

export default function BottomSheetOverlay({
  isOpen,
  onClose,
  title,
  height = '60%',
  zIndex = 1000,
  children,
}: BottomSheetOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── .drawer-mask ── */}
          <motion.div
            key="drawer-mask"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 flex items-end justify-center"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex,
            }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* ── .drawer-panel ── */}
          <motion.div
            key="drawer-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 left-0 right-0 flex flex-col box-border"
            style={{
              height,
              background: '#22262E',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
              maxWidth: '100vw',
              zIndex: zIndex + 1,
              padding: 0,
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            dir="rtl"
          >
            {/* ── .drawer-header (48px) ── */}
            {title && (
              <div
                className="flex items-center shrink-0 box-border relative"
                style={{
                  height: 48,
                  borderTopLeftRadius: '12px',
                  borderTopRightRadius: '12px',
                }}
              >
                <h2
                  className="flex-1 text-center truncate select-none leading-[48px]"
                  style={{
                    fontSize: 17,
                    fontWeight: 500,
                    color: '#fff',
                    marginRight: 48, // space for back button
                  }}
                >
                  {title}
                </h2>
              </div>
            )}

            {/* ── .drawer-content ── */}
            <div
              className="flex-1 overflow-y-auto"
              style={{
                padding: 16,
                color: '#fff',
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
