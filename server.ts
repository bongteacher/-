import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const WORKSHEETS_FILE = path.join(DATA_DIR, 'worksheets.json');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Initial sample data if empty so the teacher immediately sees a polished sample matching the screenshot
function initializeSampleDataIfEmpty() {
  const existing = readJsonFile<any[]>(WORKSHEETS_FILE, []);
  if (existing.length === 0) {
    const sampleWorksheet = {
      id: 'ws-sample-quadratic-001',
      title: '곡선 속에 숨겨진 비밀, 이차함수의 기본과 평행이동',
      subject: '수학 공통',
      gradeLevel: '고등학교 1학년',
      difficulty: '표준',
      topic: '이차함수의 정의, 기본형 y=ax^2의 그래프의 성질, 표준형 y=a(x-p)^2+q 평행이동의 원리',
      considerations: '오개념 OX 퀴즈 포함, 실생활 포물선 예시, 스스로 점검 포함',
      status: '배포 중',
      aiPedagogyIntent: '이차함수의 기본 개념인 $y=ax^2$의 그래프 성질을 명확히 하고, 표준형 $y=a(x-p)^2+q$로의 평행이동을 이해하는 것이 핵심입니다. 학생들은 주로 $x$축 평행이동 시 부호를 반대로 적용하는 실수와, $a$의 절댓값 크기와 그래프 폭의 관계를 반대로 생각하는 오개념을 가집니다. 도입부에서 실생활의 포물선을 통해 흥미를 유발하고(scenario), 빈칸 채우기(fill_blank)로 기본 정의와 성질을 정리합니다. 이어서 자주 발생하는 오개념을 OX 퀴즈(ox_fix)로 짚어낸 뒤, 구체적인 예제(worked_example)와 성질 분류 표(table)를 통해 식의 변화를 체계적으로 훈련합니다. 마지막으로 서술형 및 격자 좌표 입력 문항(short_answer)으로 적용력을 확인하고 스스로 점검(self_check)하도록 설계했습니다.',
      coreConcept: '이차함수 $y = ax^2$의 그래프를 평행이동하여 모든 이차함수 $y = a(x - p)^2 + q$의 성질을 설명할 수 있습니다.',
      learningObjectives: [
        '이차함수의 정의와 $y = ax^2$ 그래프의 특징을 설명할 수 있다.',
        '이차함수 그래프의 평행이동을 이해하고 꼭짓점과 축의 방정식을 구할 수 있다.',
        '이차함수의 식을 보고 그래프의 개형을 예측하여 성질을 분석할 수 있다.',
      ],
      sections: [
        {
          id: 'sec-1',
          type: 'warmup',
          title: '생각 열기: 우리가 만드는 아름다운 곡선, 포물선',
          content: '농구공을 던졌을 때 그리는 궤적이나 분수대에서 뿜어져 나오는 물줄기를 본 적이 있나요? 이러한 부드러운 곡선을 수학에서는 ( 1 )이라고 부릅니다. 이 아름다운 곡선 속에 어떤 수학적 규칙이 숨어 있을까요?',
          blanks: [
            {
              id: 'b-1',
              order: 1,
              activityId: 'sec-1',
              activityTitle: '생각 열기: 우리가 만드는 아름다운 곡선, 포물선',
              questionText: '농구공이나 분수대 물줄기가 그리는 부드러운 곡선',
              correctAnswer: '포물선',
              acceptableAnswers: ['포물선', '이차함수 그래프'],
              type: 'fill_blank',
            },
          ],
        },
        {
          id: 'sec-2',
          type: 'concept',
          title: '개념 이해: 이차함수의 뜻과 기본 그래프의 성질',
          content: '함수 $y = f(x)$에서 $y$가 $x$에 대한 이차식 $y = ax^2 + bx + c$ ($a \\neq 0$)로 나타내어질 때, 이 함수를 $x$에 대한 ( 2 )라고 합니다.\n기본형 $y = ax^2$의 그래프는 원점을 꼭짓점으로 하고, ( 3 )을 축으로 하는 포물선입니다.\n$a > 0$이면 ( 4 )로 볼록하고, $a < 0$이면 ( 5 )로 볼록합니다. 또한 $a$의 ( 6 )이 클수록 그래프의 폭은 좁아집니다.',
          blanks: [
            {
              id: 'b-2',
              order: 2,
              activityId: 'sec-2',
              activityTitle: '개념 이해: 이차함수의 뜻과 기본 그래프의 성질',
              questionText: '함수 y=f(x)에서 y가 x에 대한 이차식으로 나타내어질 때의 명칭',
              correctAnswer: '이차함수',
              acceptableAnswers: ['이차함수'],
              type: 'fill_blank',
            },
            {
              id: 'b-3',
              order: 3,
              activityId: 'sec-2',
              activityTitle: '개념 이해: 이차함수의 뜻과 기본 그래프의 성질',
              questionText: '기본형 y=ax^2의 대칭축',
              correctAnswer: 'y 또는 y축',
              acceptableAnswers: ['y축', 'y', 'x=0'],
              type: 'fill_blank',
            },
            {
              id: 'b-4',
              order: 4,
              activityId: 'sec-2',
              activityTitle: '개념 이해: 이차함수의 뜻과 기본 그래프의 성질',
              questionText: 'a > 0일 때 볼록한 방향',
              correctAnswer: '아래',
              acceptableAnswers: ['아래', '아래로'],
              type: 'fill_blank',
            },
            {
              id: 'b-5',
              order: 5,
              activityId: 'sec-2',
              activityTitle: '개념 이해: 이차함수의 뜻과 기본 그래프의 성질',
              questionText: 'a < 0일 때 볼록한 방향',
              correctAnswer: '위',
              acceptableAnswers: ['위', '위로'],
              type: 'fill_blank',
            },
            {
              id: 'b-6',
              order: 6,
              activityId: 'sec-2',
              activityTitle: '개념 이해: 이차함수의 뜻과 기본 그래프의 성질',
              questionText: '그래프의 폭을 결정하는 a의 값 형태',
              correctAnswer: '절댓값',
              acceptableAnswers: ['절댓값', '|a|'],
              type: 'fill_blank',
            },
          ],
        },
        {
          id: 'sec-3',
          type: 'activity',
          title: '활동 1: 내가 가진 오개념 바로잡기 (OX 퀴즈)',
          content: '다음 문장을 읽고 참이면 O, 거짓이면 X를 표시하세요.',
          blanks: [
            {
              id: 'b-7',
              order: 7,
              activityId: 'sec-3',
              activityTitle: '활동 1: 내가 가진 오개념 바로잡기',
              questionText: '함수 y = 1/(x^2)은 분모에 이차식이 있으므로 x에 대한 이차함수이다.',
              correctAnswer: 'X',
              acceptableAnswers: ['X', 'x'],
              type: 'ox',
              options: ['O', 'X'],
              explanation: '분모에 미지수가 있는 식은 다항식이 아니므로 이차함수가 아닙니다.',
            },
            {
              id: 'b-8',
              order: 8,
              activityId: 'sec-3',
              activityTitle: '활동 1: 내가 가진 오개념 바로잡기',
              questionText: '이차함수 y = -3x^2의 그래프는 y = 2x^2의 그래프보다 폭이 좁다.',
              correctAnswer: 'O',
              acceptableAnswers: ['O', 'o'],
              type: 'ox',
              options: ['O', 'X'],
              explanation: '|-3| = 3 > 2 이므로 절댓값이 더 큰 y = -3x^2의 폭이 더 좁습니다.',
            },
            {
              id: 'b-9',
              order: 9,
              activityId: 'sec-3',
              activityTitle: '활동 1: 내가 가진 오개념 바로잡기',
              questionText: 'y = 2(x - 3)^2 + 1의 그래프는 꼭짓점의 좌표가 (-3, 1)이다.',
              correctAnswer: 'X',
              acceptableAnswers: ['X', 'x'],
              type: 'ox',
              options: ['O', 'X'],
              explanation: 'x축 방향으로 +3만큼 평행이동한 것이므로 꼭짓점은 (3, 1)입니다.',
            },
          ],
        },
        {
          id: 'sec-4',
          type: 'activity',
          title: '활동 2: 평행이동과 표준형 완성하기',
          content: '이차함수 $y = 2x^2$의 그래프를 $x$축의 방향으로 $3$만큼, $y$축의 방향으로 $-4$만큼 평행이동한 식과 성질을 구해봅시다.',
          blanks: [
            {
              id: 'b-10',
              order: 10,
              activityId: 'sec-4',
              activityTitle: '활동 2: 평행이동과 표준형 완성하기',
              questionText: '평행이동한 이차함수의 식: y = 2(x - [  ])^2 - 4 에서 빈칸의 숫자',
              correctAnswer: '3',
              acceptableAnswers: ['3'],
              type: 'fill_blank',
            },
            {
              id: 'b-11',
              order: 11,
              activityId: 'sec-4',
              activityTitle: '활동 2: 평행이동과 표준형 완성하기',
              questionText: '이 포물선의 꼭짓점의 x좌표',
              correctAnswer: '3',
              acceptableAnswers: ['3'],
              type: 'fill_blank',
            },
            {
              id: 'b-12',
              order: 12,
              activityId: 'sec-4',
              activityTitle: '활동 2: 평행이동과 표준형 완성하기',
              questionText: '이 포물선의 꼭짓점의 y좌표',
              correctAnswer: '-4',
              acceptableAnswers: ['-4'],
              type: 'fill_blank',
            },
            {
              id: 'b-13',
              order: 13,
              activityId: 'sec-4',
              activityTitle: '활동 2: 평행이동과 표준형 완성하기',
              questionText: '축의 방정식 (x = ?)',
              correctAnswer: '3',
              acceptableAnswers: ['3', 'x=3'],
              type: 'fill_blank',
            },
          ],
        },
        {
          id: 'sec-5',
          type: 'self_check',
          title: '스스로 점검: 오늘 배운 내용 평가하기',
          content: '오늘 공부한 내용을 바탕으로 자신의 이해도를 확인해 보세요.\n1. 이차함수 그래프의 볼록 방향을 식에서 바로 찾을 수 있다. ( 14 )\n2. $y=a(x-p)^2+q$의 꼭짓점이 $(p, q)$임을 설명할 수 있다. ( 15 )\n3. 오늘 학습에서 가장 흥미로웠거나 더 알아보고 싶은 점을 한 줄로 적어보세요. ( 16 )',
          blanks: [
            {
              id: 'b-14',
              order: 14,
              activityId: 'sec-5',
              activityTitle: '스스로 점검: 오늘 배운 내용 평가하기',
              questionText: '1. 이차함수 그래프 볼록 방향 이해도',
              correctAnswer: '매우 잘함',
              acceptableAnswers: ['매우 잘함', '잘함', 'O', '보통'],
              type: 'fill_blank',
            },
            {
              id: 'b-15',
              order: 15,
              activityId: 'sec-5',
              activityTitle: '스스로 점검: 오늘 배운 내용 평가하기',
              questionText: '2. 꼭짓점 좌표 (p, q) 설명 가능 여부',
              correctAnswer: '매우 잘함',
              acceptableAnswers: ['매우 잘함', '잘함', 'O', '보통'],
              type: 'fill_blank',
            },
            {
              id: 'b-16',
              order: 16,
              activityId: 'sec-5',
              activityTitle: '스스로 점검: 오늘 배운 내용 평가하기',
              questionText: '3. 오늘 학습 성찰 한마디',
              correctAnswer: '자유 서술',
              acceptableAnswers: ['*'],
              type: 'short_answer',
            },
          ],
        },
      ],
      totalBlanksCount: 16,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile(WORKSHEETS_FILE, [sampleWorksheet]);

    // Sample student submission matching screenshot
    const sampleSubmission = {
      id: 'sub-sample-001',
      worksheetId: 'ws-sample-quadratic-001',
      studentNumber: '10101',
      studentName: '홍길동',
      submittedAt: '2026-10-01 13:15',
      answers: {
        'b-1': '',
        'b-2': '',
        'b-3': '',
        'b-4': '',
        'b-5': '',
        'b-6': '',
        'b-7': '',
        'b-8': '',
        'b-9': '',
        'b-10': '',
        'b-11': '',
        'b-12': '',
        'b-13': '',
        'b-14': '',
        'b-15': '',
        'b-16': '',
      },
      filledCount: 0,
      totalCount: 16,
      score: 0,
      maxScore: 16,
      gradedItems: [
        {
          blankId: 'b-1',
          activityTitle: '생각 열기: 우리가 만드는 아름다운 곡선, 포물선',
          questionText: '농구공이나 분수대 물줄기가 그리는 부드러운 곡선',
          studentAnswer: '',
          correctAnswer: '포물선',
          isCorrect: false,
        },
        {
          blankId: 'b-2',
          activityTitle: '개념 이해: 이차함수의 뜻과 기본 그래프의 성질',
          questionText: '함수 y=f(x)에서 y가 x에 대한 이차식으로 나타내어질 때의 명칭',
          studentAnswer: '',
          correctAnswer: '이차함수',
          isCorrect: false,
        },
        {
          blankId: 'b-3',
          activityTitle: '개념 이해: 이차함수의 뜻과 기본 그래프의 성질',
          questionText: '기본형 y=ax^2의 대칭축',
          studentAnswer: '',
          correctAnswer: 'y 또는 y축',
          isCorrect: false,
        },
        {
          blankId: 'b-4',
          activityTitle: '개념 이해: 이차함수의 뜻과 기본 그래프의 성질',
          questionText: 'a > 0일 때 볼록한 방향',
          studentAnswer: '',
          correctAnswer: '아래',
          isCorrect: false,
        },
        {
          blankId: 'b-5',
          activityTitle: '개념 이해: 이차함수의 뜻과 기본 그래프의 성질',
          questionText: 'a < 0일 때 볼록한 방향',
          studentAnswer: '',
          correctAnswer: '위',
          isCorrect: false,
        },
        {
          blankId: 'b-6',
          activityTitle: '개념 이해: 이차함수의 뜻과 기본 그래프의 성질',
          questionText: '그래프의 폭을 결정하는 a의 값 형태',
          studentAnswer: '',
          correctAnswer: '절댓값',
          isCorrect: false,
        },
        {
          blankId: 'b-7',
          activityTitle: '활동 1: 내가 가진 오개념 바로잡기',
          questionText: '함수 y = 1/(x^2)은 분모에 이차식이 있으므로 x에 대한 이차함수이다.',
          studentAnswer: '',
          correctAnswer: 'X',
          isCorrect: false,
        },
        {
          blankId: 'b-8',
          activityTitle: '활동 1: 내가 가진 오개념 바로잡기',
          questionText: '이차함수 y = -3x^2의 그래프는 y = 2x^2의 그래프보다 폭이 좁다.',
          studentAnswer: '',
          correctAnswer: 'O',
          isCorrect: false,
        },
      ],
    };
    writeJsonFile(SUBMISSIONS_FILE, [sampleSubmission]);
  }
}
initializeSampleDataIfEmpty();

// Helper to get GoogleGenAI instance
function getAiClient(customKey?: string) {
  const apiKey = (customKey && customKey.trim()) ? customKey.trim() : process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API 키가 설정되어 있지 않습니다.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// REST API Routes

// 1. Health check & configuration info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasEnvKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// 2. Storage statistics and data management (to ease user worry about quota)
app.get('/api/storage/stats', (req, res) => {
  const worksheets = readJsonFile<any[]>(WORKSHEETS_FILE, []);
  const submissions = readJsonFile<any[]>(SUBMISSIONS_FILE, []);
  
  let totalBytes = 0;
  try {
    if (fs.existsSync(WORKSHEETS_FILE)) totalBytes += fs.statSync(WORKSHEETS_FILE).size;
    if (fs.existsSync(SUBMISSIONS_FILE)) totalBytes += fs.statSync(SUBMISSIONS_FILE).size;
  } catch (e) {}

  res.json({
    worksheetCount: worksheets.length,
    submissionCount: submissions.length,
    usedBytes: totalBytes,
    usedKb: (totalBytes / 1024).toFixed(1),
    isUnlimitedLocal: true,
    message: '자체 로컬/서버 경량 스토리지로 저장되어 외부 클라우드 DB 요금이나 무료 용량 초과 걱정 없이 안전하게 보관됩니다.',
  });
});

// Export all data
app.get('/api/storage/export', (req, res) => {
  const worksheets = readJsonFile<any[]>(WORKSHEETS_FILE, []);
  const submissions = readJsonFile<any[]>(SUBMISSIONS_FILE, []);
  const settings = readJsonFile<any>(SETTINGS_FILE, {});
  
  res.setHeader('Content-Disposition', 'attachment; filename="worksheet_helper_backup.json"');
  res.setHeader('Content-Type', 'application/json');
  res.json({
    version: '2.8.0',
    exportedAt: new Date().toISOString(),
    worksheets,
    submissions,
    settings,
  });
});

// Import data
app.post('/api/storage/import', (req, res) => {
  try {
    const { worksheets, submissions } = req.body;
    if (Array.isArray(worksheets)) {
      writeJsonFile(WORKSHEETS_FILE, worksheets);
    }
    if (Array.isArray(submissions)) {
      writeJsonFile(SUBMISSIONS_FILE, submissions);
    }
    res.json({ success: true, message: '데이터가 성공적으로 복원되었습니다.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '데이터 복원 실패' });
  }
});

// 3. Worksheets CRUD
app.get('/api/worksheets', (req, res) => {
  const worksheets = readJsonFile<any[]>(WORKSHEETS_FILE, []);
  const submissions = readJsonFile<any[]>(SUBMISSIONS_FILE, []);

  // Enrich with submission count
  const enriched = worksheets.map(ws => {
    const count = submissions.filter(s => s.worksheetId === ws.id).length;
    return {
      ...ws,
      submissionCount: count,
    };
  });
  res.json(enriched);
});

app.get('/api/worksheets/:id', (req, res) => {
  const worksheets = readJsonFile<any[]>(WORKSHEETS_FILE, []);
  const ws = worksheets.find(w => w.id === req.params.id);
  if (!ws) {
    return res.status(404).json({ error: '학습지를 찾을 수 없습니다.' });
  }
  const submissions = readJsonFile<any[]>(SUBMISSIONS_FILE, []);
  const count = submissions.filter(s => s.worksheetId === ws.id).length;
  res.json({ ...ws, submissionCount: count });
});

app.post('/api/worksheets', (req, res) => {
  try {
    const worksheets = readJsonFile<any[]>(WORKSHEETS_FILE, []);
    const worksheetData = req.body;

    if (!worksheetData.id) {
      worksheetData.id = 'ws-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    }
    worksheetData.updatedAt = new Date().toISOString();
    if (!worksheetData.createdAt) {
      worksheetData.createdAt = new Date().toISOString();
    }

    // Count blanks
    let totalBlanks = 0;
    if (worksheetData.sections && Array.isArray(worksheetData.sections)) {
      for (const sec of worksheetData.sections) {
        if (sec.blanks && Array.isArray(sec.blanks)) {
          totalBlanks += sec.blanks.length;
        }
      }
    }
    worksheetData.totalBlanksCount = totalBlanks;

    const index = worksheets.findIndex(w => w.id === worksheetData.id);
    if (index >= 0) {
      worksheets[index] = worksheetData;
    } else {
      worksheets.unshift(worksheetData);
    }

    writeJsonFile(WORKSHEETS_FILE, worksheets);
    res.json(worksheetData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || '학습지 저장 실패' });
  }
});

app.delete('/api/worksheets/:id', (req, res) => {
  try {
    let worksheets = readJsonFile<any[]>(WORKSHEETS_FILE, []);
    worksheets = worksheets.filter(w => w.id !== req.params.id);
    writeJsonFile(WORKSHEETS_FILE, worksheets);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '학습지 삭제 실패' });
  }
});

// 4. Submissions CRUD & Auto-Grading
app.get('/api/worksheets/:id/submissions', (req, res) => {
  const submissions = readJsonFile<any[]>(SUBMISSIONS_FILE, []);
  const filtered = submissions.filter(s => s.worksheetId === req.params.id);
  res.json(filtered);
});

app.post('/api/worksheets/:id/submissions', (req, res) => {
  try {
    const worksheetId = req.params.id;
    const worksheets = readJsonFile<any[]>(WORKSHEETS_FILE, []);
    const ws = worksheets.find(w => w.id === worksheetId);
    if (!ws) {
      return res.status(404).json({ error: '해당 학습지를 찾을 수 없습니다.' });
    }

    const { studentNumber, studentName, answers } = req.body;
    if (!studentNumber || !studentName) {
      return res.status(400).json({ error: '학번과 이름을 모두 입력해 주세요.' });
    }

    // Auto-grading logic against blanks in the worksheet
    let score = 0;
    let maxScore = 0;
    let filledCount = 0;
    const gradedItems: any[] = [];

    const allBlanks: any[] = [];
    ws.sections.forEach((sec: any) => {
      if (sec.blanks) {
        sec.blanks.forEach((b: any) => {
          allBlanks.push({ ...b, sectionTitle: sec.title });
        });
      }
    });

    const totalCount = allBlanks.length;

    for (const blank of allBlanks) {
      const studentAnsRaw = (answers && answers[blank.id] !== undefined) ? String(answers[blank.id]).trim() : '';
      const isFilled = studentAnsRaw.length > 0;
      if (isFilled) filledCount++;

      // Check correctness
      let isCorrect = false;
      const cleanStudent = studentAnsRaw.replace(/\s+/g, '').toLowerCase();
      const cleanCorrect = (blank.correctAnswer || '').replace(/\s+/g, '').toLowerCase();

      if (blank.type === 'ox') {
        const normStudent = cleanStudent.toUpperCase();
        const normCorrect = cleanCorrect.toUpperCase();
        isCorrect = normStudent === normCorrect;
      } else if (blank.acceptableAnswers && Array.isArray(blank.acceptableAnswers) && blank.acceptableAnswers.length > 0) {
        if (blank.acceptableAnswers.includes('*')) {
          // Free short answer - marked as credit if student wrote something
          isCorrect = isFilled;
        } else {
          isCorrect = blank.acceptableAnswers.some((ans: string) => {
            const cleanA = ans.replace(/\s+/g, '').toLowerCase();
            return cleanA === cleanStudent || cleanStudent.includes(cleanA) || cleanA.includes(cleanStudent);
          });
        }
      } else {
        isCorrect = cleanStudent === cleanCorrect;
      }

      if (blank.type !== 'short_answer' || !blank.acceptableAnswers?.includes('*')) {
        maxScore++;
        if (isCorrect) score++;
      } else {
        // self check / open ended
        maxScore++;
        if (isFilled) score++;
      }

      gradedItems.push({
        blankId: blank.id,
        activityTitle: blank.activityTitle || blank.sectionTitle,
        questionText: blank.questionText || '',
        studentAnswer: studentAnsRaw,
        correctAnswer: blank.correctAnswer || '',
        isCorrect,
      });
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newSubmission = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      worksheetId,
      studentNumber,
      studentName,
      submittedAt: formattedDate,
      answers: answers || {},
      filledCount,
      totalCount,
      score,
      maxScore,
      gradedItems,
    };

    const submissions = readJsonFile<any[]>(SUBMISSIONS_FILE, []);
    // If student with same studentNumber already submitted, update or append
    submissions.unshift(newSubmission);
    writeJsonFile(SUBMISSIONS_FILE, submissions);

    res.json({
      success: true,
      submission: newSubmission,
      message: '성공적으로 제출되었습니다!',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '답안 제출 처리 중 오류가 발생했습니다.' });
  }
});

// Toggle grading check (teacher overrides O/X in detailed view)
app.put('/api/submissions/:id/toggle-grade', (req, res) => {
  try {
    const { blankId } = req.body;
    const submissions = readJsonFile<any[]>(SUBMISSIONS_FILE, []);
    const sub = submissions.find(s => s.id === req.params.id);
    if (!sub) {
      return res.status(404).json({ error: '제출 답안을 찾을 수 없습니다.' });
    }

    const item = sub.gradedItems.find((gi: any) => gi.blankId === blankId);
    if (item) {
      item.isCorrect = !item.isCorrect;
      item.teacherOverridden = true;
      // Recompute total score
      sub.score = sub.gradedItems.filter((gi: any) => gi.isCorrect).length;
      writeJsonFile(SUBMISSIONS_FILE, submissions);
      return res.json(sub);
    }
    res.status(404).json({ error: '문항을 찾을 수 없습니다.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '채점 변경 실패' });
  }
});

// Delete submission
app.delete('/api/submissions/:id', (req, res) => {
  try {
    let submissions = readJsonFile<any[]>(SUBMISSIONS_FILE, []);
    submissions = submissions.filter(s => s.id !== req.params.id);
    writeJsonFile(SUBMISSIONS_FILE, submissions);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '제출 내역 삭제 실패' });
  }
});

// 5. AI Worksheet Generation Endpoint
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { topic, subject, gradeLevel, difficulty, considerations, userApiKey } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: '수업 주제 또는 교과서 지문을 입력해 주세요.' });
    }

    const ai = getAiClient(userApiKey);

    const systemInstruction = `
당신은 대한민국 교육과정에 정통한 최고의 수업 설계 및 학습지 제작 전문가 AI입니다.
교사가 입력한 수업 주제, 과목, 학년, 난이도, 희망사항을 바탕으로 학생들의 적극적인 참여와 깊이 있는 이해를 유도하는 체계적인 학습지를 JSON 형식으로 작성하세요.

[학습지 구조 필수 요구사항]
1. 제목: 학생들의 호기심을 자극하는 멋진 부제목과 본제목 (예: "곡선 속에 숨겨진 비밀, 이차함수의 기본과 평행이동")
2. 과목 및 학년: 적절한 과목명(예: 수학 공통, 통합사회, 생명과학, 국어 등)과 학년
3. AI의 수업 설계 의도 (aiPedagogyIntent): 교과 성취기준, 왜 이런 활동 순서로 설계했는지, 학생들이 가질 만한 오개념과 이를 극복하기 위한 교수학적 전략을 3~5문장으로 상세히 서술
4. 핵심 개념 (coreConcept): 해당 차시에서 반드시 기억해야 할 핵심 원리나 공식 1~2문장
5. 학습 목표 (learningObjectives): 3개의 명확하고 측정 가능한 행동 동사 형태의 학습 목표
6. 학습지 섹션 (sections):
   - 생각 열기 (type: "warmup"): 실생활 연결 질문, 호기심 유발 상황 제시 및 빈칸/생각 적기 1~2개
   - 개념 이해 (type: "concept"): 핵심 개념을 정리하며 괄호 채우기(fill_blank) 문항 3~6개 포함. 본문 안에서 ( 1 ), ( 2 ) 형태로 번호 표기
   - 활동 (type: "activity"): 1~2개의 활동. 예:
       * "활동 1: 내가 가진 오개념 바로잡기 (OX 퀴즈)" - type: "ox", options: ["O", "X"], 오개념을 짚는 OX 퀴즈 2~4개
       * "활동 2: 적용 및 문제 해결" - 표 정리, 계산, 조건 적용 등 fill_blank 또는 choice 2~4개
   - 스스로 점검 (type: "self_check"): 학습 성찰 체크리스트 2~3개 (type: "fill_blank" 또는 "short_answer")

[문항(blanks) 규격]:
- 각 빈칸/문항은 id, order(1부터 시작하는 연속 번호), questionText(문항 요약 설명), correctAnswer(모범 정답), acceptableAnswers(동의어 인정 목록), type("fill_blank" | "ox" | "short_answer" | "choice")을 정확히 가져야 합니다.
- 수식이 필요한 경우 LaTeX 표기법 ($...$)을 적극 활용하세요.
`;

    const prompt = `
[수업 설계 요청]
- 수업 주제 / 교과서 지문: ${topic}
- 과목: ${subject || 'AI 판단'}
- 대상 학년: ${gradeLevel || '고등학교 1학년'}
- 난이도: ${difficulty || '표준'}
- 희망사항: ${considerations || '없음'}

위 내용을 바탕으로 학생용 학습지를 정교하게 설계하여 지정된 JSON 스키마로 반환해 주세요.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            gradeLevel: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            aiPedagogyIntent: { type: Type.STRING },
            coreConcept: { type: Type.STRING },
            learningObjectives: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  blanks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        order: { type: Type.INTEGER },
                        questionText: { type: Type.STRING },
                        correctAnswer: { type: Type.STRING },
                        acceptableAnswers: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        type: { type: Type.STRING },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        explanation: { type: Type.STRING },
                      },
                      required: ['id', 'order', 'questionText', 'correctAnswer', 'type'],
                    },
                  },
                },
                required: ['id', 'type', 'title', 'content', 'blanks'],
              },
            },
          },
          required: ['title', 'subject', 'gradeLevel', 'difficulty', 'aiPedagogyIntent', 'coreConcept', 'learningObjectives', 'sections'],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);

    // Post-process IDs and counts
    parsed.id = 'ws-' + Date.now();
    parsed.topic = topic;
    parsed.considerations = considerations || '';
    parsed.status = '초안';
    parsed.createdAt = new Date().toISOString();
    parsed.updatedAt = new Date().toISOString();

    let blankCounter = 1;
    let totalBlanks = 0;
    if (parsed.sections && Array.isArray(parsed.sections)) {
      parsed.sections.forEach((sec: any, secIdx: number) => {
        sec.id = sec.id || `sec-${secIdx + 1}`;
        if (sec.blanks && Array.isArray(sec.blanks)) {
          sec.blanks.forEach((b: any, bIdx: number) => {
            b.id = b.id || `b-${sec.id}-${bIdx + 1}`;
            b.order = blankCounter++;
            b.activityId = sec.id;
            b.activityTitle = sec.title;
            totalBlanks++;
          });
        }
      });
    }
    parsed.totalBlanksCount = totalBlanks;

    // Automatically save to worksheets
    const worksheets = readJsonFile<any[]>(WORKSHEETS_FILE, []);
    worksheets.unshift(parsed);
    writeJsonFile(WORKSHEETS_FILE, worksheets);

    res.json(parsed);
  } catch (err: any) {
    console.error('Worksheet generation failed:', err);
    res.status(500).json({
      error: err.message || 'AI 학습지 생성 중 오류가 발생했습니다. API 키 및 네트워크를 확인해 주세요.',
    });
  }
});

// 6. Section AI Re-generation
app.post('/api/ai/regenerate-section', async (req, res) => {
  try {
    const { sectionType, currentTitle, currentContent, worksheetTopic, subject, instructions, userApiKey } = req.body;
    const ai = getAiClient(userApiKey);

    const prompt = `
당신은 한국 교과서 및 교수학습 설계 전문가입니다.
다음 학습지 섹션을 교사의 요청사항에 맞게 새롭게 재생성하세요.

[전체 수업 주제]: ${worksheetTopic} (과목: ${subject || '해당 과목'})
[섹션 유형]: ${sectionType}
[현재 제목]: ${currentTitle}
[현재 내용]: ${currentContent}
[재생성 요청/수정 방향]: ${instructions || '더 흥미롭고 학생들이 주도적으로 참여할 수 있는 최적화된 활동으로 개선해줘'}

반환 형식은 JSON으로, 다음 필드를 포함해야 합니다:
- title: 섹션 제목
- content: 학생 안내 본문 (괄호 ( 1 ), ( 2 ) 표기 활용)
- blanks: 빈칸 및 문항 목록 (id, questionText, correctAnswer, acceptableAnswers, type("fill_blank"|"ox"|"short_answer"|"choice"), options, explanation)
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            blanks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  questionText: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  acceptableAnswers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  type: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  explanation: { type: Type.STRING },
                },
                required: ['questionText', 'correctAnswer', 'type'],
              },
            },
          },
          required: ['title', 'content', 'blanks'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Section regeneration failed:', err);
    res.status(500).json({ error: err.message || '섹션 재생성 실패' });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

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
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
