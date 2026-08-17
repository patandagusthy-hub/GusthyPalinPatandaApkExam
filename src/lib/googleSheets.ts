import { ExamResult, AppSettings } from '../types';

export interface GoogleSyncResponse {
  success: boolean;
  message: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  syncedCount?: number;
}

// Convert an ExamResult into Google Sheets Row format
export function formatExamResultToRow(result: ExamResult): (string | number)[] {
  const formattedDate = result.submittedAt
    ? new Date(result.submittedAt).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    : new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  const isPassedText =
    result.isPassed === true
      ? 'LULUS'
      : result.isPassed === false
      ? 'TIDAK LULUS'
      : result.score >= 70
      ? 'LULUS'
      : 'BELUM DI-EVALUASI';

  const violationsCount = result.antiCheatViolations?.length || 0;
  const violationSummary =
    violationsCount > 0
      ? result.antiCheatViolations.map((v) => `${v.reason} (${v.timestamp})`).join('; ')
      : 'Bersih / Tidak Ada Pelanggaran';

  return [
    formattedDate,
    result.id || `RES_${Date.now()}`,
    result.studentName || '-',
    result.studentNisn || '-',
    result.className || '-',
    result.subject || '-',
    result.examTitle || 'Ujian Online',
    result.score || 0,
    result.correctCount || 0,
    result.wrongCount || 0,
    result.emptyCount || 0,
    isPassedText,
    violationsCount,
    violationSummary,
  ];
}

// Standard Sheet Headers
export const GOOGLE_SHEET_HEADERS = [
  'Waktu Selesai (WIB)',
  'ID Hasil',
  'Nama Siswa',
  'NISN',
  'Kelas',
  'Mata Pelajaran',
  'Judul Ujian',
  'Nilai Total / Skor',
  'Jumlah Benar',
  'Jumlah Salah',
  'Jumlah Kosong',
  'Status Kelulusan',
  'Jumlah Pelanggaran',
  'Detail Pelanggaran Anti-Nyontek',
];

/**
 * Directly create a new Google Spreadsheet in user's Google Drive via Google Sheets v4 API
 */
export async function createNewGoogleSpreadsheet(
  accessToken: string,
  title: string = 'GiannaExamApk_Hasil_Ujian_Siswa'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `${title} (${new Date().toLocaleDateString('id-ID')})`,
      },
      sheets: [
        {
          properties: {
            title: 'Hasil Ujian Siswa',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: GOOGLE_SHEET_HEADERS.map((header) => ({
                    userEnteredValue: { stringValue: header },
                    userEnteredFormat: {
                      textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                      backgroundColor: { red: 0.09, green: 0.14, blue: 0.28 }, // Slate Navy header
                      horizontalAlignment: 'CENTER',
                    },
                  })),
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Gagal membuat Spreadsheet baru di Google Drive (Status: ${response.status})`
    );
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

/**
 * Append a single exam result row to Google Spreadsheet using Google Sheets v4 API
 */
export async function appendResultToGoogleSheetApi(
  spreadsheetId: string,
  accessToken: string,
  result: ExamResult
): Promise<boolean> {
  const rowValues = formatExamResultToRow(result);
  const range = 'Hasil Ujian Siswa!A:N';

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!response.ok) {
    // If sheet name "Hasil Ujian Siswa" doesn't exist, try appending to default first sheet
    const fallbackResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      }
    );
    return fallbackResponse.ok;
  }

  return true;
}

/**
 * Batch sync all exam results to Google Spreadsheet using Google Sheets v4 API
 */
export async function syncAllResultsToGoogleSheetApi(
  spreadsheetId: string,
  accessToken: string,
  results: ExamResult[]
): Promise<GoogleSyncResponse> {
  if (!results || results.length === 0) {
    return { success: true, message: 'Tidak ada data hasil ujian untuk disinkronkan.', syncedCount: 0 };
  }

  // First, check or write header
  const headerCheckUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Hasil Ujian Siswa!A1:N1`;
  const checkRes = await fetch(headerCheckUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const checkData = await checkRes.json().catch(() => ({}));
  const hasHeaders = checkData?.values && checkData.values.length > 0;

  const rowsToAppend: (string | number)[][] = [];

  if (!hasHeaders) {
    rowsToAppend.push(GOOGLE_SHEET_HEADERS);
  }

  results.forEach((res) => {
    rowsToAppend.push(formatExamResultToRow(res));
  });

  const range = 'Hasil Ujian Siswa!A1';
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED`;

  const appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: rowsToAppend }),
  });

  if (!appendRes.ok) {
    const errObj = await appendRes.json().catch(() => ({}));
    throw new Error(
      errObj?.error?.message || `Gagal menyinkronkan data ke Google Sheet ID "${spreadsheetId}".`
    );
  }

  return {
    success: true,
    message: `Berhasil menyinkronkan ${results.length} data hasil ujian ke Google Spreadsheet!`,
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    syncedCount: results.length,
  };
}

/**
 * Sync via Webhook Proxy (Google Apps Script)
 */
export async function syncResultViaWebhook(webhookUrl: string, result: ExamResult): Promise<boolean> {
  try {
    const res = await fetch('/api/proxy-spreadsheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl,
        action: 'SUBMIT_EXAM_RESULT',
        payload: {
          result,
          formattedRow: formatExamResultToRow(result),
        },
        timestamp: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Webhook sync failed:', err);
    return false;
  }
}

/**
 * Master Sync Function called upon student exam submission or manual trigger
 */
export async function syncStudentExamResultToGoogleSpreadsheet(
  result: ExamResult,
  settings: AppSettings,
  accessToken?: string
): Promise<GoogleSyncResponse> {
  let apiSuccess = false;
  let webhookSuccess = false;

  // 1. If OAuth Token & Spreadsheet ID are present, use Direct Google Sheets API
  if (accessToken && settings.googleSpreadsheetId) {
    try {
      apiSuccess = await appendResultToGoogleSheetApi(settings.googleSpreadsheetId, accessToken, result);
    } catch (e) {
      console.warn('Google Sheets API direct sync failed, attempting webhook fallback...', e);
    }
  }

  // 2. If Webhook URL is configured, trigger Webhook
  if (settings.googleSheetWebhookUrl) {
    webhookSuccess = await syncResultViaWebhook(settings.googleSheetWebhookUrl, result);
  }

  if (apiSuccess || webhookSuccess) {
    return {
      success: true,
      message: 'Hasil ujian berhasil disinkronkan secara otomatis ke Google Spreadsheet!',
      spreadsheetId: settings.googleSpreadsheetId,
      spreadsheetUrl: settings.googleSpreadsheetId
        ? `https://docs.google.com/spreadsheets/d/${settings.googleSpreadsheetId}/edit`
        : undefined,
    };
  }

  return {
    success: false,
    message: 'Gagal menyinkronkan ke Google Spreadsheet. Data telah disimpan di antrean offline lokal.',
  };
}
