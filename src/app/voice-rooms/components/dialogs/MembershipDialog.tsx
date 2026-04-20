'use client';

import { motion, AnimatePresence } from 'framer-motion';

const dialogOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const dialogPanel = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 28, stiffness: 320 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 20,
    transition: { duration: 0.2 },
  },
};

export default function MembershipDialog({
  isOpen, onClose, onAccept, onReject, pendingRole,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  pendingRole: string;
}) {
  const roleLabel = pendingRole === 'member' ? 'عضو' : pendingRole === 'admin' ? 'مشرف' : pendingRole === 'coowner' ? 'نائب' : pendingRole;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="membership-overlay"
            variants={dialogOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}
            onClick={onClose}
          />
          <motion.div
            key="membership-panel"
            variants={dialogPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed z-[110] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-48px)] max-w-[340px]"
            style={{
              background: '#1F2024',
              border: '1px solid #48494F',
              borderRadius: '16px',
              boxShadow: '0 8px 18px 0 rgba(0,0,0,0.06), 0 2px 6px 0 rgba(0,0,0,0.06), 0 0 40px rgba(0,0,0,0.3)',
            }}
            dir="rtl"
          >
            {/* Icon */}
            <div className="flex justify-center pt-6 pb-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', boxShadow: '0 4px 16px rgba(108,99,255,0.3)' }}
              >
                <span className="text-2xl">⭐</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center px-6 pb-5">
              <div className="text-[17px] font-bold text-white mb-1.5">دعوة للانضمام!</div>
              <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                تمت دعوتك لتصبح{' '}
                <span className="font-bold" style={{ color: '#a78bfa' }}>{roleLabel}</span>
                {' '}في هذه الغرفة
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={onReject}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                رفض
              </button>
              <button
                onClick={onAccept}
                className="flex-1 h-10 rounded-xl text-[13px] font-bold text-white transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  boxShadow: '0 4px 16px rgba(34,197,94,0.25)',
                }}
              >
                قبول
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
