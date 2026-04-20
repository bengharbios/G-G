'use client';

import { motion, AnimatePresence } from 'framer-motion';

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[110] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] bg-[#181c2e] border border-[rgba(108,99,255,0.3)] rounded-2xl p-5 shadow-2xl"
            dir="rtl"
          >
            {/* Icon */}
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-4">
              <div className="text-[16px] font-bold text-[#f0f0f8] mb-1">دعوة للانضمام!</div>
              <div className="text-[12px] text-[#9ca3c4]">تمت دعوتك لتصبح <span className="text-[#a78bfa] font-bold">{roleLabel}</span> في هذه الغرفة</div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={onAccept}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-l from-[#22c55e] to-[#16a34a] text-white text-[13px] font-bold active:scale-[0.97] transition-transform"
              >
                قبول
              </button>
              <button
                onClick={onReject}
                className="flex-1 py-2.5 rounded-xl bg-[#1c2035] border border-[rgba(255,255,255,0.07)] text-[#9ca3c4] text-[13px] font-semibold hover:bg-[#232843] active:scale-[0.97] transition-transform"
              >
                رفض
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
