'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Clock, Target, Tag, Users, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ALL_CATEGORIES } from '@/lib/shifarat-words';

interface GameSetupProps {
  onStart: (settings: {
    team1Name: string;
    team2Name: string;
    timer: number;
    targetScore: number;
    categories: string[];
  }) => void;
  onBack: () => void;
}

const TIMER_OPTIONS = [20, 30, 45, 60, 90, 120];
const SCORE_OPTIONS = [5, 8, 10, 15, 20];

export default function GameSetup({ onStart, onBack }: GameSetupProps) {
  const [team1Name, setTeam1Name] = useState('الفريق الأزرق');
  const [team2Name, setTeam2Name] = useState('الفريق الأخضر');
  const [timer, setTimer] = useState(60);
  const [targetScore, setTargetScore] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    ALL_CATEGORIES.map((c) => c.id)
  );
  const [error, setError] = useState('');

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        if (prev.length <= 1) {
          setError('يجب اختيار فئة واحدة على الأقل');
          return prev;
        }
        setError('');
        return prev.filter((id) => id !== catId);
      }
      setError('');
      return [...prev, catId];
    });
  };

  const toggleAllCategories = () => {
    if (selectedCategories.length === ALL_CATEGORIES.length) {
      setError('');
      setSelectedCategories([]);
    } else {
      setError('');
      setSelectedCategories(ALL_CATEGORIES.map((c) => c.id));
    }
  };

  const handleStart = () => {
    if (!team1Name.trim() || !team2Name.trim()) {
      setError('يجب إدخال أسماء الفريقين');
      return;
    }
    if (team1Name.trim() === team2Name.trim()) {
      setError('يجب أن تكون أسماء الفريقين مختلفة');
      return;
    }
    if (selectedCategories.length === 0) {
      setError('يجب اختيار فئة واحدة على الأقل');
      return;
    }
    setError('');
    onStart({
      team1Name: team1Name.trim(),
      team2Name: team2Name.trim(),
      timer,
      targetScore,
      categories: selectedCategories,
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-6 px-3 sm:px-4"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      }}
    >
      {/* Decorative dots */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              backgroundColor: `rgba(16, 185, 129, ${Math.random() * 0.2 + 0.05})`,
              animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-auto space-y-4"
      >
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
            🎯 إعداد اللعبة
          </h1>
          <p className="text-xs text-slate-400">العب مع أصحابك على جهاز واحد</p>
        </div>

        {/* Back Button */}
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-slate-500 hover:text-slate-300 gap-1 text-xs -mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </Button>

        {/* Team Names */}
        <Card
          className="border-slate-700/50"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            borderColor: 'rgba(51, 65, 85, 0.5)',
          }}
        >
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-200">أسماء الفرق</h2>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">الفريق الأول</label>
              <Input
                value={team1Name}
                onChange={(e) => { setTeam1Name(e.target.value); setError(''); }}
                placeholder="اسم الفريق الأول..."
                className="bg-slate-800/50 border-slate-600/50 text-slate-200 placeholder:text-slate-500 text-right h-11"
                dir="rtl"
                maxLength={20}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">الفريق الثاني</label>
              <Input
                value={team2Name}
                onChange={(e) => { setTeam2Name(e.target.value); setError(''); }}
                placeholder="اسم الفريق الثاني..."
                className="bg-slate-800/50 border-slate-600/50 text-slate-200 placeholder:text-slate-500 text-right h-11"
                dir="rtl"
                maxLength={20}
              />
            </div>
          </CardContent>
        </Card>

        {/* Timer */}
        <Card
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            borderColor: 'rgba(51, 65, 85, 0.5)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            borderRadius: '1rem',
          }}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-200">الوقت (بالثانية)</h2>
              <span className="text-xs text-slate-500 mr-auto">{timer} ثانية</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TIMER_OPTIONS.map((t) => (
                <motion.button
                  key={t}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setTimer(t)}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all min-w-[48px] min-h-[44px]"
                  style={{
                    background: timer === t
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1))'
                      : 'rgba(30, 41, 59, 0.8)',
                    border: timer === t
                      ? '2px solid rgba(16, 185, 129, 0.5)'
                      : '2px solid rgba(51, 65, 85, 0.3)',
                    color: timer === t ? '#6ee7b7' : '#94a3b8',
                  }}
                >
                  {t}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Target Score */}
        <Card
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            borderRadius: '1rem',
          }}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-200">الهدف</h2>
              <span className="text-xs text-slate-500 mr-auto">{targetScore} نقطة</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SCORE_OPTIONS.map((s) => (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setTargetScore(s)}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all min-w-[48px] min-h-[44px]"
                  style={{
                    background: targetScore === s
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1))'
                      : 'rgba(30, 41, 59, 0.8)',
                    border: targetScore === s
                      ? '2px solid rgba(16, 185, 129, 0.5)'
                      : '2px solid rgba(51, 65, 85, 0.3)',
                    color: targetScore === s ? '#6ee7b7' : '#94a3b8',
                  }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            borderRadius: '1rem',
          }}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-200">الفئات</h2>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={toggleAllCategories}
                className="mr-auto text-[10px] px-2 py-1 rounded-lg text-emerald-400 font-bold"
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                {selectedCategories.length === ALL_CATEGORIES.length ? 'إلغاء الكل' : 'اختر الكل'}
              </motion.button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_CATEGORIES.map((cat, i) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px]"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1))'
                        : 'rgba(30, 41, 59, 0.8)',
                      border: isSelected
                        ? '2px solid rgba(16, 185, 129, 0.5)'
                        : '2px solid rgba(51, 65, 85, 0.3)',
                      color: isSelected ? '#6ee7b7' : '#94a3b8',
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span className="truncate">{cat.name}</span>
                    {isSelected && <Check className="w-3 h-3 mr-auto text-emerald-400" />}
                  </motion.button>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-500 mt-2 text-center">
              {selectedCategories.length} من {ALL_CATEGORIES.length} فئات محددة
            </p>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-xs text-center"
          >
            ⚠️ {error}
          </motion.p>
        )}

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleStart}
            className="w-full font-bold text-base sm:text-lg py-6 transition-all duration-300 text-white"
            style={{
              background: 'linear-gradient(to left, #059669, #10b981)',
              borderRadius: '1rem',
              minHeight: '52px',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Play className="w-5 h-5 ml-2" />
            ابدأ اللعبة 🔥
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
