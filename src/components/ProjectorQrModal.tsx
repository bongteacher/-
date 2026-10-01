import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Maximize2,
  Minimize2,
  Users,
  Camera,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Worksheet } from '../types';

interface ProjectorQrModalProps {
  worksheet: Worksheet;
  studentUrl: string;
  onClose: () => void;
}

export const ProjectorQrModal: React.FC<ProjectorQrModalProps> = ({
  worksheet,
  studentUrl,
  onClose,
}) => {
  const [largeQr, setLargeQr] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [submissionCount, setSubmissionCount] = useState<number>(worksheet.submissionCount || 0);

  useEffect(() => {
    // Generate high resolution QR code for projector
    QRCode.toDataURL(studentUrl, {
      width: 500,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setLargeQr(url))
      .catch((err) => console.error(err));

    // Poll submission count every 3 seconds for live counter on TV!
    const interval = setInterval(() => {
      fetch(`/api/worksheets/${worksheet.id}/submissions`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setSubmissionCount(data.length);
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [worksheet.id, studentUrl]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col justify-between p-6 sm:p-10 text-white animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-bold">
            교실 TV · 빔프로젝터 모드
          </span>
          <span className="text-slate-400 text-sm hidden sm:inline">
            스마트폰 카메라로 화면의 QR을 스캔하세요
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold transition flex items-center space-x-1.5"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? '창 모드' : '전체 화면'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Center QR & Title */}
      <div className="max-w-4xl mx-auto w-full text-center space-y-6 my-auto">
        <div>
          <span className="text-emerald-400 font-semibold text-sm sm:text-base tracking-wide">
            {worksheet.gradeLevel} · {worksheet.subject}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-1">
            {worksheet.title}
          </h1>
        </div>

        {/* Large QR */}
        <div className="inline-block p-4 sm:p-6 bg-white rounded-3xl shadow-2xl">
          {largeQr ? (
            <img
              src={largeQr}
              alt="Projector QR Code"
              className="w-64 h-64 sm:w-96 sm:h-96 object-contain rounded-xl"
            />
          ) : (
            <div className="w-64 h-64 sm:w-96 sm:h-96 flex items-center justify-center text-slate-500">
              QR 생성 중...
            </div>
          )}
        </div>

        {/* Live Counter Badge */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm sm:text-base">
          <div className="px-5 py-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>현재 실시간 제출 완료: {submissionCount}명</span>
          </div>

          <div className="text-slate-400 text-xs sm:text-sm font-mono truncate max-w-md bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
            접속 주소: {studentUrl}
          </div>
        </div>
      </div>

      {/* Bottom instructions */}
      <div className="text-center text-xs text-slate-500">
        학생들은 별도의 회원가입 없이 학번과 이름만 입력하면 즉시 학습지를 시작할 수 있습니다.
      </div>
    </div>
  );
};
