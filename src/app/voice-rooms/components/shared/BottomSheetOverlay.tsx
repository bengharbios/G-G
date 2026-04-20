'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function BottomSheetOverlay({ isOpen, onClose, children }: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/55 z-[80]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-[#181c2e] rounded-t-[22px] border-t border-[rgba(108,99,255,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-9 h-1 bg-[rgba(255,255,255,0.15)] rounded-full mx-auto mt-3 mb-3.5" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
