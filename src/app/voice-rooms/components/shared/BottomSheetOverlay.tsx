'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  height?: string;
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
  children,
}: BottomSheetOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-screen mask */}
          <motion.div
            key="bottom-sheet-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[80]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sliding panel — TUILiveKit Drawer style */}
          <motion.div
            key="bottom-sheet-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 left-0 right-0 z-[90] flex flex-col"
            style={{
              height,
              background: '#22262E',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            dir="rtl"
          >
            {/* Drag handle indicator */}
            <div className="flex justify-center pt-2 pb-1">
              <div
                className="w-9 h-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              />
            </div>

            {/* Header — 48px, centered title */}
            {title && (
              <div
                className="relative flex items-center justify-center shrink-0"
                style={{ height: 48 }}
              >
                <h2
                  className="text-center select-none"
                  style={{
                    fontSize: 17,
                    fontWeight: 500,
                    color: '#fff',
                  }}
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full w-8 h-8 transition-all duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  aria-label="إغلاق"
                >
                  <X size={20} color="rgba(255,255,255,0.7)" />
                </button>
              </div>
            )}

            {/* Scrollable content area */}
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
