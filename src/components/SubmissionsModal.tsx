import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  RefreshCw,
  X,
  Info,
  Check,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  Users
} from 'lucide-react';
import { Worksheet, StudentSubmission } from '../types';

interface SubmissionsModalProps {
  worksheet: Worksheet;
  onClose: () => void;
}

export const SubmissionsModal: React.FC<SubmissionsModalProps> = ({
  worksheet,
  onClose,
}) => {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/worksheets/${worksheet.id}/submissions`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
        if (data.length > 0 && !expandedSubId) {
          // Default expand first if only 1 exists (like screenshot 7)
          if (data.length === 1) {
            setExpandedSubId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [worksheet.id]);

  // Toggle teacher grading override
  const handleToggleGrade = async (subId: string, blankId: string) => {
    try {
      const res = await fetch(`/api/submissions/${subId}/toggle-grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blankId }),
      });
      if (res.ok) {
        const updatedSub = await res.json();
        setSubmissions((prev) =>
          prev.map((s) => (s.id === subId ? updatedSub : s))
        );
      }
    } catch (err) {
      console.error('Grading toggle failed:', err);
    }
  };

  // Delete submission
  const handleDeleteSubmission = async (subId: string, studentName: string) => {
    if (!confirm(`'${studentName}' 학생의 제출 답안을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/submissions/${subId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== subId));
        if (expandedSubId === subId) setExpandedSubId(null);
      }
    } catch (err) {
      console.error('Delete submission failed:', err);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (submissions.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += '제출시각,학번,이름,작성수,총문항수,점수,만점\n';

    submissions.forEach((s) => {
      csvContent += `"${s.submittedAt}","${s.studentNumber}","${s.studentName}",${s.filledCount},${s.totalCount},${s.score},${s.maxScore}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${worksheet.title}_제출현황.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Top Header matching Image 6 */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">제출 현황</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {submissions.length}건
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {worksheet.title} · {worksheet.subject}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {submissions.length > 0 && (
              <button
                onClick={handleExportCsv}
                className="hidden sm:inline-flex items-center space-x-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                title="CSV 다운로드"
              >
                <Download className="w-3.5 h-3.5" />
                <span>엑셀/CSV 다운</span>
              </button>
            )}

            <button
              onClick={fetchSubmissions}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Tip Notice Banner matching Image 6 */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl flex items-start space-x-2.5 text-xs text-emerald-950">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              객관식·빈칸은 정답과 비교한 자동 채점이에요. 동의어나 표현 차이로 x가 나올 수 있어요.{' '}
              <strong className="font-semibold text-emerald-900">[결과 보기]에서 ✓/✕를 누르면 선생님이 채점을 바꿀 수 있어요.</strong>
            </p>
          </div>

          {/* Submissions Table matching Image 6 & 7 */}
          {submissions.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 mb-1">아직 접수된 제출 내역이 없습니다</h3>
              <p className="text-xs text-slate-500">
                학생들에게 학습지 QR 코드나 링크를 배포하면 이곳에 실시간으로 집계됩니다.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-3 px-4">제출 시각</th>
                      <th className="py-3 px-4">학번</th>
                      <th className="py-3 px-4">이름</th>
                      <th className="py-3 px-4">작성</th>
                      <th className="py-3 px-4">채점</th>
                      <th className="py-3 px-4 text-right">상세</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map((sub) => {
                      const isExpanded = expandedSubId === sub.id;

                      return (
                        <React.Fragment key={sub.id}>
                          <tr className={`hover:bg-slate-50/80 transition ${isExpanded ? 'bg-emerald-50/20' : ''}`}>
                            <td className="py-3.5 px-4 font-mono text-slate-600">{sub.submittedAt}</td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900">{sub.studentNumber}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">{sub.studentName}</td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {sub.filledCount} / {sub.totalCount}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 text-sm">{sub.score}</span>
                              <span className="text-slate-400 text-xs"> / {sub.maxScore}</span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center space-x-2">
                                <button
                                  onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition text-xs"
                                >
                                  {isExpanded ? '접기' : '결과 보기'}
                                </button>
                                <button
                                  onClick={() => handleDeleteSubmission(sub.id, sub.studentName)}
                                  title="제출 삭제"
                                  className="p-1 text-slate-300 hover:text-red-500 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Detail Rows matching Image 7 */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="p-0 bg-slate-50/50 border-b border-slate-200">
                                <div className="p-4 sm:p-5">
                                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                                    <table className="w-full text-xs text-left">
                                      <thead>
                                        <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
                                          <th className="py-2.5 px-4 w-1/4">활동</th>
                                          <th className="py-2.5 px-4 w-1/3">문항</th>
                                          <th className="py-2.5 px-4">학생 답</th>
                                          <th className="py-2.5 px-4">정답/예시</th>
                                          <th className="py-2.5 px-4 text-center w-20">채점</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {sub.gradedItems && sub.gradedItems.length > 0 ? (
                                          sub.gradedItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition">
                                              <td className="py-2.5 px-4 text-slate-600 font-medium align-top">
                                                {item.activityTitle}
                                              </td>
                                              <td className="py-2.5 px-4 text-slate-900 align-top">
                                                {item.questionText}
                                              </td>
                                              <td className="py-2.5 px-4 align-top">
                                                {item.studentAnswer && item.studentAnswer.trim() ? (
                                                  <span className="font-semibold text-slate-900">
                                                    {item.studentAnswer}
                                                  </span>
                                                ) : (
                                                  <span className="text-red-500 italic font-medium">
                                                    (빈칸)
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-2.5 px-4 text-slate-600 align-top">
                                                {item.correctAnswer}
                                              </td>
                                              <td className="py-2.5 px-4 text-center align-top">
                                                {/* Interactive Clickable O/X Grading Button */}
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleGrade(sub.id, item.blankId)}
                                                  title="클릭하여 채점 변경 (O/X)"
                                                  className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition border ${
                                                    item.isCorrect
                                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                                      : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                  }`}
                                                >
                                                  {item.isCorrect ? (
                                                    <Check className="w-4 h-4 font-bold" />
                                                  ) : (
                                                    <X className="w-4 h-4 font-bold" />
                                                  )}
                                                </button>
                                              </td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan={5} className="py-4 text-center text-slate-400">
                                              세부 문항 채점 데이터가 없습니다.
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500">
            학생 답안은 로컬 및 서버에 영구 보관되며 언제든 다시 확인하실 수 있습니다.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
