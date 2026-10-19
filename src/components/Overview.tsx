import React from 'react';
import { Zap, Skull, Target, ShieldAlert, Layers, FileText, Sparkles, BookOpen, Clock, Award, ArrowRight, Upload } from 'lucide-react';
import { StudyPack, GameMode } from '../types';

interface OverviewProps {
  pack: StudyPack;
  onSelectMode: (mode: GameMode) => void;
  onOpenUpload: () => void;
}

export const Overview: React.FC<OverviewProps> = ({ pack, onSelectMode, onOpenUpload }) => {
  const gameCards = [
    {
      mode: 'match' as GameMode,
      title: '스피드 매칭',
      subtitle: '개념어 & 정의 빠른 짝 맞추기',
      desc: '시간 제한 내에 카드들을 매칭하여 콤보 배율과 폭발적인 암기 효과를 얻으세요.',
      badge: '스피드 콤보',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300',
      icon: Zap,
      iconColor: 'text-amber-400',
    },
    {
      mode: 'boss' as GameMode,
      title: '학점 보스 레이드',
      subtitle: 'F학점 보스 격파 RPG 퀴즈',
      desc: '중간/기말고사 킬러 보스를 상대로 4지선다 기출 문제를 맞춰 크리티컬 일격을 날리세요!',
      badge: 'RPG 배틀',
      color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-300',
      icon: Skull,
      iconColor: 'text-rose-400',
    },
    {
      mode: 'blank' as GameMode,
      title: '블랭크 슈터',
      subtitle: '핵심 정의 [빈칸] 저격',
      desc: '시험 빈출 정의문의 결정적 키워드 괄호를 시간 내에 빠르게 타격하세요.',
      badge: '빈칸 공략',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300',
      icon: Target,
      iconColor: 'text-emerald-400',
    },
    {
      mode: 'ox' as GameMode,
      title: 'OX 낚시 선지 분쇄',
      subtitle: '교수님의 함정 보기 판별',
      desc: '실제 시험에서 학생들이 가장 많이 낚이는 미묘한 오답 포인트를 간파하세요.',
      badge: '함정 방지',
      color: 'from-violet-500/20 to-indigo-500/20 border-violet-500/30 text-violet-300',
      icon: ShieldAlert,
      iconColor: 'text-violet-400',
    },
    {
      mode: 'flashcards' as GameMode,
      title: '라이트너 플래시카드',
      subtitle: '능동적 인출 & 간격 반복',
      desc: '3D 카드를 뒤집으며 뇌에 개념을 깊이 새기는 과학적인 암기법입니다.',
      badge: '장기 기억',
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300',
      icon: Layers,
      iconColor: 'text-blue-400',
    },
    {
      mode: 'cheatsheet' as GameMode,
      title: 'A+ 시험 치트시트',
      subtitle: '시험장 직전 5분 요약 브리핑',
      desc: '핵심 공식, 헷갈리는 비교 표, 연상 암기팁을 한눈에 보고 PDF로 인쇄하세요.',
      badge: '총정리',
      color: 'from-slate-700/40 to-slate-800/40 border-slate-700 text-slate-300',
      icon: FileText,
      iconColor: 'text-indigo-400',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Hero Course Briefing Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {pack.major}
              </span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-full flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                마스터 약 {pack.estimatedStudyTimeMinutes || 15}분
              </span>
              {pack.sourceFileName && (
                <span className="px-3 py-1 bg-slate-800/80 text-slate-400 text-xs rounded-full truncate max-w-[200px]">
                  📄 {pack.sourceFileName}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              {pack.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {pack.summary}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => onSelectMode('boss')}
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 group"
            >
              <Skull className="w-4 h-4 text-rose-300" />
              <span>보스 레이드로 시작</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
            <button
              onClick={onOpenUpload}
              className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>다른 PDF 분석하기</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Game Modes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>암기 퀘스트 게임 선택</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              지루한 단순 읽기를 탈피하여 5가지 게임 메커니즘으로 핵심 개념을 뇌에 인코딩합니다
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gameCards.map((game) => {
            const Icon = game.icon;
            return (
              <button
                key={game.mode}
                onClick={() => onSelectMode(game.mode)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/40 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-slate-800/90 rounded-2xl group-hover:scale-105 transition">
                      <Icon className={`w-6 h-6 ${game.iconColor}`} />
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border bg-gradient-to-r ${game.color}`}
                    >
                      {game.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                    {game.title}
                  </h3>
                  <div className="text-xs font-semibold text-slate-400 mt-0.5">
                    {game.subtitle}
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed line-clamp-2">
                    {game.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-white transition">
                  <span>게임 시작하기</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Key Concepts Preview Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              이 팩의 핵심 전공 개념어 ({pack.concepts.length}개)
            </h3>
          </div>
          <button
            onClick={() => onSelectMode('cheatsheet')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
          >
            <span>전체 치트시트 보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {pack.concepts.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{item.term}</span>
                {item.difficulty && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {'★'.repeat(item.difficulty)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {item.definition}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
