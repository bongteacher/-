import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Copy,
  Check,
  Tv,
  ExternalLink,
  Lightbulb,
  Camera,
  X,
  Users
} from 'lucide-react';
import { Worksheet } from '../types';

interface DistributionModalProps {
  worksheet: Worksheet;
  onClose: () => void;
  onOpenStudentView: (ws: Worksheet) => void;
  onOpenProjectorQr: (ws: Worksheet, qrDataUrl: string, studentUrl: string) => void;
  onOpenSubmissions: (ws: Worksheet) => void;
}

export const DistributionModal: React.FC<DistributionModalProps> = ({
  worksheet,
  onClose,
  onOpenStudentView,
  onOpenProjectorQr,
  onOpenSubmissions,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [submissionCount, setSubmissionCount] = useState<number>(worksheet.submissionCount || 0);

  // Construct absolute student link
  const studentUrl = `${window.location.origin}${window.location.pathname}?mode=student&id=${worksheet.id}`;

  useEffect(() => {
    // Generate QR code
    QRCode.toDataURL(studentUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation failed:', err));

    // Fetch latest submissions count
    fetch(`/api/worksheets/${worksheet.id}/submissions`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSubmissionCount(data.length);
        }
      })
      .catch(() => {});
  }, [worksheet.id, studentUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header matching Image 4 */}
        <div className="p-6 sm:p-7 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                배포 완료! 학생들을 초대하세요
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {worksheet.gradeLevel} · {worksheet.subject} · {worksheet.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body matching Image 4 */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left QR Column */}
          <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
            <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Student Access QR Code"
                  className="w-48 h-48 object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                  QR 코드 생성 중...
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium mt-3">
              <Camera className="w-4 h-4 text-slate-400" />
              <span>스마트폰·태블릿 카메라로 스캔</span>
            </div>
          </div>

          {/* Right Action Column matching Image 4 */}
          <div className="space-y-4">
            {/* Direct URL input with Copy button */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span>학생 접속 주소</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={studentUrl}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 truncate focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center space-x-1 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-800" />
                      <span>복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>복사</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Projector TV Big Button matching Image 4 */}
            <button
              onClick={() => onOpenProjectorQr(worksheet, qrDataUrl, studentUrl)}
              className="w-full py-3 px-4 rounded-xl bg-[#2e6d4e] hover:bg-[#255940] text-white font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-sm"
            >
              <Tv className="w-4 h-4" />
              <span>QR 크게 띄우기 (교실 TV·빔프로젝터용)</span>
            </button>

            {/* Open Student View Button matching Image 4 */}
            <button
              onClick={() => onOpenStudentView(worksheet)}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm transition flex items-center justify-center space-x-2"
            >
              <ExternalLink className="w-4 h-4 text-slate-600" />
              <span>학생 화면 열어보기</span>
            </button>

            {/* Tip Box matching Image 4 */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl space-y-2">
              <div className="flex items-start space-x-2 text-xs text-emerald-950">
                <Lightbulb className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-bold">활용 팁:</span> 교실 TV나 빔프로젝터에 QR을 띄우면 학생들이 자리에서 바로 스캔해 들어와요. 로그인 없이 학번과 이름만 쓰면 시작돼요.
                </p>
              </div>

              {/* Live submissions link */}
              <div className="pt-1 border-t border-emerald-200/50 flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  지금까지 받은 제출: <strong className="font-bold">{submissionCount}건</strong>
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSubmissions(worksheet);
                  }}
                  className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  제출 현황 보기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs sm:text-sm font-semibold transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
