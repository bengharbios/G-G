'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

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

export default function PasswordDialog({
  isOpen, onClose, onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}) {
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  const inputStyle: React.CSSProperties = {
    background: '#3a3a3a',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.9)',
    borderRadius: '10px',
    height: 44,
    fontSize: 15,
    outline: 'none',
    width: '100%',
    padding: '0 44px 0 12px',
    textAlign: 'center',
    letterSpacing: '2px',
    transition: 'border-color 200ms ease',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="pw-overlay"
            variants={dialogOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}
            onClick={onClose}
          />
          <motion.div
            key="pw-panel"
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
            {/* Header */}
            <div className="px-6 pt-5 pb-2">
              <h2 className="text-[17px] font-bold text-white text-center">كلمة المرور</h2>
              <p className="text-[12px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                أدخل كلمة مرور الغرفة للمتابعة
              </p>
            </div>

            {/* Input */}
            <div className="px-5 pt-2 pb-4">
              <div className="relative">
                <input
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••"
                  style={inputStyle}
                  type={showPw ? 'text' : 'password'}
                  onKeyDown={(e) => e.key === 'Enter' && pw && onSubmit(pw)}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#2B6AD6')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-white/10"
                >
                  {showPw
                    ? <EyeOff className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                    : <Eye className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  }
                </button>
              </div>
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
                onClick={() => pw && onSubmit(pw)}
                disabled={!pw}
                className="flex-1 h-10 rounded-xl text-[13px] font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                style={{
                  background: pw ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#3a3a3a',
                  boxShadow: pw ? '0 4px 16px rgba(34,197,94,0.25)' : 'none',
                }}
              >
                دخول
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
