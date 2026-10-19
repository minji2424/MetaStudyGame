import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Upload,
  Trophy,
  Flame,
  Zap,
  Skull,
  Target,
  ShieldAlert,
  Layers,
  FileText,
  ChevronDown,
  GraduationCap,
} from 'lucide-react';
import { StudyPack, GameMode } from './types';
import { PRESET_STUDY_PACKS } from './data/presetPacks';
import { sounds } from './utils/audio';
import { UploadModal } from './components/UploadModal';
import { Overview } from './components/Overview';
import { SpeedMatch } from './components/games/SpeedMatch';
import { BossRaid } from './components/games/BossRaid';
import { BlankShooter } from './components/games/BlankShooter';
import { OXSurvival } from './components/games/OXSurvival';
import { Flashcards } from './components/games/Flashcards';
import { CheatSheet } from './components/CheatSheet';

export default function App() {
  const [studyPacks, setStudyPacks] = useState<StudyPack[]>(() => {
    try {
      const saved = localStorage.getItem('metastudy_packs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return PRESET_STUDY_PACKS;
  });

  const [activePackId, setActivePackId] = useState<string>(() => {
    return PRESET_STUDY_PACKS[0].id;
  });

  const [currentMode, setCurrentMode] = useState<GameMode>('overview');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem('metastudy_xp');
    return saved ? parseInt(saved, 10) : 180;
  });

  // Save study packs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('metastudy_packs', JSON.stringify(studyPacks));
    } catch (e) {}
  }, [studyPacks]);

  // Save XP
  useEffect(() => {
    try {
      localStorage.setItem('metastudy_xp', xp.toString());
    } catch (e) {}
  }, [xp]);

  // Sync sound settings
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  const activePack = studyPacks.find((p) => p.id === activePackId) || studyPacks[0] || PRESET_STUDY_PACKS[0];

  // Calculate Student Level & Title
  const getLevelInfo = (currentXp: number) => {
    const levels = [
      { min: 0, lvl: 1, title: '새내기 학부생', nextXp: 300 },
      { min: 300, lvl: 2, title: '도서관 지박령', nextXp: 700 },
      { min: 700, lvl: 3, title: '전공 마스터', nextXp: 1300 },
      { min: 1300, lvl: 4, title: '학점 사냥꾼 (A+)', nextXp: 2200 },
      { min: 2200, lvl: 5, title: '수석 장학생 (Dean\'s List)', nextXp: 3500 },
    ];
    for (let i = levels.length - 1; i >= 0; i--) {
      if (currentXp >= levels[i].min) {
        return levels[i];
      }
    }
    return levels[0];
  };

  const levelInfo = getLevelInfo(xp);

  const handleAddXp = (amount: number) => {
    const nextXp = xp + amount;
    const oldLevel = levelInfo.lvl;
    const newLevelInfo = getLevelInfo(nextXp);

    setXp(nextXp);

    if (newLevelInfo.lvl > oldLevel) {
      // Level Up Fanfare!
      sounds.playVictory();
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.4 },
      });
    }
  };

  const handlePackCreated = (newPack: StudyPack) => {
    setStudyPacks((prev) => [newPack, ...prev]);
    setActivePackId(newPack.id);
    setCurrentMode('overview');
    sounds.playVictory();
  };

  const navTabs: { mode: GameMode; label: string; icon: React.FC<any> }[] = [
    { mode: 'overview', label: '요약 허브', icon: BookOpen },
    { mode: 'boss', label: '보스 레이드', icon: Skull },
    { mode: 'match', label: '스피드 매칭', icon: Zap },
    { mode: 'blank', label: '블랭크 슈터', icon: Target },
    { mode: 'ox', label: 'OX 낚시 분쇄', icon: ShieldAlert },
    { mode: 'flashcards', label: '플래시카드', icon: Layers },
    { mode: 'cheatsheet', label: 'A+ 치트시트', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentMode('overview')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-indigo-400">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>메타스터디 퀘스트</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.2 rounded border border-indigo-500/30">
                    AI 암기 게임
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  대학생 강의자료(PDF) 완벽 암기
                </div>
              </div>
            </button>
          </div>

          {/* Course Selector Dropdown & Upload Button */}
          <div className="flex items-center gap-2 max-w-xs sm:max-w-md">
            <div className="relative">
              <select
                value={activePackId}
                onChange={(e) => {
                  setActivePackId(e.target.value);
                  setCurrentMode('overview');
                }}
                className="appearance-none bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-200 cursor-pointer focus:outline-none focus:border-indigo-500 max-w-[160px] sm:max-w-[220px] truncate"
              >
                {studyPacks.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ PDF 업로드</span>
              <span className="sm:hidden">+ PDF</span>
            </button>
          </div>

          {/* Right Status (Level, Streak, Sound) */}
          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            <div className="hidden md:flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-xl">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              <span>3일 연속!</span>
            </div>

            {/* Student Level & XP */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center">
                Lv.{levelInfo.lvl}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-[11px] font-bold text-slate-200 leading-none">
                  {levelInfo.title}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {xp} / {levelInfo.nextXp} XP
                </div>
              </div>
            </div>

            {/* Sound Mute Toggle */}
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`p-2 rounded-xl border transition ${
                soundEnabled
                  ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={soundEnabled ? '효과음 켜짐 (클릭 시 무음)' : '무음 모드 (도서관)'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Sub-navigation Game Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1 py-1.5">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentMode === tab.mode;
              return (
                <button
                  key={tab.mode}
                  onClick={() => setCurrentMode(tab.mode)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentMode === 'overview' && (
          <Overview
            pack={activePack}
            onSelectMode={setCurrentMode}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {currentMode === 'match' && (
          <SpeedMatch
            pack={activePack}
            onAddXp={handleAddXp}
            onBackToOverview={() => setCurrentMode('overview')}
          />
        )}

        {currentMode === 'boss' && (
          <BossRaid
            pack={activePack}
            onAddXp={handleAddXp}
            onBackToOverview={() => setCurrentMode('overview')}
          />
        )}

        {currentMode === 'blank' && (
          <BlankShooter
            pack={activePack}
            onAddXp={handleAddXp}
            onBackToOverview={() => setCurrentMode('overview')}
          />
        )}

        {currentMode === 'ox' && (
          <OXSurvival
            pack={activePack}
            onAddXp={handleAddXp}
            onBackToOverview={() => setCurrentMode('overview')}
          />
        )}

        {currentMode === 'flashcards' && (
          <Flashcards
            pack={activePack}
            onAddXp={handleAddXp}
            onBackToOverview={() => setCurrentMode('overview')}
          />
        )}

        {currentMode === 'cheatsheet' && (
          <CheatSheet
            pack={activePack}
            onSelectGame={(game) => setCurrentMode(game as GameMode)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-1">
          <GraduationCap className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-slate-400">메타스터디 퀘스트 (MetaStudy Quest)</span>
          <span>•</span>
          <span>Powered by Gemini 3.8 Flash</span>
        </div>
        <p>대학생 전공 시험 A+ 완성을 위한 PDF 기반 인터랙티브 암기 게임</p>
      </footer>

      {/* PDF / Text Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onPackCreated={handlePackCreated}
        onSelectPreset={(presetId) => {
          setActivePackId(presetId);
          setCurrentMode('overview');
        }}
      />
    </div>
  );
}
