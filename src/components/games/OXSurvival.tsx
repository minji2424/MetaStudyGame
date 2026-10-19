import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Check, X, ShieldAlert, Trophy, RotateCcw, Flame, Sparkles, ArrowRight } from 'lucide-react';
import { StudyPack, OXQuestion } from '../../types';
import { sounds } from '../../utils/audio';

interface OXSurvivalProps {
  pack: StudyPack;
  onAddXp: (amount: number) => void;
  onBackToOverview: () => void;
}

export const OXSurvival: React.FC<OXSurvivalProps> = ({ pack, onAddXp, onBackToOverview }) => {
  const questions: OXQuestion[] = pack.oxSurvival && pack.oxSurvival.length > 0
    ? pack.oxSurvival
    : [
        {
          id: 'ox1',
          statement: '가상 메모리는 물리 RAM 용량보다 큰 프로세스를 실행할 수 있도록 지원한다.',
          isTrue: true,
          explanation: '정답입니다! 가상 메모리의 주된 목적은 물리 메모리 용량의 한계를 극복하는 것입니다.',
        },
      ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [userChoice, setUserChoice] = useState<boolean | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const currentQ = questions[currentIndex] || questions[0];

  const handleAnswer = (choice: boolean) => {
    if (isAnswered) return;
    setUserChoice(choice);
    setIsAnswered(true);

    const isCorrect = choice === currentQ.isTrue;

    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > maxStreak) setMaxStreak(nextStreak);

      sounds.playCombo(nextStreak);
      const points = 100 + nextStreak * 25;
      setScore((s) => s + points);
    } else {
      setStreak(0);
      sounds.playError();
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setUserChoice(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      sounds.playVictory();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
      onAddXp(Math.floor(score / 6) + 35);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setStreak(0);
    setMaxStreak(0);
    setUserChoice(null);
    setIsAnswered(false);
    setIsFinished(false);
    setScore(0);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      if (!isAnswered) {
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'o') {
          handleAnswer(true);
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'x') {
          handleAnswer(false);
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          handleNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isFinished, currentIndex]);

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Top Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">시험 낚시 선지 OX 서바이벌</h2>
              <span className="text-[11px] bg-violet-500/20 text-violet-300 font-semibold px-2 py-0.5 rounded-full border border-violet-500/30">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              교수님들이 시험에 자주 내는 헷갈리는 함정 선지의 참/거짓을 판별하세요!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <div className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-xl animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              <span>{streak}연속 정답!</span>
            </div>
          )}
          <div className="text-sm font-bold text-violet-300 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
            {score.toLocaleString()}P
          </div>
        </div>
      </div>

      {!isFinished ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            [시험 기출 선지 분석]
          </div>

          {/* Statement Box */}
          <div className="bg-slate-950/80 border-2 border-slate-800 p-6 sm:p-8 rounded-2xl">
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
              &quot;{currentQ.statement}&quot;
            </p>
          </div>

          {/* OX Big Choice Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {/* O button */}
            <button
              onClick={() => handleAnswer(true)}
              disabled={isAnswered}
              className={`p-6 sm:p-8 rounded-2xl border-2 transition flex flex-col items-center justify-center gap-2 group ${
                isAnswered
                  ? currentQ.isTrue
                    ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300 scale-102 ring-2 ring-emerald-500'
                    : userChoice === true
                    ? 'border-rose-500 bg-rose-950/50 text-rose-300 opacity-60'
                    : 'opacity-20 border-slate-800 text-slate-500'
                  : 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500 text-emerald-400 hover:scale-[1.02]'
              }`}
            >
              <div className="w-16 h-16 rounded-full border-4 border-emerald-400 flex items-center justify-center font-black text-3xl group-hover:scale-110 transition">
                O
              </div>
              <span className="text-xs font-bold text-emerald-300">
                그렇다 (참 / TRUE) <span className="opacity-50">[키보드 O]</span>
              </span>
            </button>

            {/* X button */}
            <button
              onClick={() => handleAnswer(false)}
              disabled={isAnswered}
              className={`p-6 sm:p-8 rounded-2xl border-2 transition flex flex-col items-center justify-center gap-2 group ${
                isAnswered
                  ? !currentQ.isTrue
                    ? 'border-rose-500 bg-rose-950/50 text-rose-300 scale-102 ring-2 ring-rose-500'
                    : userChoice === false
                    ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300 opacity-60'
                    : 'opacity-20 border-slate-800 text-slate-500'
                  : 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500 text-rose-400 hover:scale-[1.02]'
              }`}
            >
              <div className="w-16 h-16 rounded-full border-4 border-rose-400 flex items-center justify-center font-black text-3xl group-hover:scale-110 transition">
                X
              </div>
              <span className="text-xs font-bold text-rose-300">
                아니다 (거짓 / FALSE) <span className="opacity-50">[키보드 X]</span>
              </span>
            </button>
          </div>

          {/* Explanation Box */}
          {isAnswered && (
            <div className="space-y-4 pt-2 animate-fade-in text-left">
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-md ${
                      userChoice === currentQ.isTrue
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {userChoice === currentQ.isTrue ? '✅ 판별 성공!' : '❌ 함정에 걸림!'}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    정답: {currentQ.isTrue ? 'O (참)' : 'X (거짓)'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {currentQ.explanation}
                </p>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30"
              >
                <span>
                  {currentIndex + 1 < questions.length ? '다음 문제 (Space / Enter)' : '결과 확인'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Result Screen */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/30 rounded-2xl flex items-center justify-center mx-auto text-violet-400">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">OX 서바이벌 완주!</h3>
            <p className="text-xs text-slate-400 mt-1">
              시험 문제에 숨겨진 낚시 지문들을 날카롭게 간파했습니다
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <div className="text-[11px] text-slate-400">최대 연속 정답</div>
              <div className="text-lg font-black text-violet-400">{maxStreak}회</div>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <div className="text-[11px] text-slate-400">학점 XP</div>
              <div className="text-lg font-black text-indigo-400">
                +{Math.floor(score / 6) + 35} XP
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시 플레이</span>
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
      )}
    </div>
  );
};
