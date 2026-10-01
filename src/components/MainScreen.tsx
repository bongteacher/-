import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Settings,
  LogOut,
  Sparkles,
  Search,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Users,
  CheckCircle2,
  Trash2,
  Copy,
  Clock,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { Worksheet } from '../types';

interface MainScreenProps {
  worksheets: Worksheet[];
  onSelectWorksheet: (ws: Worksheet) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  onDeleteWorksheet: (id: string) => void;
  onGenerate: (data: {
    topic: string;
    subject: string;
    gradeLevel: string;
    difficulty: '기초' | '표준' | '심화';
    considerations: string;
  }) => Promise<void>;
  onOpenSubmissions: (ws: Worksheet) => void;
  onOpenDistribution: (ws: Worksheet) => void;
  isGenerating: boolean;
}

const PRESET_EXAMPLES = [
  {
    topic: '이차함수의 정의, 기본형 y=ax^2의 그래프의 성질, 표준형 y=a(x-p)^2+q 평행이동의 원리 및 축의 방정식과 꼭짓점 구하기',
    subject: '수학 공통',
    gradeLevel: '고등학교 1학년',
    difficulty: '표준' as const,
    considerations: '오개념 OX 퀴즈 포함, 실생활 포물선 예시, 스스로 점검 포함',
  },
  {
    topic: '산업화 이후 화석 연료의 과도한 사용으로 인해 대기 중 이산화 탄소와 온실 기체 농도가 급격히 증가하여 지구 온난화 및 온실 효과가 강화되고 극지방 빙하 융해와 기후 위기 발생',
    subject: '통합과학',
    gradeLevel: '고등학교 1학년',
    difficulty: '표준' as const,
    considerations: '온실 기체 종류 정리 표, 기후 변화 원인과 대책 빈칸 채우기, 실천 체크리스트',
  },
  {
    topic: '시장 실패(Market Failure)의 대표적 원인인 공공재의 무임승차 문제, 외부 효과(외부 불경제와 외부 경제), 독과점의 폐해와 이를 시정하기 위한 정부의 시장 개입 정책 및 한계',
    subject: '통합사회',
    gradeLevel: '고등학교 1학년',
    difficulty: '표준' as const,
    considerations: '실생활 사례 적용(플라스틱 부담금, 백신 접종의 외부효과), 정부 실패와의 비교',
  },
  {
    topic: '세포 호흡과 광합성의 유기적 관계: 엽록체에서의 빛에너지 흡수와 포도당 합성, 미토콘드리아에서의 ATP 생성 과정 및 물질대사의 에너지 흐름',
    subject: '생명과학',
    gradeLevel: '고등학교 2학년',
    difficulty: '심화' as const,
    considerations: '화학반응식 완성하기, ATP-ADP 순환 과정 모식도 해석 문항 포함',
  },
];

export const MainScreen: React.FC<MainScreenProps> = ({
  worksheets,
  onSelectWorksheet,
  onOpenSettings,
  onLogout,
  onRefresh,
  onDeleteWorksheet,
  onGenerate,
  onOpenSubmissions,
  onOpenDistribution,
  isGenerating,
}) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('고등학교 1학년');
  const [difficulty, setDifficulty] = useState<'기초' | '표준' | '심화'>('표준');
  const [considerations, setConsiderations] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Generation timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isGenerating) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGenerating]);

  // Preset filler
  const [presetIndex, setPresetIndex] = useState(0);
  const handleFillExample = () => {
    const preset = PRESET_EXAMPLES[presetIndex % PRESET_EXAMPLES.length];
    setTopic(preset.topic);
    setSubject(preset.subject);
    setGradeLevel(preset.gradeLevel);
    setDifficulty(preset.difficulty);
    setConsiderations(preset.considerations);
    setPresetIndex((prev) => prev + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onGenerate({
      topic,
      subject,
      gradeLevel,
      difficulty,
      considerations,
    });
  };

  const filteredWorksheets = worksheets.filter((ws) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      ws.title.toLowerCase().includes(q) ||
      ws.subject.toLowerCase().includes(q) ||
      ws.gradeLevel.toLowerCase().includes(q) ||
      ws.topic.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#f3f6f4] pb-16">
      {/* Top Header matching Image 2 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/25">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-slate-800 tracking-tight">AI 학습지 도우미</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 font-semibold">교사용</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition text-sm font-medium"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>설정</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition text-sm font-medium"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Studio Card matching Image 2 */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <div className="mb-6">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>수업 설계 스튜디오</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              무엇을 가르치실 건가요?
            </h1>
            <p className="text-sm text-slate-600 mt-1.5">
              교과서 지문이나 수업 주제만 적으면, AI가 내용에 맞는 활동 흐름을 설계해 학습지로 만들어 드려요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Topic Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-800 flex items-center">
                  수업 주제 또는 교과서 지문 <span className="text-red-500 ml-1">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleFillExample}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition border border-emerald-200/70"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>예시 채우기</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={6}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={`교과서 지문, 핵심 개념, 수업 주제를 자유롭게 입력하세요.
예) [통합과학] 산업화 이후 대기 중 이산화 탄소 농도가 증가하여 온실 효과가 강화되고 지구의 평균 기온이 상승하고 있다.
예) [공통수학1] 행렬의 곱셈에서 교환법칙이 성립하지 않는 이유를 예를 들어 설명하기
예) [통합사회] 시장 실패의 원인과 이를 보완하기 위한 정부의 역할`}
                  className="w-full p-4 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2e6d4e] focus:border-transparent text-sm leading-relaxed placeholder-slate-400 bg-white"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mt-2 px-1">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400 inline" />
                  PDF·한글 문서의 본문을 그대로 붙여넣어도 돼요
                </span>
                <span className="font-mono">{topic.length.toLocaleString()} / 20,000자</span>
              </div>
            </div>

            {/* Row: Subject, Grade, Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  과목 <span className="font-normal text-slate-500">(비우면 AI가 판단)</span>
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="예) 한문 I, 통합사회, 생명과학"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2e6d4e] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  대상 학년
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="예) 고등학교 1학년"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2e6d4e] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  난이도
                </label>
                <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {(['기초', '표준', '심화'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                        difficulty === lvl
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Considerations */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                희망사항 <span className="font-normal text-slate-500">(선택)</span>
              </label>
              <input
                type="text"
                value={considerations}
                onChange={(e) => setConsiderations(e.target.value)}
                placeholder="예) 그래프 해석 활동은 꼭 넣어줘 / 토론 활동은 빼줘 / 활동 5개 이내"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2e6d4e] text-sm"
              />
            </div>

            {/* Submit Button matching Image 2 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-white transition flex items-center justify-center space-x-2 shadow-sm ${
                  isGenerating
                    ? 'bg-[#3b8761] cursor-not-allowed'
                    : 'bg-[#2e6d4e] hover:bg-[#255940] active:scale-[0.99]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-base">
                      AI 학습지 설계 중... ({elapsedSeconds}초 경과)
                    </span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span className="text-base">AI 학습지 설계하기</span>
                    <span className="text-xs font-normal opacity-90 px-2 py-0.5 rounded-md bg-white/20 ml-2">
                      보통 20~60초
                    </span>
                  </>
                )}
              </button>

              {isGenerating && (
                <div className="mt-3 text-center space-y-1">
                  <p className="text-xs text-emerald-800 font-medium animate-pulse">
                    {elapsedSeconds < 8 && '✨ 1단계: 교과 성취기준 및 학습 목표 수립 중...'}
                    {elapsedSeconds >= 8 && elapsedSeconds < 18 && '💡 2단계: 생각열기 및 개념 이해 빈칸 문항 설계 중...'}
                    {elapsedSeconds >= 18 && elapsedSeconds < 30 && '🔍 3단계: 오개념 진단 OX 퀴즈 및 응용 활동 구성 중...'}
                    {elapsedSeconds >= 30 && '📝 4단계: 스스로 점검 문항 및 최종 자동 채점 키 생성 중...'}
                  </p>
                  <p className="text-xs text-slate-500">
                    생성이 완료되면 자동으로 상세 학습지 편집 화면으로 이동합니다.
                  </p>
                </div>
              )}
            </div>
          </form>
        </section>

        {/* Recent Worksheets Archive matching Image 2 */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-5 h-5 text-slate-700" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">최근 학습지</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                {worksheets.length}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="제목·과목으로 찾기 (예: 행렬, 통합과학)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2e6d4e] text-xs bg-white"
                />
              </div>
              <button
                onClick={onRefresh}
                title="새로고침"
                className="p-2 rounded-xl border border-slate-300 hover:bg-white text-slate-600 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {filteredWorksheets.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 mx-auto mb-4">
                <FolderOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">아직 만든 학습지가 없어요</h3>
              <p className="text-sm text-slate-500">
                위에서 첫 학습지를 설계해 보세요! 언제든 이곳에 안전하게 아카이빙됩니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredWorksheets.map((ws) => (
                <div
                  key={ws.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {ws.subject || '공통'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {ws.gradeLevel}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                            ws.status === '배포 중'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ws.status}
                        </span>
                      </div>
                      <h3
                        onClick={() => onSelectWorksheet(ws)}
                        className="text-base font-bold text-slate-900 hover:text-emerald-800 cursor-pointer truncate tracking-tight"
                      >
                        {ws.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        활동 {ws.sections?.length || 0}개 · 빈칸 {ws.totalBlanksCount || 0}개 · 생성일: {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString() : '최근'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                    {/* Submissions button */}
                    <button
                      onClick={() => onOpenSubmissions(ws)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center space-x-1"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>제출 {ws.submissionCount || 0}건</span>
                    </button>

                    {/* Distribute button */}
                    <button
                      onClick={() => onOpenDistribution(ws)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 transition"
                    >
                      배포 안내
                    </button>

                    {/* Open worksheet */}
                    <button
                      onClick={() => onSelectWorksheet(ws)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2e6d4e] hover:bg-[#255940] text-white transition flex items-center space-x-1 shadow-xs"
                    >
                      <span>학습지 열기</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`'${ws.title}' 학습지를 삭제하시겠습니까?`)) {
                          onDeleteWorksheet(ws.id);
                        }
                      }}
                      title="삭제"
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
