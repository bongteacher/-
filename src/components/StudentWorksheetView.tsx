import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Send,
  Save,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Check,
  Compass
} from 'lucide-react';
import { Worksheet, BlankItem } from '../types';

interface StudentWorksheetViewProps {
  worksheet: Worksheet;
  onExitToTeacher?: () => void;
  isTeacherTesting?: boolean;
}

export const StudentWorksheetView: React.FC<StudentWorksheetViewProps> = ({
  worksheet,
  onExitToTeacher,
  isTeacherTesting = false,
}) => {
  const [studentNumber, setStudentNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnfilledModal, setShowUnfilledModal] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);

  // Storage key for student session recovery
  const storageKey = `student_ws_${worksheet.id}_draft`;

  // Load draft from localStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.studentNumber) setStudentNumber(parsed.studentNumber);
        if (parsed.studentName) setStudentName(parsed.studentName);
        if (parsed.answers) setAnswers(parsed.answers);
      }
    } catch (e) {}
  }, [storageKey]);

  // Auto-save draft to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          studentNumber,
          studentName,
          answers,
        })
      );
    } catch (e) {}
  }, [studentNumber, studentName, answers, storageKey]);

  // Calculate filled blanks
  const allBlanks: BlankItem[] = [];
  worksheet.sections.forEach((sec) => {
    if (sec.blanks) {
      sec.blanks.forEach((b) => allBlanks.push(b));
    }
  });

  const totalBlanks = allBlanks.length;
  const filledCount = allBlanks.filter((b) => {
    const val = answers[b.id];
    return val !== undefined && val.trim().length > 0;
  }).length;

  const progressPercent = totalBlanks > 0 ? Math.round((filledCount / totalBlanks) * 100) : 0;

  const handleAnswerChange = (blankId: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [blankId]: val,
    }));
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentNumber.trim() || !studentName.trim()) {
      alert('학번과 이름을 모두 입력해 주세요.');
      return;
    }

    // Check if any blank is empty
    if (filledCount < totalBlanks) {
      setShowUnfilledModal(true);
      return;
    }

    // All filled, directly submit
    executeSubmit();
  };

  const executeSubmit = async () => {
    setShowUnfilledModal(false);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/worksheets/${worksheet.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: studentNumber.trim(),
          studentName: studentName.trim(),
          answers,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '제출에 실패했습니다.');
      }

      const data = await res.json();
      setSubmittedResult(data.submission);
      setIsSubmittedSuccess(true);
      // Clear draft
      sessionStorage.removeItem(storageKey);
    } catch (err: any) {
      alert(err.message || '답안 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already submitted, show beautiful success view
  if (isSubmittedSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-white">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">AI 학습지 도우미</span>
            </div>
            {onExitToTeacher && (
              <button
                onClick={onExitToTeacher}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                교사 화면으로 돌아가기
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 max-w-xl mx-auto w-full px-4 py-12 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-md text-center w-full space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">제출이 완료되었습니다!</h2>
              <p className="text-sm text-slate-600">
                <strong className="font-semibold text-slate-900">{studentNumber} {studentName}</strong> 학생의 답안이 선생님께 정상적으로 전달되었습니다.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">학습지:</span>
                <span className="font-semibold text-slate-800">{worksheet.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">제출 시각:</span>
                <span className="font-mono text-slate-800">{submittedResult?.submittedAt || '방금'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">작성한 문항:</span>
                <span className="font-bold text-emerald-800">{filledCount} / {totalBlanks}칸</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSubmittedSuccess(false);
                  setAnswers({});
                }}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>새로운 학생으로 다시 풀기</span>
              </button>
            </div>
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-slate-400">
          AI 학습지 도우미 학생 제출 시스템
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6f4] pb-24">
      {/* Student Top Header matching Image 5 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-slate-800 tracking-tight">AI 학습지 도우미</span>
          </div>

          {onExitToTeacher && (
            <button
              onClick={onExitToTeacher}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
            >
              {isTeacherTesting ? '교사 모드로 복귀' : '교사 로그인'}
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Student Profile Card matching Image 5 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5">
              <span>🎓</span>
              <span>{worksheet.gradeLevel} · {worksheet.subject}</span>
            </span>
            <span className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              자동 저장 켜짐
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                학번 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="예) 10101"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2e6d4e] text-sm bg-slate-50/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="이름 입력"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2e6d4e] text-sm bg-slate-50/50"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-800" />
              작성 중인 답은 자동 저장돼요 (새로고침해도 유지, 창을 닫으면 지워짐)
            </span>
            <span className="font-bold text-slate-700 shrink-0">
              작성한 칸 {filledCount} / {totalBlanks} ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar matching Image 5 */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#2e6d4e] h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Worksheet Interactive Card matching Image 5 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-10 space-y-6">
          {/* Aesthetic Pastel Top Strip */}
          <div className="h-2 w-full rounded-md flex overflow-hidden">
            <div className="flex-1 bg-slate-300" />
            <div className="flex-1 bg-sky-300" />
            <div className="flex-1 bg-sky-200" />
            <div className="flex-1 bg-indigo-200" />
            <div className="flex-1 bg-violet-200" />
            <div className="flex-1 bg-amber-100" />
            <div className="flex-1 bg-orange-200" />
            <div className="flex-1 bg-orange-300" />
            <div className="flex-1 bg-orange-400" />
            <div className="flex-1 bg-red-400" />
            <div className="flex-1 bg-red-500" />
          </div>

          {/* Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {worksheet.title}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {worksheet.subject} | {worksheet.gradeLevel}
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold text-slate-600 shrink-0 self-end sm:self-auto">
              <div>학번: <span className="font-bold text-slate-900">{studentNumber || '____'}</span></div>
              <div>이름: <span className="font-bold text-slate-900">{studentName || '____'}</span></div>
            </div>
          </div>

          {/* Core Concept Quote */}
          {worksheet.coreConcept && (
            <div className="border-l-4 border-amber-600 bg-amber-50/40 p-4 rounded-r-xl">
              <p className="text-sm sm:text-base text-slate-900 font-medium leading-relaxed">
                {worksheet.coreConcept}
              </p>
            </div>
          )}

          {/* Learning Objectives */}
          {worksheet.learningObjectives && worksheet.learningObjectives.length > 0 && (
            <div className="pl-1">
              <ul className="space-y-1 text-xs sm:text-sm text-slate-700 list-disc list-inside">
                {worksheet.learningObjectives.map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Worksheet Sections with Interactive Inputs */}
          <div className="space-y-8 pt-4">
            {worksheet.sections.map((sec, secIdx) => (
              <div key={sec.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-slate-900 text-white text-xs font-bold rounded">
                    {sec.type === 'warmup' ? '생각 열기' : sec.type === 'concept' ? '개념 이해' : sec.type === 'self_check' ? '스스로 점검' : `활동 ${secIdx}`}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{sec.title}</h3>
                </div>

                {/* Section prompt/narrative */}
                <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                  {sec.content}
                </div>

                {/* Interactive blank answers list */}
                {sec.blanks && sec.blanks.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {sec.blanks.map((b) => {
                      const studentAns = answers[b.id] || '';
                      const isFilled = studentAns.trim().length > 0;

                      return (
                        <div
                          key={b.id}
                          className={`p-3.5 rounded-xl border transition ${
                            isFilled
                              ? 'bg-white border-emerald-300 shadow-xs'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="text-xs text-slate-800 flex-1">
                              <span className="font-bold text-slate-900 mr-1.5">({b.order})</span>
                              <span>{b.questionText}</span>
                            </div>

                            {/* Blank Type Specific Input */}
                            <div className="shrink-0 flex items-center">
                              {b.type === 'ox' ? (
                                <div className="flex items-center space-x-2">
                                  {(['O', 'X'] as const).map((opt) => (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => handleAnswerChange(b.id, opt)}
                                      className={`w-10 h-9 rounded-xl font-bold text-sm transition flex items-center justify-center border ${
                                        studentAns.toUpperCase() === opt
                                          ? opt === 'O'
                                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                                            : 'bg-red-600 text-white border-red-600 shadow-xs'
                                          : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              ) : b.type === 'short_answer' ? (
                                <textarea
                                  rows={2}
                                  value={studentAns}
                                  onChange={(e) => handleAnswerChange(b.id, e.target.value)}
                                  placeholder="생각 또는 서술형 답안 작성"
                                  className="w-full sm:w-64 p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2e6d4e] focus:outline-none"
                                />
                              ) : (
                                <div className="relative w-full sm:w-56">
                                  <input
                                    type="text"
                                    value={studentAns}
                                    onChange={(e) => handleAnswerChange(b.id, e.target.value)}
                                    placeholder="답을 입력하세요"
                                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#2e6d4e] ${
                                      isFilled
                                        ? 'border-emerald-400 bg-emerald-50/20 font-semibold text-slate-900'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Bottom Submit Bar matching Image 5 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 shadow-lg py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className={`w-4 h-4 ${progressPercent === 100 ? 'text-emerald-800' : 'text-slate-400'}`} />
            <span>
              {totalBlanks}칸 중 <strong className="text-emerald-800 font-bold">{filledCount}칸</strong> 작성
            </span>
          </div>

          <button
            onClick={handlePreSubmit}
            disabled={isSubmitting}
            className="py-3 px-6 rounded-xl font-bold bg-[#2e6d4e] hover:bg-[#255940] active:scale-[0.98] text-white transition flex items-center space-x-2 shadow-sm text-sm"
          >
            <span>제출하기</span>
            <Send className="w-4 h-4 ml-1" />
          </button>
        </div>
      </footer>

      {/* Unfilled Blanks Confirmation Modal matching Requirement 4 */}
      {showUnfilledModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                아직 작성하지 않은 칸이 있어요!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                총 <strong className="text-slate-900">{totalBlanks}개</strong> 중{' '}
                <strong className="text-red-600 font-bold">{totalBlanks - filledCount}개</strong>가 아직 빈칸입니다.
                그래도 지금 제출하시겠습니까?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUnfilledModal(false)}
                className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition"
              >
                다시 풀기
              </button>
              <button
                type="button"
                onClick={executeSubmit}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl bg-[#2e6d4e] hover:bg-[#255940] text-white text-xs sm:text-sm font-bold transition shadow-xs"
              >
                {isSubmitting ? '제출 중...' : '그래도 제출'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
