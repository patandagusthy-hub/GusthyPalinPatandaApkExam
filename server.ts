import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'GiannaExamApk' });
  });

  // In-memory Server State Store for Real-Time Multi-Device Sync
  let serverAppData: any = {
    students: null,
    classes: null,
    questions: null,
    exams: null,
    results: [],
    settings: null,
    lastUpdated: new Date().toISOString(),
  };

  // Get synchronized app data (used by student app on load or refresh)
  app.get('/api/app-data', (_req, res) => {
    res.json({
      success: true,
      data: serverAppData,
      serverTime: new Date().toISOString(),
    });
  });

  // Push synchronized app data from Admin/Teacher or Student
  app.post('/api/sync-data', (req, res) => {
    try {
      const { type, payload } = req.body;
      if (type === 'ALL' && payload) {
        serverAppData = {
          ...serverAppData,
          ...payload,
          lastUpdated: new Date().toISOString(),
        };
      } else if (type === 'STUDENTS' && payload) {
        serverAppData.students = payload;
      } else if (type === 'EXAMS' && payload) {
        serverAppData.exams = payload;
      } else if (type === 'QUESTIONS' && payload) {
        serverAppData.questions = payload;
      } else if (type === 'SETTINGS' && payload) {
        serverAppData.settings = payload;
      }
      res.json({ success: true, lastUpdated: serverAppData.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to sync server data', details: err?.message });
    }
  });

  // Student Live Status / Heartbeat & Anti-Cheat Sync
  app.post('/api/student-heartbeat', (req, res) => {
    try {
      const { studentId, status, activeExamId, currentQuestionIndex, totalQuestionsCount, violationsCount } = req.body;
      if (!studentId) {
        return res.status(400).json({ error: 'studentId required' });
      }

      if (serverAppData.students && Array.isArray(serverAppData.students)) {
        const studentIndex = serverAppData.students.findIndex((s: any) => s.id === studentId);
        if (studentIndex >= 0) {
          serverAppData.students[studentIndex] = {
            ...serverAppData.students[studentIndex],
            status: status || serverAppData.students[studentIndex].status,
            activeExamId: activeExamId !== undefined ? activeExamId : serverAppData.students[studentIndex].activeExamId,
            currentQuestionIndex: currentQuestionIndex !== undefined ? currentQuestionIndex : serverAppData.students[studentIndex].currentQuestionIndex,
            totalQuestionsCount: totalQuestionsCount !== undefined ? totalQuestionsCount : serverAppData.students[studentIndex].totalQuestionsCount,
            violationsCount: violationsCount !== undefined ? violationsCount : serverAppData.students[studentIndex].violationsCount,
          };
        }
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Heartbeat error', details: err?.message });
    }
  });

  // Student Exam Submission (instantly records result in server store)
  app.post('/api/student-submit', (req, res) => {
    try {
      const { result } = req.body;
      if (!result || !result.studentId) {
        return res.status(400).json({ error: 'Invalid exam result payload' });
      }

      if (!serverAppData.results) {
        serverAppData.results = [];
      }

      // Replace or prepend result
      const existingIdx = serverAppData.results.findIndex((r: any) => r.id === result.id || (r.studentId === result.studentId && r.examId === result.examId));
      if (existingIdx >= 0) {
        serverAppData.results[existingIdx] = result;
      } else {
        serverAppData.results.unshift(result);
      }

      // Update student status to COMPLETED
      if (serverAppData.students && Array.isArray(serverAppData.students)) {
        const studentIndex = serverAppData.students.findIndex((s: any) => s.id === result.studentId);
        if (studentIndex >= 0) {
          serverAppData.students[studentIndex] = {
            ...serverAppData.students[studentIndex],
            status: 'COMPLETED',
          };
        }
      }

      res.json({ success: true, resultId: result.id });
    } catch (err: any) {
      res.status(500).json({ error: 'Submit error', details: err?.message });
    }
  });

  // Server-side Gemini AI Question Generator
  app.post('/api/generate-questions', async (req, res) => {
    try {
      const { textContent, subject, mcCount = 5, essayCount = 2 } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY environment variable is missing in server environment.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Anda adalah seorang pembuat soal ujian SMA profesional. Buatkan bank soal ujian berstandar Nasional untuk mata pelajaran "${subject || 'Pengetahuan Umum'}" berdasarkan materi/teks berikut:
      
Teks Materi / Referensi:
"${textContent || 'Materi pelajaran SMA umum, mencakup Sains, Matematika, Bahasa, dan Ilmu Pengetahuan Sosial.'}"

Ketentuan Soal:
1. Buat ${mcCount} soal Pilihan Ganda (Multiple Choice) lengkap dengan 5 opsi pilihan (A, B, C, D, E) dan sebutkan Kunci Jawaban yang benar ('A', 'B', 'C', 'D', atau 'E').
2. Buat ${essayCount} soal Essay / Uraian lengkap dengan Pedoman Kunci Jawaban / Rubrik Penilaian untuk Guru.
3. Bahasa yang digunakan harus Bahasa Indonesia baku dan mudah dipahami siswa SMA.

Kembalikan jawaban HANYA dalam format JSON dengan struktur array soal berikut:
[
  {
    "id": "gen_q1",
    "type": "multiple_choice",
    "questionText": "Teks pertanyaan pilihan ganda...",
    "options": [
      { "key": "A", "text": "Opsi A..." },
      { "key": "B", "text": "Opsi B..." },
      { "key": "C", "text": "Opsi C..." },
      { "key": "D", "text": "Opsi D..." },
      { "key": "E", "text": "Opsi E..." }
    ],
    "correctKey": "A",
    "points": 20
  },
  {
    "id": "gen_q2",
    "type": "essay",
    "questionText": "Teks pertanyaan essay...",
    "essayGuide": "Pedoman jawaban dan poin penting...",
    "points": 20
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                questionText: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      key: { type: Type.STRING },
                      text: { type: Type.STRING },
                    },
                    required: ['key', 'text'],
                  },
                },
                correctKey: { type: Type.STRING },
                essayGuide: { type: Type.STRING },
                points: { type: Type.NUMBER },
              },
              required: ['id', 'type', 'questionText', 'points'],
            },
          },
        },
      });

      const jsonText = response.text || '[]';
      const parsedQuestions = JSON.parse(jsonText);

      return res.json({
        success: true,
        questions: parsedQuestions,
      });
    } catch (err: any) {
      console.error('Error generating questions with Gemini:', err);
      return res.status(500).json({
        error: 'Gagal membuat soal otomatis dengan AI Gemini.',
        details: err?.message || String(err),
      });
    }
  });

  // Server-side Proxy for Google Spreadsheet Sync Webhook
  app.post('/api/proxy-spreadsheet', async (req, res) => {
    try {
      const { webhookUrl, action, payload, timestamp } = req.body;
      if (!webhookUrl) {
        return res.status(400).json({ error: 'Google Sheet Webhook URL is required' });
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, timestamp, source: 'GiannaExamApk' }),
      });

      const data = await response.text();
      return res.json({ success: true, responseText: data });
    } catch (err: any) {
      console.error('Spreadsheet proxy sync error:', err);
      return res.status(500).json({
        error: 'Failed to sync with Google Spreadsheet Webhook',
        details: err?.message || String(err),
      });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GiannaExamApk Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
