import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, X, BookOpen, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { StudyPack } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPackCreated: (pack: StudyPack) => void;
  onSelectPreset: (packId: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onPackCreated,
  onSelectPreset,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'presets'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [subjectHint, setSubjectHint] = useState('');
  const [difficulty, setDifficulty] = useState<'basic' | 'exam_ready' | 'hardcore'>('exam_ready');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const loadingSteps = [
    '강의자료 PDF 문서를 정밀 파싱하고 있습니다...',
    'Gemini AI가 대학 시험 빈출 핵심 개념어를 추출 중입니다...',
    '보스 레이드 및 시험 낚시(OX) 퀴즈 문제를 생성하고 있습니다...',
    '스피드 매칭 및 블랭크 슈터 게임 스테이지를 조립하는 중...',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!subjectHint) {
        // Auto infer hint from file name
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setSubjectHint(cleanName);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (!subjectHint) {
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setSubjectHint(cleanName);
      }
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  };

  const handleStartAnalysis = async () => {
    if (!file && !rawText.trim()) {
      setErrorMessage('PDF 파일을 첨부하거나 강의 텍스트를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 2400);

    try {
      let pdfBase64: string | undefined = undefined;
      let textContent = rawText.trim();

      if (file) {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          pdfBase64 = await readFileAsBase64(file);
        } else {
          // txt or md files
          textContent = await readFileAsText(file);
        }
      }

      const res = await fetch('/api/extract-study-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64,
          rawText: textContent,
          fileName: file?.name,
          subjectHint,
          difficulty,
        }),
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (!res.ok || !data.success) {
        throw new Error(data.error || '스터디 팩 생성 중 오류가 발생했습니다.');
      }

      const generatedPack: StudyPack = {
        ...data.data,
        id: 'pack-' + Date.now(),
        createdAt: new Date().toISOString().split('T')[0],
        sourceFileName: file?.name || '직접 입력한 강의노트',
        stats: {
          timesStudied: 0,
        },
      };

      onPackCreated(generatedPack);
      onClose();
    } catch (err: any) {
      clearInterval(stepInterval);
      setErrorMessage(err.message || '분석 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                새로운 강의자료로 게임 팩 만들기
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-medium px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Gemini 3.8 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                PDF를 올리면 AI가 시험에 나올 중요 개념과 보스 레이드 퀴즈를 자동 제작합니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              강의자료 PDF 업로드
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'text'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              텍스트 / 요약본 붙여넣기
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              전공별 추천 샘플 팩
            </button>
          </div>

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  file
                    ? 'border-indigo-500 bg-indigo-500/5'
                    : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50 bg-slate-900/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.md"
                  className="hidden"
                />
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                  <Upload className="w-6 h-6" />
                </div>
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-indigo-300 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • 파일 선택 완료 (클릭하여 변경)
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-slate-200">
                      강의자료 PDF를 이곳에 드래그하거나 클릭하여 선택하세요
                    </p>
                    <p className="text-xs text-slate-500">
                      수업 슬라이드, 전공 서적 발췌본, 족보 요약본 (.pdf, .txt, .md 지원)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>강의 내용 또는 족보 요약 텍스트</span>
                <span className="text-slate-500 text-[11px]">{rawText.length}자</span>
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="교수님 강의 노트, 중간고사 요약정리, 시험 범위 개념들을 여기에 복사해 넣으세요..."
                rows={7}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          )}

          {activeTab === 'presets' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                PDF 준비가 아직 안 되셨나요? 아래 검증된 명문대 전공 기출 팩으로 바로 플레이해보세요:
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: 'cs-os-memory',
                    title: '💻 컴퓨터공학: 운영체제 & 가상 메모리 기출',
                    desc: '가상메모리, 페이지 폴트, 교착상태 4조건, 세마포어, 스래싱 완벽 대비',
                    tags: ['CS전공', '중간고사 단골', '기술면접'],
                  },
                  {
                    id: 'biz-marketing',
                    title: '📈 경영학: 마케팅 원론 & 전략 프레임워크',
                    desc: 'STP 전략, 4P 믹스, SWOT 분석, 제품수명주기(PLC), 가격탄력성',
                    tags: ['경영전공', '핵심 이론', 'A+ 필수'],
                  },
                  {
                    id: 'bio-cell',
                    title: '🧬 생명과학: 세포생물학 & 유전 메커니즘',
                    desc: '중심원리(DNA-RNA-단백질), 미토콘드리아 ATP 합성, 해당과정, 감수분열',
                    tags: ['바이오/의약', '분자생물학', '킬러문항'],
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectPreset(item.id);
                      onClose();
                    }}
                    className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 rounded-xl text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                      <div className="flex gap-1.5 mt-2">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] bg-slate-700/70 text-slate-300 px-2 py-0.5 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {/* Optional hints & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    과목/단원 힌트 (선택)
                  </label>
                  <input
                    type="text"
                    value={subjectHint}
                    onChange={(e) => setSubjectHint(e.target.value)}
                    placeholder="예: 운영체제 7단원, 마케팅원론, 민법총칙"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    시험 난이도 설정
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: 'basic', label: '기본 교양', desc: '개념 이해' },
                      { key: 'exam_ready', label: 'A+ 정복', desc: '실전 기출' },
                      { key: 'hardcore', label: '하드코어', desc: '함정/심화' },
                    ].map((d) => (
                      <button
                        type="button"
                        key={d.key}
                        onClick={() => setDifficulty(d.key as any)}
                        className={`py-1.5 px-2 rounded-lg text-center transition border text-xs ${
                          difficulty === d.key
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <div>{d.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab !== 'presets' && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              💡 시험에 자주 헷갈리는 함정 선지까지 자동 생성됩니다
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                취소
              </button>
              <button
                onClick={handleStartAnalysis}
                disabled={isLoading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI 암기 게임 생성 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>게임 팩 생성하기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay with steps */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-500/30 animate-pulse">
                <Sparkles className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              대학생 맞춤형 암기 퀘스트 제작 중!
            </h3>
            <p className="text-xs text-indigo-400 font-medium mb-6 animate-pulse">
              {loadingSteps[loadingStep]}
            </p>

            <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
