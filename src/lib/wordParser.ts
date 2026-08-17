import mammoth from 'mammoth';
import { Question } from '../types';

/**
 * Parses raw text extracted from a Word (.docx) or text file into Question objects.
 */
export function parseQuestionsFromText(text: string): Question[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const questions: Question[] = [];

  let currentQuestionText: string[] = [];
  let currentOptions: { key: string; text: string }[] = [];
  let currentCorrectKey = 'A';
  let currentEssayGuide = '';
  let isEssay = false;

  const saveCurrentQuestion = () => {
    if (currentQuestionText.length === 0) return;

    const fullQText = currentQuestionText.join(' ');
    const id = 'q_word_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    if (isEssay || currentOptions.length === 0) {
      questions.push({
        id,
        type: 'essay',
        questionText: fullQText,
        essayGuide: currentEssayGuide || 'Pedoman Kunci Jawaban Essay',
        points: 10,
      });
    } else {
      // Standardize options A, B, C, D, E
      const formattedOptions = ['A', 'B', 'C', 'D', 'E'].map((k) => {
        const found = currentOptions.find((o) => o.key.toUpperCase() === k);
        return {
          key: k,
          text: found ? found.text : `Opsi ${k}`,
        };
      });

      questions.push({
        id,
        type: 'multiple_choice',
        questionText: fullQText,
        options: formattedOptions,
        correctKey: currentCorrectKey,
        points: 5,
      });
    }

    // Reset state for next question
    currentQuestionText = [];
    currentOptions = [];
    currentCorrectKey = 'A';
    currentEssayGuide = '';
    isEssay = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is Question start (e.g., "1.", "1)", "Soal 1:", "Q1.")
    const qMatch = line.match(/^(?:Soal\s*\d+[:.]?|\d+[\.\)])\s*(.*)/i);
    // Check if line is Option (e.g., "A.", "a)", "A)", "a.")
    const optMatch = line.match(/^([A-Ea-e])[\.\)]\s*(.*)/);
    // Check if line is Answer Key (e.g., "Kunci: A", "Kunci Jawaban: B", "Jawaban: C", "Key: D", "ANS: E")
    const keyMatch = line.match(/^(?:Kunci(?:\s*Jawaban)?|Jawaban|Key|ANS)\s*[:=]\s*([A-Ea-e])/i);
    // Check if line is Essay Guide (e.g., "Kunci Essay:", "Jawaban Essay:")
    const essayKeyMatch = line.match(/^(?:Kunci\s*Essay|Jawaban\s*Essay|Rubrik)\s*[:=]\s*(.*)/i);

    if (keyMatch) {
      currentCorrectKey = keyMatch[1].toUpperCase();
    } else if (essayKeyMatch) {
      isEssay = true;
      currentEssayGuide = essayKeyMatch[1].trim();
    } else if (optMatch) {
      currentOptions.push({
        key: optMatch[1].toUpperCase(),
        text: optMatch[2].trim(),
      });
    } else if (qMatch) {
      saveCurrentQuestion();
      const qContent = qMatch[1].trim();
      if (qContent) {
        currentQuestionText.push(qContent);
      }
    } else {
      // Continuation line
      if (currentOptions.length > 0) {
        currentOptions[currentOptions.length - 1].text += ' ' + line;
      } else if (currentQuestionText.length > 0) {
        currentQuestionText.push(line);
      } else {
        currentQuestionText.push(line);
      }
    }
  }

  saveCurrentQuestion();
  return questions;
}

/**
 * Extracts text from a Word (.docx) or Text (.txt) File object.
 */
export async function extractTextFromWordFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.txt')) {
    return await file.text();
  }

  if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  }

  throw new Error('Format file tidak didukung. Harap upload file .docx atau .txt');
}

/**
 * Generates a downloadable Word/Text template for questions.
 */
export function downloadWordQuestionTemplate() {
  const content = `FORMAT IMPORT SOAL UJIAN (GIANNA EXAM)
========================================
Petunjuk Format:
- Setiap soal diawali dengan nomor (misal: 1. atau 2.)
- Opsi pilihan ganda diawali A., B., C., D., E.
- Kunci jawaban ditulis di bawah opsi dengan format "Kunci: A" atau "Kunci Jawaban: B"
- Soal essay ditulis tanpa opsi, cukup berikan "Kunci Essay: [Pedoman Penilaian]"

----------------------------------------
CONTOH SOAL PILIHAN GANDA & ESSAY:

1. Ibu kota Negara Republik Indonesia saat ini adalah...
A. Jakarta
B. Surabaya
C. Bandung
D. Medan
E. Makassar
Kunci: A

2. Proses tumbuhan hijau memasak makanan sendiri dengan bantuan sinar matahari disebut...
A. Respirasi
B. Transpirasi
C. Fotosintesis
D. Gutasi
E. Osmosis
Kunci Jawaban: C

3. Sebutkan 3 sila pertama dari Pancasila secara urut dan benar!
Kunci Essay: 1. Ketuhanan Yang Maha Esa, 2. Kemanusiaan yang adil dan beradab, 3. Persatuan Indonesia.
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Format_Soal_Word.txt');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
