import React, { useState } from 'react';
import { FileText, Printer, Search, Sparkles, Volume2, BookOpen, CheckCircle, Tag, AlertTriangle } from 'lucide-react';
import { StudyPack } from '../types';

interface CheatSheetProps {
  pack: StudyPack;
  onSelectGame: (game: string) => void;
}

export const CheatSheet: React.FC<CheatSheetProps> = ({ pack, onSelectGame }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = Array.from(
    new Set(pack.concepts.map((c) => c.category).filter(Boolean))
  ) as string[];

  const filteredConcepts = pack.concepts.filter((c) => {
    const matchesSearch =
      c.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.englishTerm && c.englishTerm.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || c.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in print:text-black print:bg-white">
      {/* Action / Print Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">A+ 시험 직전 치트시트</h2>
              <span className="text-[11px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                {pack.major}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              시험장에 들고 들어가는 핵심 정의, 연상 암기팁, 함정 포인트 총정리
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>PDF 인쇄 / 저장</span>
          </button>
          <button
            onClick={() => onSelectGame('boss')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <Sparkles className="w-4 h-4" />
            <span>보스 레이드로 시험보기</span>
          </button>
        </div>
      </div>

      {/* Summary Briefing Box */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
          <BookOpen className="w-4 h-4" />
          <span>시험 5분 전 총평 브리핑</span>
        </div>
        <h3 className="text-lg font-bold text-white">{pack.title}</h3>
        <p className="text-xs text-slate-300 leading-relaxed">{pack.summary}</p>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="개념어, 영문 용어, 키워드 검색..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            전체 ({pack.concepts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Concept Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredConcepts.map((item, idx) => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md hover:border-slate-700 transition"
          >
            {/* Title & Tag */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-bold text-white">{item.term}</h4>
                </div>
                {item.englishTerm && (
                  <div className="text-[11px] text-slate-400 ml-7">{item.englishTerm}</div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {item.category && (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md border border-slate-700">
                    {item.category}
                  </span>
                )}
                <button
                  onClick={() => handleSpeak(`${item.term}. ${item.definition}`)}
                  className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
                  title="발음 듣기"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Core Definition */}
            <p className="text-xs text-slate-300 leading-relaxed pl-7">
              {item.definition}
            </p>

            {/* Key Point Box */}
            <div className="ml-7 p-2.5 bg-slate-850 rounded-xl border border-slate-800 text-[11px] text-indigo-300 flex items-start gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-200">시험 기출 포인트: </span>
                <span>{item.keyPoint}</span>
              </div>
            </div>

            {/* Mnemonic Hook */}
            {item.mnemonic && (
              <div className="ml-7 text-[11px] text-amber-300/90 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>암기 공식: {item.mnemonic}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
