'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ban, Clock } from 'lucide-react';

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

export default function KickDurationDialog({
  isOpen, onClose, onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
}) {
  const [duration, setDuration] = useState(5);
  const presets = [
    { label: '٥ دقائق', value: 5, desc: 'طرد قصير' },
    { label: '١٥ دقيقة', value: 15, desc: 'ربع ساعة' },
    { label: '٣٠ دقيقة', value: 30, desc: 'نصف ساعة' },
    { label: 'ساعة', value: 60, desc: 'ستون دقيقة' },
    { label: '٢٤ ساعة', value: 1440, desc: 'يوم كامل' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="kick-overlay"
            variants={dialogOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}
            onClick={onClose}
          />
          <motion.div
            key="kick-panel"
            variants={dialogPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed z-[110] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-[360px] max-h-[80vh] overflow-y-auto"
            style={{
              background: '#1F2024',
              border: '1px solid #48494F',
              borderRadius: '16px',
              boxShadow: '0 8px 18px 0 rgba(0,0,0,0.06), 0 2px 6px 0 rgba(0,0,0,0.06), 0 0 40px rgba(0,0,0,0.3)',
            }}
            dir="rtl"
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-3">
              <h2 className="text-[17px] font-bold text-white text-center">مدة الطرد المؤقت</h2>
              <p className="text-[12px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                اختر مدة الطرد من الغرفة
              </p>
            </div>

            {/* Duration options */}
            <div className="px-5 pb-4 space-y-2">
              {presets.map((p) => {
                const isActive = duration === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() => setDuration(p.value)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
                    style={{
                      background: isActive ? '#243047' : '#3a3a3a',
                      border: `2px solid ${isActive ? '#2B6AD6' : 'transparent'}`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                      style={{ background: isActive ? 'rgba(43,106,214,0.2)' : 'rgba(255,255,255,0.06)' }}
                    >
                      <Clock className="w-[18px] h-[18px]" style={{ color: isActive ? '#5a9bf6' : 'rgba(255,255,255,0.4)' }} />
                    </div>
                    <div className="text-right flex-1">
                      <div
                        className="text-[14px] font-semibold"
                        style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.7)' }}
                      >
                        {p.label}
                      </div>
                      <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {p.desc}
                      </div>
                    </div>
                    {/* Radio indicator */}
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                      style={{
                        border: `2px solid ${isActive ? '#2B6AD6' : 'rgba(255,255,255,0.15)'}`,
                      }}
                    >
                      {isActive && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#2B6AD6' }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                إلغاء
              </button>
              <button
                onClick={() => onConfirm(duration)}
                className="flex-1 h-10 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.25)',
                }}
              >
                <Ban className="w-4 h-4" />
                طرد
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
