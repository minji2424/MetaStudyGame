import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Layers, RotateCcw, Volume2, Sparkles, Check, HelpCircle, XCircle, ArrowRight } from 'lucide-react';
import { StudyPack, FlashcardItem } from '../../types';
import { sounds } from '../../utils/audio';

interface FlashcardsProps {
  pack: StudyPack;
  onAddXp: (amount: number) => void;
  onBackToOverview: () => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({ pack, onAddXp, onBackToOverview }) => {
  const initialCards: FlashcardItem[] = pack.flashcards && pack.flashcards.length > 0
    ? pack.flashcards
    : pack.concepts.map((c) => ({
        id: c.id,
        front: `${c.term}이란?`,
        back: `${c.definition}\n\n[시험 포인트]: ${c.keyPoint}`,
        tip: c.mnemonic,
      }));

  const [cards, setCards] = useState<FlashcardItem[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [learningIds, setLearningIds] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = cards[currentIndex] || cards[0];

  const handleFlip = () => {
    sounds.playFlip();
    setIsFlipped((f) => !f);
  };

  const handleRate = (rating: 'hard' | 'medium' | 'easy') => {
    const cardId = currentCard.id;

    if (rating === 'easy') {
      sounds.playSuccess();
      setMasteredIds((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
      setLearningIds((prev) => prev.filter((id) => id !== cardId));
    } else if (rating === 'medium') {
      sounds.playFlip();
      setLearningIds((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
    } else {
      sounds.playError();
      setLearningIds((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
      setMasteredIds((prev) => prev.filter((id) => id !== cardId));
    }

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
      sounds.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      onAddXp(masteredIds.length * 15 + 30);
    }
  };

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRestart = (onlyWeak: boolean = false) => {
    if (onlyWeak) {
      const weak = cards.filter((c) => !masteredIds.includes(c.id));
      setCards(weak.length > 0 ? weak : initialCards);
    } else {
      setCards(initialCards);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Top Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">라이트너 플래시카드</h2>
              <span className="text-[11px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                {currentIndex + 1} / {cards.length}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              카드 앞면을 보고 능동적 인출(Active Recall) 후 뒷면을 확인하세요
            </p>
          </div>
        </div>

        {/* Mastered Counter */}
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
          <Check className="w-3.5 h-3.5" />
          <span>암기 완료 {masteredIds.length}개</span>
        </div>
      </div>

      {!isFinished ? (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>

          {/* 3D Flip Card */}
          <div
            onClick={handleFlip}
            className="cursor-pointer min-h-[320px] sm:min-h-[360px] rounded-3xl bg-slate-900 border-2 border-slate-700/80 hover:border-blue-500/60 p-8 flex flex-col justify-between transition-all duration-300 shadow-2xl relative select-none group"
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 font-semibold text-[11px] text-blue-300 border border-slate-700">
                {isFlipped ? '💡 뒷면 (정답 및 시험 포인트)' : '❓ 앞면 (질문/개념)'}
              </span>
              <button
                onClick={(e) => handleSpeak(e, isFlipped ? currentCard.back : currentCard.front)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                title="음성 읽기"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Card Content Area */}
            <div className="my-auto py-6 text-center">
              {!isFlipped ? (
                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
                    {currentCard.front}
                  </h3>
                  <p className="text-xs text-blue-400 font-medium">
                    (카드를 탭하여 정답 확인)
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-left max-w-lg mx-auto">
                  <div className="text-base sm:text-lg font-bold text-slate-100 whitespace-pre-line leading-relaxed">
                    {currentCard.back}
                  </div>
                  {currentCard.tip && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>암기 연상 팁: {currentCard.tip}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Flip Hint */}
            <div className="text-center text-xs text-slate-500">
              {isFlipped ? '아래에서 암기 상태를 평가해 주세요' : '스페이스바 또는 클릭하여 뒤집기'}
            </div>
          </div>

          {/* Rating Buttons */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={() => handleRate('hard')}
              className="py-3 px-2 rounded-xl bg-slate-900 border border-rose-500/30 hover:bg-rose-950/40 hover:border-rose-500 text-rose-300 text-xs font-bold transition flex flex-col items-center gap-1 shadow-sm"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>잘 모름 (다시)</span>
            </button>
            <button
              onClick={() => handleRate('medium')}
              className="py-3 px-2 rounded-xl bg-slate-900 border border-amber-500/30 hover:bg-amber-950/40 hover:border-amber-500 text-amber-300 text-xs font-bold transition flex flex-col items-center gap-1 shadow-sm"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>헷갈림 (복습)</span>
            </button>
            <button
              onClick={() => handleRate('easy')}
              className="py-3 px-2 rounded-xl bg-slate-900 border border-emerald-500/30 hover:bg-emerald-950/40 hover:border-emerald-500 text-emerald-300 text-xs font-bold transition flex flex-col items-center gap-1 shadow-sm"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>완벽 숙지!</span>
            </button>
          </div>
        </div>
      ) : (
        /* Finish Screen */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">플래시카드 1회독 완료!</h3>
            <p className="text-xs text-slate-400 mt-1">
              에빙하우스 망각곡선을 이겨내고 기억을 탄탄하게 강화했습니다
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <div className="text-[11px] text-slate-400">완벽 숙지</div>
              <div className="text-lg font-black text-emerald-400">{masteredIds.length}개</div>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <div className="text-[11px] text-slate-400">복습 필요</div>
              <div className="text-lg font-black text-amber-400">
                {cards.length - masteredIds.length}개
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => handleRestart(false)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>전체 다시 학습</span>
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
