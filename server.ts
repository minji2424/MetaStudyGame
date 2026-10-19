import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Increase body parser limit for PDF base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Gemini AI initialization
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// AI extraction endpoint for PDF & text materials
app.post('/api/extract-study-pack', async (req, res) => {
  try {
    const { pdfBase64, rawText, fileName, subjectHint, difficulty = 'exam_ready' } = req.body;

    if (!pdfBase64 && !rawText) {
      return res.status(400).json({ error: '강의자료 PDF 파일 또는 텍스트 내용이 필요합니다.' });
    }

    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY가 설정되지 않았습니다. Settings > Secrets에서 키를 등록해주세요.',
        fallbackAvailable: true,
      });
    }

    const systemInstruction = `당신은 명문 대학교 전공 시험 출제 위원이자 인지과학 기반의 에듀테크 게임 디자이너입니다.
대학생들이 중간고사/기말고사/자격증 시험에서 A+를 받을 수 있도록, 제공된 강의자료(PDF 또는 텍스트)를 정밀 분석하여
1) 핵심 학술 개념 및 정의 (8~16개)
2) 시험 빈출 4지선다 보스 퀴즈 (5~8개)
3) 괄호 채우기 블랭크 슈터 문제 (5~8개)
4) 시험 낚시 방지 OX 서바이벌 문제 (6~10개)
5) 플래시카드 복습 세트 (8~12개)
를 풍부하고 흥미진진하게 한국어로 추출하세요.

난이도 수준 (${difficulty}):
- 'basic': 1~2학년 교양 및 기초 전공 필수 개념 중심
- 'exam_ready': 중간/기말고사 기출 수준의 정밀한 정의, 상호 비교, 핵심 이론 포함
- 'hardcore': 고난도 응용, 반례, 심화 메커니즘, 함정형 빈출 오답 포인트 적극 포함`;

    const contents: any[] = [];

    if (pdfBase64) {
      // Clean base64 string if it contains data URI prefix
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64,
        },
      });
    }

    const userPrompt = `이 강의자료를 분석하여 대학생 암기 게임용 스터디 팩을 생성해 주세요.
${fileName ? `파일명: ${fileName}` : ''}
${subjectHint ? `전공/과목 힌트: ${subjectHint}` : ''}
${rawText ? `\n[강의 노트/자료 텍스트]\n${rawText.slice(0, 30000)}` : ''}

반드시 지정된 JSON 스키마 규격으로 정교하게 응답해 주세요.`;

    contents.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: '강의 자료 또는 단원의 직관적인 제목 (예: 컴퓨터 구조와 운영체제 핵심 요약)',
            },
            major: {
              type: Type.STRING,
              description: '전공 분류 (예: 컴퓨터공학, 경영학, 생명과학, 법학, 인문학, 공학 등)',
            },
            summary: {
              type: Type.STRING,
              description: '이 단원의 전체 맥락을 짚어주는 2-3줄의 핵심 시험 요약 브리핑',
            },
            estimatedStudyTimeMinutes: {
              type: Type.INTEGER,
              description: '예상 마스터 시간(분)',
            },
            concepts: {
              type: Type.ARRAY,
              description: '8~16개의 중요 전공 핵심 개념',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  term: { type: Type.STRING, description: '개념어/전문용어/이론명 (예: 가상 메모리)' },
                  englishTerm: { type: Type.STRING, description: '영문 표기/약어 (예: Virtual Memory)' },
                  definition: { type: Type.STRING, description: '핵심 정의 (간결하고 명쾌한 1-2문장)' },
                  keyPoint: { type: Type.STRING, description: '시험에 직결되는 핵심 키포인트 또는 공식/원리' },
                  mnemonic: { type: Type.STRING, description: '기억에 남는 암기 팁이나 연상 힌트' },
                  difficulty: { type: Type.INTEGER, description: '1(기초), 2(보통), 3(심화)' },
                  category: { type: Type.STRING, description: '소주제 분류 (예: 메모리 관리)' },
                },
                required: ['id', 'term', 'definition', 'keyPoint', 'difficulty'],
              },
            },
            bossBattle: {
              type: Type.ARRAY,
              description: '학점 보스 격파용 4지선다형 시험 퀴즈 (5~8문제)',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING, description: '전공 시험 스타일 질문' },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '선택지 4개',
                  },
                  correctIndex: { type: Type.INTEGER, description: '정답 인덱스 (0~3)' },
                  explanation: { type: Type.STRING, description: '상세 해설 및 오답 노트' },
                  trapTip: { type: Type.STRING, description: '학생들이 시험에서 자주 낚이는 오답 포인트' },
                },
                required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
              },
            },
            blankShooter: {
              type: Type.ARRAY,
              description: '괄호/빈칸 채우기 게임용 문장 (5~8문제)',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  sentenceWithBlank: {
                    type: Type.STRING,
                    description: '빈칸이 [___] 로 표시된 핵심 정의 문장',
                  },
                  answer: { type: Type.STRING, description: '빈칸에 들어갈 정확한 학술 개념어' },
                  distractors: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '오답용 보기 3개',
                  },
                  hint: { type: Type.STRING, description: '결정적 힌트' },
                },
                required: ['id', 'sentenceWithBlank', 'answer', 'distractors'],
              },
            },
            oxSurvival: {
              type: Type.ARRAY,
              description: '시험 낚시 방지 OX 서바이벌 문제 (6~10문제)',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  statement: { type: Type.STRING, description: '참/거짓을 판별할 단언형 진술문' },
                  isTrue: { type: Type.BOOLEAN, description: '참(true) 또는 거짓(false)' },
                  explanation: { type: Type.STRING, description: '왜 맞거나 틀렸는지 명확한 학술적 근거' },
                },
                required: ['id', 'statement', 'isTrue', 'explanation'],
              },
            },
            flashcards: {
              type: Type.ARRAY,
              description: '플래시카드 암기 세트 (8~12개)',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  front: { type: Type.STRING, description: '카드 앞면 질문/개념' },
                  back: { type: Type.STRING, description: '카드 뒷면 정답 및 핵심 요점' },
                  tip: { type: Type.STRING, description: '암기 보조 연상 단서' },
                },
                required: ['id', 'front', 'back'],
              },
            },
          },
          required: ['title', 'major', 'summary', 'concepts', 'bossBattle', 'blankShooter', 'oxSurvival', 'flashcards'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error generating study pack:', error);
    return res.status(500).json({
      error: error?.message || '강의자료 분석 중 오류가 발생했습니다.',
    });
  }
});

// Socratic AI Hint generator during games
app.post('/api/game-hint', async (req, res) => {
  try {
    const { term, question, context } = req.body;
    if (!ai) {
      return res.json({
        hint: '💡 힌트: 이 개념의 핵심 기능과 다른 유사 개념과의 차이점을 상기해보세요!',
      });
    }

    const prompt = `대학생 학습자가 퀴즈를 풀다가 막혔습니다.
문제/개념: "${question || term}"
맥락: "${context || ''}"
정답을 바로 알려주지 말고, 학생이 스스로 유추할 수 있도록 1~2문장의 친절하고 예리한 소크라테스식 힌트를 한국어로 제공해 주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({ hint: response.text || '핵심 원리를 떠올려보세요!' });
  } catch (err: any) {
    return res.json({ hint: '💡 연관된 기본 정의와 적용 사례를 다시 살펴보세요!' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MetaStudy Quest server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
