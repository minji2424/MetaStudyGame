import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Skull, Heart, ShieldAlert, Sparkles, HelpCircle, Trophy, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import { StudyPack, BossQuestion } from '../../types';
import { sounds } from '../../utils/audio';

interface BossRaidProps {
  pack: StudyPack;
  onAddXp: (amount: number) => void;
  onBackToOverview: () => void;
}

export const BossRaid: React.FC<BossRaidProps> = ({ pack, onAddXp, onBackToOverview }) => {
  const questions: BossQuestion[] = pack.bossBattle && pack.bossBattle.length > 0
    ? pack.bossBattle
    : [
        {
          id: 'fb1',
          question: '핵심 개념에 대한 설명 중 가장 타당한 것은?',
          options: ['보기 1', '보기 2', '보기 3', '보기 4'],
          correctIndex: 0,
          explanation: '이 개념의 핵심 원리를 숙지하세요.',
        },
      ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [bossMaxHp] = useState(questions.length * 300);
  const [bossHp, setBossHp] = useState(questions.length * 300);
  const [playerHp, setPlayerHp] = useState(3);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [damageFloater, setDamageFloater] = useState<{ amount: number; isCrit: boolean } | null>(null);
  const [bossShake, setBossShake] = useState(false);
  const [playerShake, setPlayerShake] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [hintText, setHintText] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [mana, setMana] = useState(50); // 0 to 100%

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectOption = (idx: number) => {
    if (isAnswered || gameStatus !== 'playing') return;

    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      const isCrit = mana >= 100;
      const baseDamage = 300;
      const finalDamage = isCrit ? baseDamage * 2 : baseDamage;

      sounds.playBossHit();
      setBossShake(true);
      setTimeout(() => setBossShake(false), 500);

      setDamageFloater({ amount: finalDamage, isCrit });
      setTimeout(() => setDamageFloater(null), 1200);

      const nextHp = Math.max(0, bossHp - finalDamage);
      setBossHp(nextHp);

      // Reset or increase mana
      if (isCrit) {
        setMana(20);
      } else {
        setMana((m) => Math.min(100, m + 40));
      }

      if (nextHp <= 0 || currentIndex + 1 >= questions.length) {
        // Boss Defeated!
        setTimeout(() => {
          sounds.playVictory();
          setGameStatus('won');
          confetti({
            particleCount: 100,
            spread: 90,
            origin: { y: 0.5 },
          });
          onAddXp(120);
        }, 1000);
      }
    } else {
      // Wrong answer - Player takes damage!
      sounds.playPlayerHurt();
      setPlayerShake(true);
      setTimeout(() => setPlayerShake(false), 500);

      const nextHp = playerHp - 1;
      setPlayerHp(nextHp);
      setMana((m) => Math.max(0, m - 30));

      if (nextHp <= 0) {
        setTimeout(() => {
          sounds.playError();
          setGameStatus('lost');
        }, 800);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length && bossHp > 0) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setHintText(null);
    } else if (bossHp <= 0) {
      setGameStatus('won');
    }
  };

  const handleRequestHint = async () => {
    if (hintText || isLoadingHint) return;
    setIsLoadingHint(true);
    try {
      const res = await fetch('/api/game-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          context: pack.summary,
        }),
      });
      const data = await res.json();
      setHintText(data.hint || '💡 핵심 정의와 선지의 차이점을 비교해보세요!');
    } catch (e) {
      setHintText('💡 힌트: 문제에서 묻는 주체와 목적을 다시 읽어보세요!');
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setBossHp(bossMaxHp);
    setPlayerHp(3);
    setSelectedOption(null);
    setIsAnswered(false);
    setDamageFloater(null);
    setGameStatus('playing');
    setHintText(null);
    setMana(50);
  };

  const bossHpPercentage = Math.round((bossHp / bossMaxHp) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Boss Raid Arena Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        {/* Arena Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-rose-600/10 blur-3xl pointer-events-none rounded-full" />

        {/* Combat Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
          {/* Student Status */}
          <div className={`flex items-center gap-3 transition ${playerShake ? 'animate-shake' : ''}`}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 border border-indigo-400/30 flex items-center justify-center text-white font-black text-sm shadow-md">
              A+
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>학부생 용사</span>
                <span className="text-[10px] text-indigo-400 font-mono">Lv.Univ</span>
              </div>
              {/* Hearts */}
              <div className="flex gap-1 mt-1">
                {[1, 2, 3].map((heart) => (
                  <Heart
                    key={heart}
                    className={`w-4 h-4 transition ${
                      heart <= playerHp
                        ? 'text-rose-500 fill-rose-500'
                        : 'text-slate-700 fill-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Mana / Ult Bar */}
          <div className="text-right">
            <div className="text-[11px] font-bold text-slate-400 flex items-center justify-end gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>A+ 마나 {mana >= 100 ? '(CRIT READY!)' : `${mana}%`}</span>
            </div>
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-700">
              <div
                className={`h-full transition-all duration-300 ${
                  mana >= 100
                    ? 'bg-gradient-to-r from-cyan-400 to-amber-300 animate-pulse'
                    : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                }`}
                style={{ width: `${mana}%` }}
              />
            </div>
          </div>
        </div>

        {/* Boss Display Box */}
        <div
          className={`bg-slate-950/60 border border-rose-900/30 rounded-2xl p-5 mb-5 relative transition ${
            bossShake ? 'animate-shake border-rose-500' : ''
          }`}
        >
          {/* Damage Floater Animation */}
          {damageFloater && (
            <div
              className={`absolute top-2 right-12 z-20 font-black animate-bounce ${
                damageFloater.isCrit
                  ? 'text-2xl text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                  : 'text-xl text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]'
              }`}
            >
              {damageFloater.isCrit ? '💥 CRIT! ' : '⚔️ '} -{damageFloater.amount} HP
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-700 to-amber-600 border border-rose-500/40 flex items-center justify-center text-white shadow-lg shadow-rose-950">
                <Skull className="w-8 h-8 text-rose-100" />
              </div>
              <div className="absolute -bottom-1 -right-1 text-[10px] bg-rose-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                BOSS
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-extrabold text-rose-200">
                  중간/기말 족보 파괴자 [F학점 보스]
                </h3>
                <span className="text-xs font-mono font-bold text-rose-400">
                  {bossHp} / {bossMaxHp} HP ({bossHpPercentage}%)
                </span>
              </div>

              {/* Boss HP bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-rose-950">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 transition-all duration-500"
                  style={{ width: `${Math.max(0, bossHpPercentage)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Question & Interactive Area */}
        {gameStatus === 'playing' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                QUESTION {currentIndex + 1} / {questions.length}
              </span>
              <button
                onClick={handleRequestHint}
                disabled={isLoadingHint || !!hintText}
                className="text-xs text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{isLoadingHint ? '소크라테스 힌트 요청 중...' : 'AI 힌트 보기'}</span>
              </button>
            </div>

            {/* AI Socratic Hint Box */}
            {hintText && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 animate-fade-in flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{hintText}</p>
              </div>
            )}

            {/* Question Text */}
            <h4 className="text-sm sm:text-base font-bold text-white leading-relaxed bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
              {currentQ.question}
            </h4>

            {/* 4 Options */}
            <div className="grid grid-cols-1 gap-2.5 pt-1">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let btnStyle = 'border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-200';
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-950/60 text-emerald-200 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'border-rose-500 bg-rose-950/60 text-rose-200 animate-shake';
                  } else {
                    btnStyle = 'opacity-40 border-slate-800 text-slate-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`w-full p-3.5 rounded-xl text-left transition border text-xs sm:text-sm font-medium flex items-center gap-3 ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400 shrink-0">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    <span className="leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation & Trap Tip */}
            {isAnswered && (
              <div className="space-y-2.5 pt-2 animate-fade-in">
                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" />
                    <span>정답 해설</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{currentQ.explanation}</p>

                  {currentQ.trapTip && (
                    <div className="mt-2 pt-2 border-t border-slate-700 flex items-start gap-1.5 text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <span className="font-bold">시험 함정 포인트: </span>
                        <span>{currentQ.trapTip}</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <span>
                    {currentIndex + 1 < questions.length ? '다음 공격 문제로!' : '보스 결과 확인'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : gameStatus === 'won' ? (
          /* Victory Screen */
          <div className="text-center py-6 space-y-5 animate-fade-in">
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">보스 격파 성공! (A+ 달성!)</h3>
              <p className="text-xs text-slate-300 mt-1.5">
                족보 파괴자 보스의 모든 기출 함정을 간파하고 완벽히 격파했습니다!
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-300 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>학점 경험치 +120 XP 획득!</span>
            </div>

            <div className="flex justify-center gap-3 pt-3">
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>보스 다시 토벌하기</span>
              </button>
              <button
                onClick={onBackToOverview}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-2"
              >
                <span>학습 홈으로</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Defeat Screen */
          <div className="text-center py-6 space-y-5 animate-fade-in">
            <div className="w-20 h-20 bg-rose-500/10 border-2 border-rose-500/40 rounded-3xl flex items-center justify-center mx-auto text-rose-400 shadow-xl shadow-rose-500/20">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-rose-200">시험 함정에 걸렸습니다!</h3>
              <p className="text-xs text-slate-400 mt-1.5">
                생명력이 모두 소진되었습니다. 오답 노트를 복습하고 다시 도전해보세요!
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-3">
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>부활하여 다시 도전</span>
              </button>
              <button
                onClick={onBackToOverview}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
              >
                개념 복습하러 가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
