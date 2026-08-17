import { ExamResult, AppSettings } from '../types';

export function getCssPaperSize(paperSize?: string): string {
  switch (paperSize?.toUpperCase()) {
    case 'F4':
    case 'FOLIO':
      return '215mm 330mm';
    case 'LETTER':
      return 'letter';
    case 'LEGAL':
      return 'legal';
    case 'A4':
    default:
      return 'A4';
  }
}

export function downloadExamResultPDF(result: ExamResult, settings: AppSettings): void {
  // Create an offscreen print window or printable iframe
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Harap izinkan popup browser untuk mengunduh / mencetak laporan PDF.');
    return;
  }

  const essayKeys = Object.keys(result.essayAnswers || {});
  const essayHtml = essayKeys.length > 0
    ? essayKeys
        .map((qId, idx) => {
          const ansText = result.essayAnswers[qId] || '(Tidak dijawab)';
          return `
            <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #f8fafc;">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 5px;">Soal Essay ${idx + 1}:</div>
              <div style="font-size: 13px; color: #334155; white-space: pre-wrap; font-family: monospace; background: #ffffff; padding: 8px; border-radius: 4px; border: 1px solid #cbd5e1;">${ansText}</div>
            </div>
          `;
        })
        .join('')
    : '<div style="font-style: italic; color: #64748b;">Tidak ada soal essay pada ujian ini.</div>';

  const snapshotsHtml = (result.cameraSnapshots || []).length > 0
    ? `<div style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 8px;">
        ${result.cameraSnapshots.map((imgUrl, i) => `
          <div style="text-align: center;">
            <img src="${imgUrl}" style="width: 100px; height: 75px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;" />
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Foto #${i + 1}</div>
          </div>
        `).join('')}
       </div>`
    : '<div style="font-size: 12px; color: #64748b; margin-top: 5px;">Tidak ada rekaman snapshot kamera.</div>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Laporan Hasil Ujian - ${result.studentName} (${result.studentNisn})</title>
        <style>
          @page {
            size: ${getCssPaperSize(settings.defaultPaperSize || 'F4')};
            margin: 15mm;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-size: 12px;
          }
          .kop-surat {
            text-align: center;
            border-bottom: 3px double #0f172a;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .kop-surat h1 {
            font-size: 18px;
            margin: 0;
            text-transform: uppercase;
            color: #0369a1;
          }
          .kop-surat h2 {
            font-size: 15px;
            margin: 3px 0;
            font-weight: 600;
          }
          .kop-surat p {
            margin: 0;
            font-size: 11px;
            color: #475569;
          }
          .title-banner {
            text-align: center;
            background: #f1f5f9;
            padding: 8px;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 20px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            letter-spacing: 0.5px;
          }
          .grid-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
          }
          .info-table td {
            padding: 4px 6px;
            vertical-align: top;
          }
          .info-table td.label {
            font-weight: bold;
            width: 110px;
            color: #334155;
          }
          .score-card {
            border: 2px solid #0284c7;
            background-color: #f0f9ff;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            margin-bottom: 20px;
          }
          .score-big {
            font-size: 36px;
            font-weight: bold;
            color: #0369a1;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            margin-top: 5px;
          }
          .status-pass {
            background-color: #dcfce7;
            color: #15803d;
          }
          .status-fail {
            background-color: #fee2e2;
            color: #b91c1c;
          }
          .section-title {
            font-size: 13px;
            font-weight: bold;
            border-bottom: 2px solid #0ea5e9;
            padding-bottom: 4px;
            margin-top: 20px;
            margin-bottom: 10px;
            color: #0f172a;
            text-transform: uppercase;
          }
          .signature-grid {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            text-align: center;
          }
          .signature-box {
            padding: 10px;
          }
          .signature-space {
            height: 60px;
          }
          @media print {
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #0284c7; color: #ffffff; padding: 10px 20px; text-align: right; margin-bottom: 20px; border-radius: 0 0 8px 8px;">
          <button onclick="window.print()" style="background: #ffffff; color: #0284c7; border: none; padding: 8px 16px; font-weight: bold; border-radius: 4px; cursor: pointer; font-size: 13px;">
            🖨️ Cetak / Simpan PDF
          </button>
        </div>

        <div class="kop-surat">
          <h1>${settings.schoolName || 'PORTAL UJIAN ONLINE SMA'}</h1>
          <h2>REKAPITULASI HASIL EVALUASI UJIAN SISWA</h2>
          <p>Aplikasi GiannaExamApk • GusthyPalinPatandaApkExam • Anti-Cheat Proctoring Protocol</p>
        </div>

        <div class="title-banner">
          LEMBAR HASIL EVALUASI MATA PELAJARAN: ${result.subject.toUpperCase()}
        </div>

        <div class="grid-info">
          <table class="info-table">
            <tr>
              <td class="label">Nama Siswa</td>
              <td>: <strong>${result.studentName}</strong></td>
            </tr>
            <tr>
              <td class="label">NISN / Username</td>
              <td>: ${result.studentNisn} (${result.studentId})</td>
            </tr>
            <tr>
              <td class="label">Kelas / Rombel</td>
              <td>: ${result.className}</td>
            </tr>
          </table>

          <table class="info-table">
            <tr>
              <td class="label">Nama Ujian</td>
              <td>: ${result.examTitle}</td>
            </tr>
            <tr>
              <td class="label">Waktu Selesai</td>
              <td>: ${new Date(result.submittedAt).toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td class="label">Status Integrity</td>
              <td>: ${result.antiCheatViolations.length === 0 ? '<span style="color: #16a34a; font-weight: bold;">✔ Bebas Pelanggaran</span>' : `<span style="color: #dc2626; font-weight: bold;">⚠ ${result.antiCheatViolations.length}x Pelanggaran</span>`}</td>
            </tr>
          </table>
        </div>

        <div class="score-card">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #475569; font-weight: bold;">NILAI AKHIR EVALUASI</div>
          <div class="score-big">${result.score}</div>
          <div class="status-badge ${result.score >= 70 ? 'status-pass' : 'status-fail'}">
            ${result.score >= 70 ? 'LULUS EVALUASI (KOMPETEN)' : 'TIDAK LULUS (REMIDIAL)'}
          </div>
          <div style="margin-top: 10px; font-size: 11px; color: #334155;">
            Total Soal: ${result.totalQuestions} | True: ${result.correctCount} | False: ${result.wrongCount} | Empty: ${result.emptyCount}
          </div>
        </div>

        <div class="section-title">I. JAWAAN ESSAY / URAIAN SISWA</div>
        ${essayHtml}

        <div class="section-title">II. AUDIT KAMERA PENGAWAS (CAMERA PROCTORING)</div>
        ${snapshotsHtml}

        <div class="signature-grid">
          <div class="signature-box">
            <div>Mengetahui,</div>
            <div style="font-weight: bold;">Kepala Sekolah / Madrasah,</div>
            <div class="signature-space"></div>
            <div style="font-weight: bold; text-decoration: underline;">${settings.headmasterName || 'Drs. H. Muhammad Ridwan, M.Pd.'}</div>
            <div style="font-size: 10px; color: #475569;">NIP. ${settings.headmasterNip || '19690815 199403 1 005'}</div>
          </div>
          <div class="signature-box">
            <div>${settings.examCity || 'Makassar'}, ${new Date(result.submittedAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style="font-weight: bold;">Panitia Ujian / Guru Pengampu,</div>
            <div class="signature-space"></div>
            <div style="font-weight: bold;">( __________________________ )</div>
            <div style="font-size: 10px; color: #475569;">NIP / NUPTK. -</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function exportResultsCSV(results: ExamResult[]): void {
  if (results.length === 0) {
    alert('Tidak ada data hasil ujian untuk di-export.');
    return;
  }

  const headers = ['Nama Siswa', 'NISN', 'Kelas', 'Ujian', 'Mata Pelajaran', 'Nilai', 'Benar', 'Salah', 'Kosong', 'Total Soal', 'Jumlah Pelanggaran', 'Waktu Submit'];
  const rows = results.map((r) => [
    `"${(r.studentName || '').replace(/"/g, '""')}"`,
    `"${(r.studentNisn || '').replace(/"/g, '""')}"`,
    `"${(r.className || '').replace(/"/g, '""')}"`,
    `"${(r.examTitle || '').replace(/"/g, '""')}"`,
    `"${(r.subject || '').replace(/"/g, '""')}"`,
    r.score,
    r.correctCount,
    r.wrongCount,
    r.emptyCount,
    r.totalQuestions,
    r.antiCheatViolations ? r.antiCheatViolations.length : 0,
    `"${new Date(r.submittedAt).toLocaleString('id-ID')}"`,
  ]);

  const csvText = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Hasil_Ujian_GiannaExamApk_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadBatchExamResultsPDF(results: ExamResult[], settings: AppSettings, batchTitle: string = 'Laporan Rekapitulasi Ujian Batch'): void {
  if (results.length === 0) {
    alert('Tidak ada data hasil ujian yang dipilih untuk dicetak.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Harap izinkan popup browser untuk mengunduh / mencetak laporan PDF.');
    return;
  }

  const totalStudents = results.length;
  const avgScore = Math.round(results.reduce((acc, r) => acc + r.score, 0) / totalStudents);
  const maxScore = Math.max(...results.map((r) => r.score));
  const minScore = Math.min(...results.map((r) => r.score));
  const passCount = results.filter((r) => r.isPassed).length;
  const failCount = totalStudents - passCount;

  // Build Summary Table Rows
  const summaryRowsHtml = results.map((r, i) => `
    <tr>
      <td style="text-align: center;">${i + 1}</td>
      <td><strong>${r.studentName}</strong></td>
      <td>${r.studentNisn}</td>
      <td>${r.className}</td>
      <td>${r.subject}</td>
      <td style="text-align: center; font-weight: bold; color: ${r.score >= 70 ? '#15803d' : '#b91c1c'};">${r.score}</td>
      <td style="text-align: center;">
        <span style="font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 12px; background-color: ${r.isPassed ? '#dcfce7' : '#fee2e2'}; color: ${r.isPassed ? '#15803d' : '#b91c1c'};">
          ${r.isPassed ? 'LULUS' : 'REMIDIAL'}
        </span>
      </td>
      <td style="text-align: center;">${(r.antiCheatViolations || []).length > 0 ? `<span style="color: #dc2626; font-weight: bold;">⚠ ${r.antiCheatViolations.length}x</span>` : '<span style="color: #16a34a;">✔ Aman</span>'}</td>
    </tr>
  `).join('');

  // Build Individual Cards Pages
  const individualPagesHtml = results.map((result, index) => {
    const essayKeys = Object.keys(result.essayAnswers || {});
    const essayHtml = essayKeys.length > 0
      ? essayKeys
          .map((qId, idx) => {
            const ansText = result.essayAnswers[qId] || '(Tidak dijawab)';
            return `
              <div style="margin-bottom: 10px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #f8fafc;">
                <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">Soal Essay #${idx + 1}:</div>
                <div style="font-size: 11px; color: #334155; white-space: pre-wrap; font-family: monospace; background: #ffffff; padding: 6px; border-radius: 4px; border: 1px solid #cbd5e1;">${ansText}</div>
              </div>
            `;
          })
          .join('')
      : '<div style="font-style: italic; color: #64748b; font-size: 11px;">Tidak ada soal essay pada ujian ini.</div>';

    const snapshotsHtml = (result.cameraSnapshots || []).length > 0
      ? `<div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">
          ${result.cameraSnapshots.map((imgUrl, i) => `
            <div style="text-align: center;">
              <img src="${imgUrl}" style="width: 90px; height: 68px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;" />
              <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Foto #${i + 1}</div>
            </div>
          `).join('')}
         </div>`
      : '<div style="font-size: 11px; color: #64748b; margin-top: 4px;">Tidak ada rekaman snapshot kamera.</div>';

    return `
      <div class="page-break">
        <div class="kop-surat">
          <h1>${settings.schoolName || 'PORTAL UJIAN ONLINE SMA'}</h1>
          <h2>LAPORAN EVALUASI HASIL UJIAN INDIVIDUAL SISWA</h2>
          <p>GiannaExamApk • GusthyPalinPatandaApkExam • Dokumen Resmi Hasil Ujian #${index + 1} dari ${totalStudents}</p>
        </div>

        <div class="title-banner">
          MATA PELAJARAN: ${result.subject.toUpperCase()} (${result.examTitle})
        </div>

        <div class="grid-info">
          <table class="info-table">
            <tr>
              <td class="label">Nama Siswa</td>
              <td>: <strong>${result.studentName}</strong></td>
            </tr>
            <tr>
              <td class="label">NISN / Username</td>
              <td>: ${result.studentNisn} (${result.studentId})</td>
            </tr>
            <tr>
              <td class="label">Kelas / Rombel</td>
              <td>: ${result.className}</td>
            </tr>
          </table>

          <table class="info-table">
            <tr>
              <td class="label">Nama Ujian</td>
              <td>: ${result.examTitle}</td>
            </tr>
            <tr>
              <td class="label">Waktu Selesai</td>
              <td>: ${new Date(result.submittedAt).toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td class="label">Status Integrity</td>
              <td>: ${(result.antiCheatViolations || []).length === 0 ? '<span style="color: #16a34a; font-weight: bold;">✔ Bebas Pelanggaran</span>' : `<span style="color: #dc2626; font-weight: bold;">⚠ ${result.antiCheatViolations.length}x Pelanggaran</span>`}</td>
            </tr>
          </table>
        </div>

        <div class="score-card">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #475569; font-weight: bold;">NILAI AKHIR SISWA</div>
          <div class="score-big">${result.score}</div>
          <div class="status-badge ${result.score >= 70 ? 'status-pass' : 'status-fail'}">
            ${result.score >= 70 ? 'LULUS EVALUASI (KOMPETEN)' : 'TIDAK LULUS (REMIDIAL)'}
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: #334155;">
            Total Soal: ${result.totalQuestions} | Benar: ${result.correctCount} | Salah: ${result.wrongCount} | Kosong: ${result.emptyCount}
          </div>
        </div>

        <div class="section-title">I. JAWABAN ESSAY SISWA</div>
        ${essayHtml}

        <div class="section-title">II. AUDIT KAMERA PENGAWAS (PROCTORING SNAPSHOTS)</div>
        ${snapshotsHtml}

        <div class="signature-grid">
          <div class="signature-box">
            <div>Orang Tua / Wali Siswa,</div>
            <div class="signature-space"></div>
            <div>( __________________________ )</div>
          </div>
          <div class="signature-box">
            <div>Panitia Ujian / Guru Pengampu,</div>
            <div class="signature-space"></div>
            <div>( __________________________ )</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${batchTitle} - ${settings.schoolName || 'GiannaExam'}</title>
        <style>
          @page {
            size: ${getCssPaperSize(settings.defaultPaperSize || 'F4')};
            margin: 15mm;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-size: 11px;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          .kop-surat {
            text-align: center;
            border-bottom: 3px double #0f172a;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .kop-surat h1 {
            font-size: 16px;
            margin: 0;
            text-transform: uppercase;
            color: #0369a1;
          }
          .kop-surat h2 {
            font-size: 13px;
            margin: 3px 0;
            font-weight: 600;
          }
          .kop-surat p {
            margin: 0;
            font-size: 10px;
            color: #475569;
          }
          .title-banner {
            text-align: center;
            background: #f1f5f9;
            padding: 8px;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 15px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            letter-spacing: 0.5px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 15px;
          }
          .stat-card {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            padding: 10px;
            border-radius: 6px;
            text-align: center;
          }
          .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #0284c7;
            margin-top: 2px;
          }
          .stat-label {
            font-size: 9px;
            color: #64748b;
            font-weight: bold;
            text-transform: uppercase;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .data-table th, .data-table td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            font-size: 10px;
          }
          .data-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-align: left;
            color: #334155;
          }
          .grid-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 15px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
          }
          .info-table td {
            padding: 3px 5px;
            vertical-align: top;
          }
          .info-table td.label {
            font-weight: bold;
            width: 110px;
            color: #334155;
          }
          .score-card {
            border: 2px solid #0284c7;
            background-color: #f0f9ff;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            margin-bottom: 15px;
          }
          .score-big {
            font-size: 32px;
            font-weight: bold;
            color: #0369a1;
          }
          .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: bold;
            margin-top: 4px;
          }
          .status-pass {
            background-color: #dcfce7;
            color: #15803d;
          }
          .status-fail {
            background-color: #fee2e2;
            color: #b91c1c;
          }
          .section-title {
            font-size: 11px;
            font-weight: bold;
            border-bottom: 2px solid #0ea5e9;
            padding-bottom: 3px;
            margin-top: 15px;
            margin-bottom: 8px;
            color: #0f172a;
            text-transform: uppercase;
          }
          .signature-grid {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            text-align: center;
          }
          .signature-box {
            padding: 5px;
          }
          .signature-space {
            height: 50px;
          }
          @media print {
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #0284c7; color: #ffffff; padding: 10px 20px; text-align: right; margin-bottom: 15px; border-radius: 0 0 8px 8px;">
          <button onclick="window.print()" style="background: #ffffff; color: #0284c7; border: none; padding: 8px 16px; font-weight: bold; border-radius: 4px; cursor: pointer; font-size: 13px;">
            🖨️ Cetak / Simpan Rekap PDF (${totalStudents} Siswa)
          </button>
        </div>

        {/* COVER & SUMMARY PAGE */}
        <div class="page-break">
          <div class="kop-surat">
            <h1>${settings.schoolName || 'PORTAL UJIAN ONLINE SMA'}</h1>
            <h2>REKAPITULASI BATCH HASIL NILAI UJIAN SISWA</h2>
            <p>Aplikasi GiannaExamApk • GusthyPalinPatandaApkExam • Laporan Kolektif Cetak Batch PDF</p>
          </div>

          <div class="title-banner">
            ${batchTitle.toUpperCase()} — DITERBITKAN: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Peserta</div>
              <div class="stat-value">${totalStudents}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Rata-Rata Nilai</div>
              <div class="stat-value" style="color: #0284c7;">${avgScore}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Nilai Tertinggi</div>
              <div class="stat-value" style="color: #16a34a;">${maxScore}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Jumlah Lulus</div>
              <div class="stat-value" style="color: #16a34a;">${passCount} <span style="font-size: 11px; color: #64748b;">(${failCount} Remidial)</span></div>
            </div>
          </div>

          <div class="section-title">DAFTAR REKAPITULASI NILAI KOLEKTIF</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No</th>
                <th>Nama Siswa</th>
                <th>NISN</th>
                <th>Kelas</th>
                <th>Mata Pelajaran</th>
                <th style="text-align: center;">Nilai</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: center;">Integrity</th>
              </tr>
            </thead>
            <tbody>
              ${summaryRowsHtml}
            </tbody>
          </table>

          <div class="signature-grid">
            <div class="signature-box">
              <div>Mengetahui,<br/>Kepala Sekolah</div>
              <div class="signature-space"></div>
              <div>( __________________________ )</div>
            </div>
            <div class="signature-box">
              <div>Panitia Ujian / Administrator,</div>
              <div class="signature-space"></div>
              <div>( __________________________ )</div>
            </div>
          </div>
        </div>

        {/* INDIVIDUAL STUDENT PAGES */}
        ${individualPagesHtml}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

