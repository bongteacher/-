import React, { useState } from 'react';
import { FileText, KeyRound, Sparkles, ShieldCheck, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { TeacherSettings } from '../types';

interface InitialSetupProps {
  onComplete: (settings: TeacherSettings) => void;
  existingSettings?: TeacherSettings | null;
  onLoginSuccess?: () => void;
}

export const InitialSetup: React.FC<InitialSetupProps> = ({
  onComplete,
  existingSettings,
  onLoginSuccess,
}) => {
  const isExisting = !!existingSettings && existingSettings.isConfigured;

  // Setup form states
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  // Login form state (if already configured)
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Key detection helper
  const getKeyTypeLabel = (key: string) => {
    if (!key.trim()) return '';
    if (key.startsWith('AIza')) return 'Google Gemini API 키 감지 (권장)';
    if (key.startsWith('sk-ant-')) return 'Anthropic Claude API 키 감지';
    if (key.startsWith('sk-')) return 'OpenAI ChatGPT API 키 감지';
    return '사용자 정의 API 키';
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pin || pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
      setError('PIN 번호는 숫자 4~8자리로 입력해 주세요.');
      return;
    }

    if (pin !== pinConfirm) {
      setError('PIN 확인이 일치하지 않습니다.');
      return;
    }

    const settings: TeacherSettings = {
      pin,
      apiKey: apiKey.trim(),
      isConfigured: true,
    };

    localStorage.setItem('worksheet_teacher_settings', JSON.stringify(settings));
    onComplete(settings);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (existingSettings && loginPin === existingSettings.pin) {
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } else {
      setLoginError('PIN 번호가 올바르지 않습니다.');
    }
  };

  // If already configured, show fresh login card
  if (isExisting && !isResetting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-sky-50/60 flex flex-col justify-between">
        {/* Fresh Brand Header (without v2.8.0) */}
        <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-emerald-100/60 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/25">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 bg-clip-text text-transparent tracking-tight">
                AI 학습지 도우미
              </span>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800">
              교사용 스튜디오
            </span>
          </div>
        </header>

        {/* Center Card */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-teal-900/5 border border-emerald-100/80 p-8 sm:p-9 relative overflow-hidden">
            {/* Subtle top color gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-5 mx-auto shadow-md shadow-emerald-600/20">
              <KeyRound className="w-6 h-6" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 text-center mb-1.5 tracking-tight">
              선생님, 어서오세요!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 text-center mb-6">
              설정하신 교사 PIN 번호를 입력해 주세요.
            </p>

            {loginError && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold rounded-2xl text-center">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                  교사 PIN 번호
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 text-center text-2xl tracking-[0.3em] font-mono transition"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold rounded-2xl transition duration-150 shadow-md shadow-emerald-700/20 text-sm flex items-center justify-center space-x-2"
              >
                <span>스튜디오 입장하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetting(true)}
                  className="text-xs text-slate-400 hover:text-emerald-700 transition"
                >
                  PIN을 잊으셨거나 새로 설정하시겠습니까?
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-slate-400">
          © 2026 이천고등학교 · 이천고등학교 교내 수업용
        </footer>
      </div>
    );
  }

  // Initial Setup Screen (simplified, fresh, light palette, no v2.8.0)
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-sky-50/60 flex flex-col justify-between">
      {/* Brand Header (without v2.8.0) */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-emerald-100/60 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/25">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 bg-clip-text text-transparent tracking-tight">
              AI 학습지 도우미
            </span>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>선생님 전용</span>
          </span>
        </div>
      </header>

      {/* Center Setup Card (Fresh, airy, modern design) */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-teal-900/5 border border-emerald-100/80 p-8 sm:p-9 my-4 relative overflow-hidden">
          {/* Top color gradient highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

          {/* Heading */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-4 shadow-md shadow-emerald-600/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight mb-1.5">
              처음 오셨네요! 초기 설정
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              선생님만의 안전한 스튜디오를 위해 PIN 번호와 AI 키를 설정합니다. (1회만 설정)
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold rounded-2xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSetupSubmit} className="space-y-4">
            {/* PIN Inputs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>교사 PIN (숫자 4~8자리)</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="예: 1234"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 text-sm font-mono tracking-wider transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PIN 확인</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value)}
                  placeholder="한 번 더 입력"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 text-sm font-mono tracking-wider transition"
                  required
                />
              </div>
            </div>

            {/* AI API Key Input */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>AI API 키</span>
                  <span className="font-normal text-slate-400 text-[11px]">(선택 / 무료 Gemini 권장)</span>
                </label>
              </div>

              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Google AI Studio에서 발급받은 키 (AIza...)"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 text-xs font-mono transition placeholder-slate-400"
              />

              {apiKey ? (
                <p className="mt-1.5 text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 inline" />
                  <span>{getKeyTypeLabel(apiKey)}</span>
                </p>
              ) : null}

              {/* Informative Security & Provider Note */}
              <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100/90 text-[11px] text-emerald-950 space-y-1">
                <p className="flex items-center gap-1 font-semibold text-emerald-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  키를 비워두셔도 기본 제공 서버 AI 키로 즉시 사용 가능합니다.
                </p>
                <p className="text-emerald-800/80 leading-relaxed pl-4">
                  직접 발급받은 키(Gemini, ChatGPT, Claude)가 있다면 입력 시 우선 적용되며, 학생 화면에는 일체 전송되지 않습니다.
                </p>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold rounded-2xl transition duration-150 shadow-md shadow-emerald-700/20 text-sm flex items-center justify-center space-x-2"
              >
                <span>설정 완료하고 시작하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        © 2026 이천고등학교 · 이천고등학교 교내 수업용 · 무단 복제·재배포 및 상업적 이용 금지
      </footer>
    </div>
  );
};
