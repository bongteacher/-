import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  KeyRound,
  Sparkles,
  HardDrive,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { TeacherSettings, StorageStats } from '../types';

interface SettingsModalProps {
  settings: TeacherSettings;
  onUpdateSettings: (newSettings: TeacherSettings) => void;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'storage'>('general');
  const [pin, setPin] = useState(settings.pin);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Storage stats
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  useEffect(() => {
    fetch('/api/storage/stats')
      .then((res) => res.json())
      .then((data) => setStorageStats(data))
      .catch(() => {});
  }, []);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
      alert('PIN 번호는 숫자 4~8자리로 입력해 주세요.');
      return;
    }

    const updated: TeacherSettings = {
      ...settings,
      pin,
      apiKey: apiKey.trim(),
    };

    localStorage.setItem('worksheet_teacher_settings', JSON.stringify(updated));
    onUpdateSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportBackup = () => {
    window.location.href = '/api/storage/export';
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/storage/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        });

        if (res.ok) {
          setImportStatus('데이터가 성공적으로 복원되었습니다!');
          if (onRefreshData) onRefreshData();
          // refresh stats
          fetch('/api/storage/stats')
            .then((r) => r.json())
            .then((d) => setStorageStats(d));
        } else {
          setImportStatus('복원 중 오류가 발생했습니다.');
        }
      } catch (err) {
        setImportStatus('올바른 백업 JSON 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">환경 설정 & 데이터 관리</h2>
              <p className="text-xs text-slate-500">교사 PIN, AI API 키 및 데이터 무료 용량 관리</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'general'
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            기본 설정 (PIN / AI 키)
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'storage'
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>데이터 용량 및 백업</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'general' ? (
            <form onSubmit={handleSaveGeneral} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  교사 PIN 번호 (숫자 4~8자리)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#2e6d4e]"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  스튜디오 로그인 시 사용할 교사용 비밀번호입니다.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  AI API 키
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Google AI Studio에서 발급받은 키 (AIza...)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-xs focus:ring-2 focus:ring-[#2e6d4e]"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 inline" />
                  미입력 시 기본 제공 서버 AI 키를 사용합니다. 학생 화면에는 절대 노출되지 않습니다.
                </p>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  설정이 성공적으로 저장되었습니다!
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#2e6d4e] hover:bg-[#255940] text-white font-bold text-xs sm:text-sm transition"
                >
                  설정 저장
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Storage Quota Relief Box (Directly addressing user question 7) */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-emerald-950 font-bold text-sm">
                  <HardDrive className="w-4 h-4 text-emerald-800" />
                  <span>데이터 무료 용량 안내 (걱정 안 하셔도 돼요!)</span>
                </div>
                <p className="text-emerald-900 leading-relaxed">
                  선생님께서 질문하신 무료 용량 초과 우려에 대해 안심하실 수 있도록, 본 웹앱은
                  외부 유료 클라우드(Firebase 유료 한도 등)에 종속되지 않고 <strong>자체 경량 로컬 및 서버 스토리지</strong>로 운영됩니다.
                </p>
                <ul className="list-disc list-inside space-y-1 text-emerald-800 pt-1">
                  <li>텍스트 기반 고효율 압축 JSON으로 저장되어 수백 개의 학습지도 1~2MB 미만입니다.</li>
                  <li>용량 한도 초과로 인한 추가 과금이나 차단이 전혀 없습니다.</li>
                  <li>원하실 때 언제든 아래 버튼으로 PC에 전체 데이터를 안전하게 백업 및 복원할 수 있습니다.</li>
                </ul>
              </div>

              {/* Current Usage Stats */}
              {storageStats && (
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div>
                    <span className="text-[11px] text-slate-500 block">생성한 학습지</span>
                    <strong className="text-lg font-bold text-slate-900">{storageStats.worksheetCount}개</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">누적 학생 제출</span>
                    <strong className="text-lg font-bold text-slate-900">{storageStats.submissionCount}건</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">사용 용량</span>
                    <strong className="text-lg font-bold text-emerald-800">{storageStats.usedKb} KB</strong>
                  </div>
                </div>
              )}

              {/* Backup & Restore Controls */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-slate-800">데이터 백업 및 복원</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold transition flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>전체 데이터 백업 (JSON)</span>
                  </button>

                  <label className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold transition flex items-center justify-center space-x-2 cursor-pointer">
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>백업 파일 복원 (JSON)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {importStatus && (
                  <p className="text-xs text-center font-bold text-emerald-800 pt-1">
                    {importStatus}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
