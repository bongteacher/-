import React, { useState } from 'react';
import {
  BookOpen,
  CheckSquare,
  Square,
  Edit3,
  Printer,
  X,
  Sparkles,
  Share2,
  Trash2,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Compass,
  CornerDownRight,
  ListPlus
} from 'lucide-react';
import { Worksheet, ActivitySection, BlankItem, BlankType } from '../types';

interface TeacherWorksheetViewProps {
  worksheet: Worksheet;
  onUpdateWorksheet: (updated: Worksheet) => void;
  onClose: () => void;
  onDistribute: (ws: Worksheet) => void;
  userApiKey?: string;
}

export const TeacherWorksheetView: React.FC<TeacherWorksheetViewProps> = ({
  worksheet,
  onUpdateWorksheet,
  onClose,
  onDistribute,
  userApiKey,
}) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAiIntentOpen, setIsAiIntentOpen] = useState(true);

  // Editable clone
  const [editableWs, setEditableWs] = useState<Worksheet>(worksheet);

  // AI Section Re-generation state
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null);
  const [aiPromptModalSection, setAiPromptModalSection] = useState<ActivitySection | null>(null);
  const [aiCustomInstruction, setAiCustomInstruction] = useState('');

  // Handle printing
  const handlePrint = (withAnswers: boolean) => {
    const prevShow = showAnswers;
    setShowAnswers(withAnswers);

    // Give react time to render answer highlights
    setTimeout(() => {
      window.print();
      // Restore view state after print
      setTimeout(() => {
        setShowAnswers(prevShow);
      }, 500);
    }, 150);
  };

  const handleSaveEdits = () => {
    // Recount blanks
    let count = 0;
    editableWs.sections.forEach((sec) => {
      if (sec.blanks) count += sec.blanks.length;
    });
    const updated = {
      ...editableWs,
      totalBlanksCount: count,
      updatedAt: new Date().toISOString(),
    };
    setEditableWs(updated);
    onUpdateWorksheet(updated);
    setIsEditing(false);
  };

  // Add new section
  const handleAddSection = () => {
    const newSec: ActivitySection = {
      id: 'sec-' + Date.now(),
      type: 'activity',
      title: `활동 ${editableWs.sections.length}: 새로운 탐구 활동`,
      content: '학생들이 직접 탐구하고 식을 도출하거나 문제를 풀 수 있도록 안내하세요.\n( 1 )에 들어갈 알맞은 말을 적어보세요.',
      blanks: [
        {
          id: 'b-' + Date.now(),
          order: editableWs.totalBlanksCount + 1,
          activityId: 'sec-' + Date.now(),
          activityTitle: `활동 ${editableWs.sections.length}`,
          questionText: '활동 새 문항',
          correctAnswer: '정답',
          type: 'fill_blank',
        },
      ],
    };

    setEditableWs((prev) => ({
      ...prev,
      sections: [...prev.sections, newSec],
    }));
  };

  // Remove section
  const handleDeleteSection = (secId: string) => {
    if (confirm('이 활동 섹션을 삭제하시겠습니까?')) {
      setEditableWs((prev) => ({
        ...prev,
        sections: prev.sections.filter((s) => s.id !== secId),
      }));
    }
  };

  // Add blank to section
  const handleAddBlank = (secId: string) => {
    setEditableWs((prev) => {
      const sections = prev.sections.map((sec) => {
        if (sec.id === secId) {
          const newBlank: BlankItem = {
            id: 'b-' + Date.now(),
            order: (sec.blanks?.length || 0) + 1,
            activityId: sec.id,
            activityTitle: sec.title,
            questionText: '새 문항 질문 요약',
            correctAnswer: '',
            type: 'fill_blank',
          };
          return {
            ...sec,
            blanks: [...(sec.blanks || []), newBlank],
          };
        }
        return sec;
      });
      return { ...prev, sections };
    });
  };

  // Delete blank
  const handleDeleteBlank = (secId: string, blankId: string) => {
    setEditableWs((prev) => {
      const sections = prev.sections.map((sec) => {
        if (sec.id === secId) {
          return {
            ...sec,
            blanks: sec.blanks.filter((b) => b.id !== blankId),
          };
        }
        return sec;
      });
      return { ...prev, sections };
    });
  };

  // Execute AI Regeneration for a specific section
  const handleRunAiRegenerate = async () => {
    if (!aiPromptModalSection) return;
    setRegeneratingSectionId(aiPromptModalSection.id);
    const targetSec = aiPromptModalSection;
    setAiPromptModalSection(null);

    try {
      const res = await fetch('/api/ai/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType: targetSec.type,
          currentTitle: targetSec.title,
          currentContent: targetSec.content,
          worksheetTopic: editableWs.topic,
          subject: editableWs.subject,
          instructions: aiCustomInstruction,
          userApiKey,
        }),
      });

      if (!res.ok) throw new Error('재생성 실패');
      const data = await res.json();

      setEditableWs((prev) => {
        const sections = prev.sections.map((sec) => {
          if (sec.id === targetSec.id) {
            return {
              ...sec,
              title: data.title || sec.title,
              content: data.content || sec.content,
              blanks: (data.blanks || []).map((b: any, idx: number) => ({
                ...b,
                id: b.id || `b-${sec.id}-${idx + 1}`,
                order: idx + 1,
                activityId: sec.id,
                activityTitle: data.title || sec.title,
              })),
            };
          }
          return sec;
        });
        return { ...prev, sections };
      });
    } catch (err: any) {
      alert('AI 섹션 재생성 중 오류가 발생했습니다: ' + (err.message || '네트워크 오류'));
    } finally {
      setRegeneratingSectionId(null);
      setAiCustomInstruction('');
    }
  };

  // Render text with math formulas or inline answers
  const renderFormattedText = (text: string, sectionBlanks?: BlankItem[]) => {
    if (!text) return null;

    // Split by newlines
    const lines = text.split('\n');
    return (
      <div className="space-y-2 leading-relaxed text-slate-800 text-[15px]">
        {lines.map((line, lIdx) => (
          <p key={lIdx} className="leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    );
  };

  const ws = isEditing ? editableWs : worksheet;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Controls Header matching Image 3 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left Title Info */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-white shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 truncate tracking-tight">
                  {ws.title}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {ws.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {ws.gradeLevel} · {ws.subject}
              </p>
            </div>
          </div>

          {/* Right Action Tools matching Image 3 */}
          <div className="flex items-center space-x-2 flex-wrap">
            {/* Show Answers Toggle */}
            <label className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAnswers}
                onChange={(e) => setShowAnswers(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700"
              />
              <span className={showAnswers ? 'text-red-600 font-bold' : ''}>정답 보기</span>
            </label>

            {/* Edit Mode Toggle */}
            {isEditing ? (
              <button
                onClick={handleSaveEdits}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>편집 완료 및 저장</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditableWs(worksheet);
                  setIsEditing(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>편집</span>
              </button>
            )}

            {/* Print Student Version */}
            <button
              onClick={() => handlePrint(false)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>학생용 인쇄</span>
            </button>

            {/* Print Answer Version */}
            <button
              onClick={() => handlePrint(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>정답 포함 인쇄</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              title="닫기"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Worksheet Container */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* AI Pedagogical Intent Alert Box matching Image 3 */}
        {ws.aiPedagogyIntent && (
          <div className="no-print bg-sky-50/90 border border-sky-200/90 rounded-2xl p-4 sm:p-5 text-sky-950 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 text-sky-900 font-bold text-sm mb-1.5">
                <Compass className="w-4 h-4 text-sky-700" />
                <span>AI의 수업 설계 의도</span>
              </div>
              <button
                onClick={() => setIsAiIntentOpen(!isAiIntentOpen)}
                className="text-sky-600 hover:text-sky-800 text-xs p-1"
              >
                {isAiIntentOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            {isAiIntentOpen && (
              <p className="text-xs sm:text-sm text-sky-900 leading-relaxed mt-1">
                {ws.aiPedagogyIntent}
              </p>
            )}
          </div>
        )}

        {/* Printable Worksheet Card matching Image 3 layout */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 print-page relative">
          {/* Aesthetic Pastel Color Palette Strip at the top matching Image 3 */}
          <div className="h-2.5 w-full rounded-md mb-8 flex overflow-hidden">
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

          {/* Title and Student Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800/80 pb-6 mb-6">
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={ws.title}
                  onChange={(e) => setEditableWs({ ...editableWs, title: e.target.value })}
                  className="text-2xl sm:text-3xl font-extrabold text-slate-900 border-b border-dashed border-emerald-600 focus:outline-none w-full mb-1"
                />
              ) : (
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {ws.title}
                </h2>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {ws.subject} | {ws.gradeLevel}
              </p>
            </div>

            {/* Student Header lines: 학번 ________ 이름 ________ */}
            <div className="flex items-center space-x-4 text-xs font-semibold text-slate-700 shrink-0 self-end sm:self-auto pt-2">
              <div className="flex items-center">
                <span>학번</span>
                <span className="inline-block w-20 border-b border-slate-600 ml-1.5 pb-1"></span>
              </div>
              <div className="flex items-center">
                <span>이름</span>
                <span className="inline-block w-24 border-b border-slate-600 ml-1.5 pb-1"></span>
              </div>
            </div>
          </div>

          {/* Core Concept Red Quote Box matching Image 3 */}
          {ws.coreConcept && (
            <div className="border-l-4 border-amber-600 bg-amber-50/40 p-4 sm:p-5 rounded-r-xl mb-6">
              {isEditing ? (
                <div>
                  <span className="text-xs font-bold text-amber-900 block mb-1">핵심 개념 요약:</span>
                  <textarea
                    rows={2}
                    value={ws.coreConcept}
                    onChange={(e) => setEditableWs({ ...editableWs, coreConcept: e.target.value })}
                    className="w-full text-sm text-slate-800 p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              ) : (
                <p className="text-[15px] text-slate-900 font-medium leading-relaxed">
                  {ws.coreConcept}
                </p>
              )}
            </div>
          )}

          {/* Learning Objectives Bullets */}
          {ws.learningObjectives && ws.learningObjectives.length > 0 && (
            <div className="mb-8 pl-1">
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 list-disc list-inside">
                {ws.learningObjectives.map((obj, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Worksheet Sections */}
          <div className="space-y-8">
            {ws.sections.map((sec, secIdx) => {
              const isSectionRegenerating = regeneratingSectionId === sec.id;

              return (
                <div
                  key={sec.id}
                  className={`relative p-5 rounded-2xl transition border ${
                    isEditing ? 'border-dashed border-emerald-300 bg-emerald-50/20' : 'border-slate-100 bg-white'
                  }`}
                >
                  {/* Edit Controls Toolbar for Section */}
                  {isEditing && (
                    <div className="no-print flex items-center justify-between pb-3 mb-3 border-b border-emerald-200/60">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          {sec.type === 'warmup' && '생각열기'}
                          {sec.type === 'concept' && '개념이해'}
                          {sec.type === 'activity' && '활동'}
                          {sec.type === 'self_check' && '스스로 점검'}
                        </span>
                        <span className="text-xs text-slate-500">섹션 #{secIdx + 1}</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAiPromptModalSection(sec);
                            setAiCustomInstruction('');
                          }}
                          disabled={isSectionRegenerating}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-800 hover:bg-sky-100 transition flex items-center space-x-1 border border-sky-200"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                          <span>AI로 다시 쓰기</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSection(sec.id)}
                          title="섹션 삭제"
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Section Title */}
                  <div className="mb-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditableWs((prev) => ({
                            ...prev,
                            sections: prev.sections.map((s) => (s.id === sec.id ? { ...s, title: val } : s)),
                          }));
                        }}
                        className="text-base font-bold text-slate-900 border-b border-slate-300 w-full p-1"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-slate-900 text-white text-xs font-bold rounded">
                          {sec.type === 'warmup' ? '생각 열기' : sec.type === 'concept' ? '개념 이해' : sec.type === 'self_check' ? '스스로 점검' : `활동 ${secIdx}`}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {sec.title}
                        </h3>
                      </div>
                    )}
                  </div>

                  {/* Section Content */}
                  <div className="text-slate-800 mb-4">
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={sec.content}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditableWs((prev) => ({
                            ...prev,
                            sections: prev.sections.map((s) => (s.id === sec.id ? { ...s, content: val } : s)),
                          }));
                        }}
                        className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-700 leading-relaxed font-sans"
                      />
                    ) : (
                      renderFormattedText(sec.content, sec.blanks)
                    )}
                  </div>

                  {/* Blanks and Questions List */}
                  {sec.blanks && sec.blanks.length > 0 && (
                    <div className="space-y-3 mt-4 pt-3 border-t border-slate-100">
                      <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
                        <span>문항 및 정답 키 ({sec.blanks.length}개)</span>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleAddBlank(sec.id)}
                            className="text-xs text-emerald-800 font-bold hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> 새 문항(빈칸) 추가
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {sec.blanks.map((b, bIdx) => (
                          <div
                            key={b.id}
                            className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-slate-600">({b.order})</span>
                                    <input
                                      type="text"
                                      value={b.questionText}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditableWs((prev) => ({
                                          ...prev,
                                          sections: prev.sections.map((s) =>
                                            s.id === sec.id
                                              ? {
                                                  ...s,
                                                  blanks: s.blanks.map((blk) =>
                                                    blk.id === b.id ? { ...blk, questionText: val } : blk
                                                  ),
                                                }
                                              : s
                                          ),
                                        }));
                                      }}
                                      placeholder="문항 설명"
                                      className="flex-1 p-1 text-xs border rounded bg-white"
                                    />
                                    <select
                                      value={b.type}
                                      onChange={(e) => {
                                        const val = e.target.value as BlankType;
                                        setEditableWs((prev) => ({
                                          ...prev,
                                          sections: prev.sections.map((s) =>
                                            s.id === sec.id
                                              ? {
                                                  ...s,
                                                  blanks: s.blanks.map((blk) =>
                                                    blk.id === b.id ? { ...blk, type: val } : blk
                                                  ),
                                                }
                                              : s
                                          ),
                                        }));
                                      }}
                                      className="p-1 border rounded bg-white text-xs"
                                    >
                                      <option value="fill_blank">빈칸 채우기</option>
                                      <option value="ox">OX 퀴즈</option>
                                      <option value="short_answer">서술형</option>
                                    </select>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-emerald-800 shrink-0">정답:</span>
                                    <input
                                      type="text"
                                      value={b.correctAnswer}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditableWs((prev) => ({
                                          ...prev,
                                          sections: prev.sections.map((s) =>
                                            s.id === sec.id
                                              ? {
                                                  ...s,
                                                  blanks: s.blanks.map((blk) =>
                                                    blk.id === b.id ? { ...blk, correctAnswer: val } : blk
                                                  ),
                                                }
                                              : s
                                          ),
                                        }));
                                      }}
                                      placeholder="정답 입력"
                                      className="flex-1 p-1 text-xs border rounded bg-white text-red-600 font-bold"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <span className="font-bold text-slate-700 mr-2">({b.order})</span>
                                  <span className="text-slate-800">{b.questionText}</span>
                                  {b.type === 'ox' && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px]">
                                      OX 퀴즈
                                    </span>
                                  )}
                                  {b.explanation && (
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      💡 해설: {b.explanation}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Show Answer highlight (Red Point) matching requirement */}
                            {!isEditing && (
                              <div className="shrink-0 flex items-center space-x-2">
                                {showAnswers ? (
                                  <span className="px-2.5 py-1 bg-red-50 text-red-600 font-bold rounded-lg border border-red-200 answer-highlight animate-fadeIn">
                                    정답: {b.correctAnswer}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-400 font-mono rounded">
                                    [빈칸]
                                  </span>
                                )}
                              </div>
                            )}

                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => handleDeleteBlank(sec.id, b.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Section Button in Edit Mode */}
          {isEditing && (
            <div className="no-print mt-6 text-center">
              <button
                type="button"
                onClick={handleAddSection}
                className="py-3 px-6 rounded-2xl border-2 border-dashed border-emerald-400 text-emerald-800 hover:bg-emerald-50 text-sm font-bold transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ 새 활동 추가</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Action Bar matching Image 3 */}
      <footer className="no-print bg-white border-t border-slate-200 sticky bottom-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-xs sm:text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              활동 {ws.sections.length}개 · 학생이 채울 칸 {ws.totalBlanksCount}개
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">
              초안은 자동으로 저장돼 있어요. 확인한 뒤 배포해 주세요.
            </span>
          </div>

          <button
            onClick={() => onDistribute(ws)}
            className="py-3 px-6 rounded-xl font-bold bg-[#2e6d4e] hover:bg-[#255940] text-white transition flex items-center justify-center space-x-2 shadow-sm text-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>이 학습지를 학생들에게 배포</span>
          </button>
        </div>
      </footer>

      {/* AI Section Regeneration Modal */}
      {aiPromptModalSection && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>'{aiPromptModalSection.title}' 섹션 AI 재생성</span>
              </h3>
              <button
                onClick={() => setAiPromptModalSection(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              어떤 방향으로 변경하고 싶으신가요? AI가 학습 목표에 맞게 해당 섹션을 새롭게 재구성합니다.
            </p>

            <textarea
              rows={3}
              value={aiCustomInstruction}
              onChange={(e) => setAiCustomInstruction(e.target.value)}
              placeholder="예: 실생활 예시를 더 흥미로운 내용으로 바꿔줘 / OX 퀴즈를 3개로 늘려줘 / 난이도를 조금 더 쉽게 낮춰줘"
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-700"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setAiPromptModalSection(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleRunAiRegenerate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2e6d4e] hover:bg-[#255940] text-white"
              >
                재생성 실행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
