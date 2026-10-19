import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Zap, Clock, Trophy, RotateCcw, Flame, CheckCircle, ArrowRight } from 'lucide-react';
import { StudyPack, ConceptItem } from '../../types';
import { sounds } from '../../utils/audio';

interface SpeedMatchProps {
  pack: StudyPack;
  onAddXp: (amount: number) => void;
  onBackToOverview: () => void;
}

export const SpeedMatch: React.FC<SpeedMatchProps> = ({ pack, onAddXp, onBackToOverview }) => {
  const [round, setRound] = useState(1);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);
  const [roundItems, setRoundItems] = useState<ConceptItem[]>([]);
  const [shuffledDefs, setShuffledDefs] = useState<ConceptItem[]>([]);
  const [wrongPair, setWrongPair] = useState<{ termId: string; defId: string } | null>(null);

  // Setup round
  useEffect(() => {
    startNewGame();
  }, [pack]);

  const startNewGame = () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(60);
    setIsGameOver(false);
    setMatchedIds([]);
    setRound(1);
    loadRound(1);
  };

  const loadRound = (roundNum: number) => {
    const total = pack.concepts.length;
    if (total === 0) return;

    // Pick 5 concepts (cycling through if fewer)
    const shuffled = [...pack.concepts].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, Math.min(5, total));

    setRoundItems(chosen);
    // Shuffle definitions independently
    const defs = [...chosen].sort(() => Math.random() - 0.5);
    setShuffledDefs(defs);
    setSelectedTermId(null);
    setSelectedDefId(null);
    setMatchedIds([]);
  };

  // Timer
  useEffect(() => {
    if (isGameOver || timeLeft <= 0) {
      if (timeLeft <= 0 && !isGameOver) {
        finishGame();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isGameOver]);

  const finishGame = () => {
    setIsGameOver(true);
    sounds.playVictory();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    // Award XP
    const earnedXp = Math.floor(score / 5) + 30;
    onAddXp(earnedXp);
  };

  const handleSelectTerm = (id: string) => {
    if (matchedIds.includes(id)) return;
    sounds.playFlip();
    setSelectedTermId(id);

    if (selectedDefId) {
      checkMatch(id, selectedDefId);
    }
  };

  const handleSelectDef = (id: string) => {
    if (matchedIds.includes(id)) return;
    sounds.playFlip();
    setSelectedDefId(id);

    if (selectedTermId) {
      checkMatch(selectedTermId, id);
    }
  };

  const checkMatch = (termId: string, defId: string) => {
    if (termId === defId) {
      // MATCH!
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      sounds.playCombo(newCombo);
      const points = 100 * (1 + newCombo * 0.2);
      setScore((prev) => Math.round(prev + points));

      const newMatched = [...matchedIds, termId];
      setMatchedIds(newMatched);
      setSelectedTermId(null);
      setSelectedDefId(null);

      // Check if current round completed
      if (newMatched.length === roundItems.length) {
        setTimeout(() => {
          sounds.playSuccess();
          // Bonus time
          setTimeLeft((prev) => Math.min(prev + 8, 90));
          setRound((r) => r + 1);
          loadRound(round + 1);
        }, 500);
      }
    } else {
      // MISMATCH!
      sounds.playError();
      setWrongPair({ termId, defId });
      setCombo(0);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedTermId(null);
        setSelectedDefId(null);
      }, 500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Top Game Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Zap className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">스피드 카드 매칭</h2>
              <span className="text-[11px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                Round {round}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              개념어와 올바른 정의를 빠르게 연결하세요! 연속 정답 시 콤보 배율 폭발!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Combo Badge */}
          {combo >= 2 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-xl text-amber-300 font-bold text-xs animate-bounce">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span>{combo} COMBO!</span>
            </div>
          )}

          {/* Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-sm font-bold ${
              timeLeft <= 10
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{timeLeft}s</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-indigo-300 font-bold text-sm">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{score.toLocaleString()}P</span>
          </div>
        </div>
      </div>

      {/* Play Area */}
      {!isGameOver ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Terms Column */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              학술 개념어 (Term)
            </div>
            <div className="space-y-2.5">
              {roundItems.map((item) => {
                const isMatched = matchedIds.includes(item.id);
                const isSelected = selectedTermId === item.id;
                const isWrong = wrongPair?.termId === item.id;

                return (
                  <button
                    key={'term-' + item.id}
                    onClick={() => handleSelectTerm(item.id)}
                    disabled={isMatched}
                    className={`w-full p-4 rounded-xl text-left transition relative border ${
                      isMatched
                        ? 'opacity-30 border-emerald-500/40 bg-emerald-950/20 text-slate-400 pointer-events-none'
                        : isWrong
                        ? 'border-rose-500 bg-rose-950/40 text-rose-200 animate-shake'
                        : isSelected
                        ? 'border-indigo-400 bg-indigo-600/30 text-white ring-2 ring-indigo-400/50 shadow-lg shadow-indigo-500/20'
                        : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-850 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-white">{item.term}</div>
                      {isMatched && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                    {item.englishTerm && (
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.englishTerm}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Definitions Column */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              핵심 정의 및 시험 포인트 (Definition)
            </div>
            <div className="space-y-2.5">
              {shuffledDefs.map((item) => {
                const isMatched = matchedIds.includes(item.id);
                const isSelected = selectedDefId === item.id;
                const isWrong = wrongPair?.defId === item.id;

                return (
                  <button
                    key={'def-' + item.id}
                    onClick={() => handleSelectDef(item.id)}
                    disabled={isMatched}
                    className={`w-full p-4 rounded-xl text-left transition relative border ${
                      isMatched
                        ? 'opacity-30 border-emerald-500/40 bg-emerald-950/20 text-slate-400 pointer-events-none'
                        : isWrong
                        ? 'border-rose-500 bg-rose-950/40 text-rose-200 animate-shake'
                        : isSelected
                        ? 'border-indigo-400 bg-indigo-600/30 text-white ring-2 ring-indigo-400/50 shadow-lg shadow-indigo-500/20'
                        : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <p className="text-xs leading-relaxed text-slate-300 font-medium line-clamp-3">
                      {item.definition}
                    </p>
                    {isMatched && (
                      <div className="text-[11px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>정답 매칭 완료!</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Game Over Result Screen */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-black text-white">매칭 챌린지 종료!</h3>
            <p className="text-xs text-slate-400 mt-1">
              반복 학습을 통해 개념과 정의가 장기 기억으로 인코딩되었습니다
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <div className="text-[11px] text-slate-400">최종 점수</div>
              <div className="text-lg font-black text-amber-400 mt-0.5">{score.toLocaleString()}P</div>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <div className="text-[11px] text-slate-400">최대 콤보</div>
              <div className="text-lg font-black text-orange-400 mt-0.5">{maxCombo} COMBO</div>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <div className="text-[11px] text-slate-400">획득 학점 XP</div>
              <div className="text-lg font-black text-indigo-400 mt-0.5">
                +{Math.floor(score / 5) + 30} XP
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={startNewGame}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시 도전하기</span>
            </button>
            <button
              onClick={onBackToOverview}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <span>다른 게임 모드 선택</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
