import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Target, Trophy, RotateCcw, Clock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { StudyPack, BlankQuestion } from '../../types';
import { sounds } from '../../utils/audio';

interface BlankShooterProps {
  pack: StudyPack;
  onAddXp: (amount: number) => void;
  onBackToOverview: () => void;
}

export const BlankShooter: React.FC<BlankShooterProps> = ({ pack, onAddXp, onBackToOverview }) => {
  const questions: BlankQuestion[] = pack.blankShooter && pack.blankShooter.length > 0
    ? pack.blankShooter
    : [
        {
          id: 'b1',
          sentenceWithBlank: '가상 메모리에서 요구된 페이지가 RAM에 없을 때 발생하는 현상을 [ ___ ](이)라 한다.',
          answer: '페이지 폴트',
          distractors: ['문맥 교환', '세마포어', '데드락'],
          hint: 'Page Fault',
        },
      ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  const currentQ = questions[currentIndex] || questions[0];

  useEffect(() => {
    if (currentQ) {
      const all = [currentQ.answer, ...currentQ.distractors].sort(() => Math.random() - 0.5);
      setShuffledOptions(all);
      setTimeLeft(15);
      setSelectedWord(null);
      setIsAnswered(false);
    }
  }, [currentIndex, pack]);

  // Timer per question
  useEffect(() => {
    if (isAnswered || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswered, isFinished, currentIndex]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    setCombo(0);
    sounds.playError();
  };

  const handleSelect = (word: string) => {
    if (isAnswered) return;
    setSelectedWord(word);
    setIsAnswered(true);

    const isCorrect = word === currentQ.answer;

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      sounds.playCombo(newCombo);
      const gained = 150 + timeLeft * 10 + newCombo * 20;
      setScore((s) => s + gained);
    } else {
      setCombo(0);
      sounds.playError();
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      sounds.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      onAddXp(Math.floor(score / 8) + 40);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setIsFinished(false);
    setSelectedWord(null);
    setIsAnswered(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">블랭크 슈터 (빈칸 타격)</h2>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              시험 빈출 정의문의 [빈칸]에 들어갈 정확한 학술 용어를 저격하세요!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {combo >= 2 && (
            <div className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl animate-pulse">
              🔥 {combo} COMBO
            </div>
          )}
          <div className="text-sm font-bold text-emerald-300 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
            {score.toLocaleString()}P
          </div>
        </div>
      </div>

      {!isFinished ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          {/* Time progress bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-1000 ${
                timeLeft <= 5 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${(timeLeft / 15) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5" /> 제한시간: {timeLeft}초
            </span>
            {currentQ.hint && (
              <span className="text-amber-400/90 font-medium">💡 힌트: {currentQ.hint}</span>
            )}
          </div>

          {/* Target Sentence Box */}
          <div className="bg-slate-950/80 border-2 border-slate-800 p-6 rounded-2xl text-center relative">
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQ.sentenceWithBlank.split('[ ___ ]').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span
                      className={`inline-block mx-1.5 px-3 py-1 rounded-xl font-black text-sm sm:text-base border transition-all ${
                        isAnswered
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-indigo-600/20 border-indigo-500 text-indigo-300 animate-pulse'
                      }`}
                    >
                      {isAnswered ? currentQ.answer : '❓ [  빈  칸  ]'}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </p>
          </div>

          {/* Answer Options as Target Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {shuffledOptions.map((word, idx) => {
              const isSelected = selectedWord === word;
              const isCorrect = word === currentQ.answer;

              let style = 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200';
              if (isAnswered) {
                if (isCorrect) {
                  style = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                } else if (isSelected) {
                  style = 'bg-rose-950/60 border-rose-500 text-rose-300';
                } else {
                  style = 'opacity-30 border-slate-800 text-slate-500';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(word)}
                  disabled={isAnswered}
                  className={`p-4 rounded-xl border text-sm sm:text-base font-bold transition flex items-center justify-between group ${style}`}
                >
                  <span>{word}</span>
                  {isAnswered && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Next */}
          {isAnswered && (
            <div className="pt-2 animate-fade-in flex items-center justify-between bg-slate-850 p-4 rounded-2xl border border-slate-700">
              <div className="text-xs">
                {selectedWord === currentQ.answer ? (
                  <span className="text-emerald-400 font-bold">🎯 빈칸 정답 저격 성공! (+150P)</span>
                ) : (
                  <span className="text-rose-400 font-bold">
                    정답: &quot;{currentQ.answer}&quot; 입니다.
                  </span>
                )}
              </div>
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md"
              >
                <span>{currentIndex + 1 < questions.length ? '다음 문제' : '결과 확인'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Result Screen */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">블랭크 슈터 완파!</h3>
            <p className="text-xs text-slate-400 mt-1">
              시험 문제에 괄호로 나오는 핵심 키워드를 모두 마스터했습니다
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl min-w-[120px]">
              <div className="text-[11px] text-slate-400">최종 점수</div>
              <div className="text-lg font-black text-emerald-400">{score.toLocaleString()}P</div>
            </div>
            <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl min-w-[120px]">
              <div className="text-[11px] text-slate-400">획득 학점 XP</div>
              <div className="text-lg font-black text-indigo-400">
                +{Math.floor(score / 8) + 40} XP
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시 도전하기</span>
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
