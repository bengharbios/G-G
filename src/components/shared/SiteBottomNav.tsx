'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Gamepad2, Calendar, Radio, User } from 'lucide-react';
import EventsModal from '@/components/shared/EventsModal';

type BottomTab = 'home' | 'games' | 'events' | 'council' | 'profile';

interface SiteBottomNavProps {
  /** Which tab is currently active */
  activeTab?: BottomTab;
  /** Override the events modal open state (if managed externally) */
  eventsModalOpen?: boolean;
  onEventsModalChange?: (open: boolean) => void;
}

export default function SiteBottomNav({
  activeTab: controlledTab,
  eventsModalOpen: controlledEventsOpen,
  onEventsModalChange,
}: SiteBottomNavProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<BottomTab>(
    controlledTab || 'home'
  );
  const [internalEventsOpen, setInternalEventsOpen] = useState(false);

  const activeTab = controlledTab ?? internalActiveTab;
  const setActiveTab = controlledTab ? () => {} : setInternalActiveTab;
  const eventsOpen = controlledEventsOpen ?? internalEventsOpen;
  const setEventsOpen = onEventsModalChange ?? setInternalEventsOpen;

  const tabs: { id: BottomTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'الرئيسية', icon: <Home className="w-5 h-5" /> },
    { id: 'games', label: 'الألعاب', icon: <Gamepad2 className="w-5 h-5" /> },
    { id: 'events', label: 'الأحداث', icon: <Calendar className="w-5 h-5" /> },
    { id: 'council', label: 'المجلس', icon: <Radio className="w-5 h-5" /> },
    { id: 'profile', label: 'الملف', icon: <User className="w-5 h-5" /> },
  ];

  const handleTabClick = (tabId: BottomTab) => {
    setActiveTab(tabId);

    switch (tabId) {
      case 'home':
        window.location.href = '/';
        break;
      case 'games':
        window.location.href = '/#games';
        break;
      case 'events':
        setEventsOpen(true);
        break;
      case 'council':
        window.location.href = '/voice-rooms';
        break;
      case 'profile':
        window.location.href = '/profile';
        break;
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/40 safe-area-pb">
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 relative min-w-[56px] ${
                  isActive
                    ? 'text-amber-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="siteBottomNavIndicator"
                    className="absolute -top-1.5 w-8 h-0.5 rounded-full bg-amber-400"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Events Modal */}
      <EventsModal open={eventsOpen} onClose={() => setEventsOpen(false)} />
    </>
  );
}
