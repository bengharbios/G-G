'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RIGHT_COL1, RIGHT_COL2, LEFT_COL1, LEFT_COL2,
  BOTTOM_ROW1, BOTTOM_ROW2, BOTTOM_ROW3,
  IMG_BASE, VS_BASE,
} from '@/lib/tobol-types';
import type { BoardButton } from '@/lib/tobol-types';

// ============================================================
// Types matching TobolRoomState from server
// ============================================================
interface TobolRoomData {
  code: string;
  hostName: string;
  redName: string;
  blueName: string;
  redScore: number;
  blueScore: number;
  currentTurn: 'red' | 'blue';
  clickedBtns: string[];
  lastAction: string | null;
  battleLog: Array<{ id: number; team: string; message: string; valueChange: number }>;
  modalData: { cardImg: string; points: number; team: string } | null;
  mainBgId: number;
  phase: string;
}

// ============================================================
// Confetti for spectator game over
// ============================================================
function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 4 + Math.random() * 8,
      rotate: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rotate + 720, opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Game Over Overlay for Spectators
// ============================================================
function SpectatorGameOver({ room }: { room: TobolRoomData }) {
  const winner = room.redScore > room.blueScore ? 'red' : room.blueScore > room.redScore ? 'blue' : 'draw';
  const winnerName = winner === 'red' ? room.redName : winner === 'blue' ? room.blueName : 'تعادل!';
  const scoreDiff = Math.abs(room.redScore - room.blueScore);

  const totalClicks = room.battleLog.length;
  const attacks = room.battleLog.filter(e => e.message.includes('هجوم'));
  const traps = room.battleLog.filter(e => e.message.includes('فخ'));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 tobol-bg" dir="rtl">
      {winner !== 'draw' && <Confetti />}

      <div className="relative z-10 w-full max-w-sm sm:max-w-lg mx-auto">
        {/* Winner Banner */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10 }}
          className="text-center mb-6"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl sm:text-8xl mb-3"
          >
            {winner === 'draw' ? '🤝' : '🏆'}
          </motion.div>
          <h1
            className={`text-3xl sm:text-4xl font-black mb-2 ${
              winner === 'red'
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-300'
                : winner === 'blue'
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300'
            }`}
          >
            {winner === 'draw' ? 'تعادل! 🤝' : `${winnerName} فاز! 🎉`}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            {winner === 'draw'
              ? 'الفرقان متعادلان بالنقاط'
              : `فاز بالمعركة بفارق ${scoreDiff} نقطة`
            }
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-slate-200">{totalClicks}</p>
            <p className="text-[10px] text-slate-500">تحركات</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-red-400">{attacks.length}</p>
            <p className="text-[10px] text-slate-500">هجمات</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-orange-400">{traps.length}</p>
            <p className="text-[10px] text-slate-500">فخاخ</p>
          </div>
        </div>

        {/* Score Comparison */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className={`text-center flex-1 ${winner === 'red' ? 'opacity-100' : 'opacity-60'}`}>
              <p className="text-xs text-slate-400 mb-1">{room.redName}</p>
              <p className={`text-3xl font-black ${winner === 'red' ? 'text-red-400' : 'text-slate-400'}`}>{room.redScore}</p>
            </div>
            <div className="text-slate-600 text-sm font-bold mx-2">VS</div>
            <div className={`text-center flex-1 ${winner === 'blue' ? 'opacity-100' : 'opacity-60'}`}>
              <p className="text-xs text-slate-400 mb-1">{room.blueName}</p>
              <p className={`text-3xl font-black ${winner === 'blue' ? 'text-blue-400' : 'text-slate-400'}`}>{room.blueScore}</p>
            </div>
          </div>
          {room.redScore + room.blueScore > 0 && (
            <div>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-800">
                <motion.div
                  initial={{ width: '50%' }}
                  animate={{ width: `${(room.redScore / (room.redScore + room.blueScore)) * 100}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                  className="bg-gradient-to-l from-red-500 to-red-700"
                />
                <motion.div
                  initial={{ width: '50%' }}
                  animate={{ width: `${(room.blueScore / (room.redScore + room.blueScore)) * 100}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-blue-500 to-blue-700"
                />
              </div>
            </div>
          )}
        </div>

        {/* Spectator badge */}
        <div className="text-center">
          <p className="text-xs text-slate-500">👁️ أنت تشاهد كمشاهد</p>
          <a href="/diwaniya" className="text-xs text-blue-400 hover:text-blue-300 underline mt-2 inline-block">
            العودة لصفحة الديوانية
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Render a single button cell (read-only for spectator)
// ============================================================
function renderBtnTable(btn: BoardButton, colSpan: number, clickedBtns: Set<string>) {
  return (
    <td
      key={btn.id}
      colSpan={colSpan}
      className={btn.color}
      style={{ padding: '0.2vmin', textAlign: 'center', verticalAlign: 'middle' }}
    >
      <img
        src={`${IMG_BASE}${btn.icon}.png`}
        className="block mx-auto"
        style={{
          width: '100%',
          height: 'auto',
          opacity: clickedBtns.has(btn.id) ? 0 : 1,
        }}
        alt={btn.icon}
        draggable={false}
      />
    </td>
  );
}

// ============================================================
// Battle Log Panel — collapsible
// ============================================================
function BattleLogPanel({ battleLog }: { battleLog: TobolRoomData['battleLog'] }) {
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [battleLog, isOpen]);

  return (
    <div className="w-full max-w-md mx-auto mt-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700/80 transition-all cursor-pointer"
      >
        <span>📜 سجل المعركة ({battleLog.length})</span>
        <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="mt-1 max-h-[40vh] overflow-y-auto tobol-scrollbar bg-slate-900/80 border border-slate-700/30 rounded-xl p-3 space-y-1">
          {battleLog.length === 0 ? (
            <p className="text-center text-slate-600 text-xs py-4">لا تتحركات بعد...</p>
          ) : (
            battleLog.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg ${
                  entry.team === 'red'
                    ? 'bg-red-950/30 text-red-300'
                    : 'bg-blue-950/30 text-blue-300'
                }`}
              >
                <span className="font-bold text-slate-500 w-5 text-center">{entry.id}.</span>
                <span className="flex-1">{entry.message}</span>
                {entry.valueChange !== 0 && (
                  <span className={`font-black text-[10px] ${entry.valueChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {entry.valueChange > 0 ? '+' : ''}{entry.valueChange}
                  </span>
                )}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Notification Bar
// ============================================================
function NotificationBar({ lastAction, currentTurn, redName, blueName }: {
  lastAction: string | null;
  currentTurn: 'red' | 'blue';
  redName: string;
  blueName: string;
}) {
  const isAttack = lastAction?.includes('هجوم');
  const isTrap = lastAction?.includes('الفخ');
  const turnName = currentTurn === 'red' ? redName : blueName;
  const isRedTurn = currentTurn === 'red';

  let bgColor = 'bg-slate-800/60';
  let borderColor = 'border-slate-600/30';
  let textColor = 'text-slate-300';
  let displayText = '';

  if (!lastAction) {
    displayText = `🎯 دور الفريق ${turnName}`;
    bgColor = isRedTurn ? 'bg-red-950/30' : 'bg-blue-950/30';
    borderColor = isRedTurn ? 'border-red-500/30' : 'border-blue-500/30';
    textColor = isRedTurn ? 'text-red-300' : 'text-blue-300';
  } else {
    displayText = lastAction;
    if (isAttack) {
      bgColor = 'bg-red-950/40';
      borderColor = 'border-red-500/40';
      textColor = 'text-red-300';
    } else if (isTrap) {
      bgColor = 'bg-orange-950/40';
      borderColor = 'border-orange-500/40';
      textColor = 'text-orange-300';
    }
  }

  return (
    <div
      className={`w-full px-4 py-1.5 rounded-lg border ${bgColor} ${borderColor}`}
      style={{ animation: 'fadeInUp 0.3s ease-out' }}
    >
      <p className={`text-[2.2vmin] font-bold text-center truncate ${textColor}`}>{displayText}</p>
    </div>
  );
}

// ============================================================
// Main Tobol Spectator View
// ============================================================
export default function TobolSpectatorView({ roomCode }: { roomCode: string }) {
  const [room, setRoom] = useState<TobolRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const pollRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/tobol-room/${roomCode}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('الغرفة غير موجودة أو انتهت صلاحيتها');
        } else {
          setError('خطأ في جلب البيانات');
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
        setLoading(false);
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    pollRoom();
    const interval = setInterval(pollRoom, 2000);
    return () => clearInterval(interval);
  }, [pollRoom]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">👁️</div>
          <p className="text-slate-400">جاري الاتصال بالغرفة...</p>
          <p className="text-slate-500 text-xs mt-2 font-mono">كود: {roomCode}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center max-w-sm mx-auto p-4">
          <div className="text-5xl mb-4">💔</div>
          <p className="text-red-400 text-lg font-bold mb-4">{error}</p>
          <a
            href="/diwaniya"
            className="inline-block text-sm text-blue-400 hover:text-blue-300 underline"
          >
            العودة لصفحة الديوانية
          </a>
        </div>
      </div>
    );
  }

  if (!room) return null;

  // Game over — show results screen
  if (room.phase === 'game_over') {
    return <SpectatorGameOver room={room} />;
  }

  const clickedSet = new Set(room.clickedBtns);
  const isRedTurn = room.currentTurn === 'red';

  return (
    <div
      className="w-full flex flex-col justify-center items-center p-4"
      dir="rtl"
      style={{ fontFamily: "'titri', 'Cairo', sans-serif" }}
    >
      {/* Title */}
      <div className="text-center mb-1">
        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-blue-400">
          🥁 طبول الحرب
        </h1>
        <p className="text-xs sm:text-sm font-bold text-slate-400 mt-0.5">
          إنها الحرب ⚔️
        </p>
      </div>

      {/* Notification Bar */}
      <div className="w-[95vw] max-w-[100vmin] mx-auto mb-1">
        <NotificationBar
          lastAction={room.lastAction}
          currentTurn={room.currentTurn}
          redName={room.redName}
          blueName={room.blueName}
        />
      </div>

      <div className="gameDiv" style={{ paddingBottom: '1vh' }}>
        <table className="gameTable">
          <tbody>
            {/* ROW 1: Score Panels + VS */}
            <tr>
              <td rowSpan={1} colSpan={2}></td>
              {/* Red Score */}
              <td rowSpan={1} colSpan={33}>
                <table className={`scoreTable score-red-bg ${isRedTurn ? 'active-turn-red' : 'inactive-turn'}`}>
                  <tbody>
                    <tr><td className="teamName">{room.redName}</td></tr>
                    <tr><td className="teamScore">{room.redScore}</td></tr>
                  </tbody>
                </table>
              </td>
              {/* VS */}
              <td rowSpan={1} colSpan={50} style={{ position: 'relative', textAlign: 'center' }}>
                <img
                  src={`${VS_BASE}${((room.mainBgId % 5) + 1)}.png`}
                  className="inline-block"
                  style={{ width: 'auto', height: '20vmin', paddingTop: '0.5vmin' }}
                  alt="VS"
                  draggable={false}
                />
              </td>
              {/* Blue Score */}
              <td rowSpan={1} colSpan={33}>
                <table className={`scoreTable score-blue-bg ${!isRedTurn ? 'active-turn-blue' : 'inactive-turn'}`}>
                  <tbody>
                    <tr><td className="teamName">{room.blueName}</td></tr>
                    <tr><td className="teamScore">{room.blueScore}</td></tr>
                  </tbody>
                </table>
              </td>
              <td rowSpan={1} colSpan={2}></td>
            </tr>

            {/* ROW 2: Side Columns + Center Image */}
            <tr>
              <td colSpan={1}></td>
              <td colSpan={12}>
                <table className="btnTable"><tbody>
                  {RIGHT_COL1.map((btn) => (<tr key={btn.id}>{renderBtnTable(btn, 1, clickedSet)}</tr>))}
                </tbody></table>
              </td>
              <td colSpan={12}>
                <table className="btnTable"><tbody>
                  {RIGHT_COL2.map((btn) => (<tr key={btn.id}>{renderBtnTable(btn, 1, clickedSet)}</tr>))}
                </tbody></table>
              </td>
              <td colSpan={3}></td>
              {/* CENTER */}
              <td colSpan={64} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                {!room.modalData ? (
                  <img
                    className="w-[90%] mx-auto rounded-[7%] inline-block"
                    src={`/img/war/waiting/${((room.mainBgId % 3) + 1)}.png`}
                    alt="Waiting"
                    draggable={false}
                  />
                ) : (
                  <img
                    src={room.modalData.cardImg}
                    alt="Card"
                    draggable={false}
                    style={{ width: '100%', display: 'block', borderRadius: '4%' }}
                  />
                )}
              </td>
              <td colSpan={3}></td>
              <td colSpan={12}>
                <table className="btnTable"><tbody>
                  {LEFT_COL1.map((btn) => (<tr key={btn.id}>{renderBtnTable(btn, 1, clickedSet)}</tr>))}
                </tbody></table>
              </td>
              <td colSpan={12}>
                <table className="btnTable"><tbody>
                  {LEFT_COL2.map((btn) => (<tr key={btn.id}>{renderBtnTable(btn, 1, clickedSet)}</tr>))}
                </tbody></table>
              </td>
              <td colSpan={1}></td>
            </tr>

            {/* ROW 3-5: Bottom Rows */}
            <tr><td colSpan={120}><table className="btnTable2"><tbody><tr>
              {BOTTOM_ROW1.map((btn) => renderBtnTable(btn, 6, clickedSet))}
            </tr></tbody></table></td></tr>
            <tr><td colSpan={120}><table className="btnTable2"><tbody><tr>
              {BOTTOM_ROW2.map((btn) => renderBtnTable(btn, 6, clickedSet))}
            </tr></tbody></table></td></tr>
            <tr><td colSpan={120}><table className="btnTable2"><tbody><tr>
              {BOTTOM_ROW3.map((btn) => renderBtnTable(btn, 6, clickedSet))}
            </tr></tbody></table></td></tr>
          </tbody>
        </table>
      </div>
      <BattleLogPanel battleLog={room.battleLog} />
    </div>
  );
}
