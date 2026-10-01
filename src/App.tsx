import React, { useState, useEffect } from 'react';
import { InitialSetup } from './components/InitialSetup';
import { MainScreen } from './components/MainScreen';
import { TeacherWorksheetView } from './components/TeacherWorksheetView';
import { StudentWorksheetView } from './components/StudentWorksheetView';
import { DistributionModal } from './components/DistributionModal';
import { SubmissionsModal } from './components/SubmissionsModal';
import { SettingsModal } from './components/SettingsModal';
import { ProjectorQrModal } from './components/ProjectorQrModal';
import { Worksheet, TeacherSettings } from './types';

export default function App() {
  // Settings & Auth state
  const [settings, setSettings] = useState<TeacherSettings | null>(() => {
    try {
      const saved = localStorage.getItem('worksheet_teacher_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // If running in development or already logged in this tab session
    return sessionStorage.getItem('teacher_authenticated') === 'true';
  });

  // Data states
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [activeWorksheet, setActiveWorksheet] = useState<Worksheet | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Student mode detection from URL params
  const [isStudentMode, setIsStudentMode] = useState<boolean>(false);
  const [studentWorksheet, setStudentWorksheet] = useState<Worksheet | null>(null);

  // Modals
  const [distributeModalWs, setDistributeModalWs] = useState<Worksheet | null>(null);
  const [submissionsModalWs, setSubmissionsModalWs] = useState<Worksheet | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [projectorData, setProjectorData] = useState<{
    worksheet: Worksheet;
    qrUrl: string;
    studentUrl: string;
  } | null>(null);

  // Fetch worksheets from API
  const loadWorksheets = async () => {
    try {
      const res = await fetch('/api/worksheets');
      if (res.ok) {
        const data = await res.json();
        setWorksheets(data);
      }
    } catch (err) {
      console.error('Failed to load worksheets:', err);
    }
  };

  useEffect(() => {
    loadWorksheets();

    // Check URL parameters for ?mode=student&id=...
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const wsId = urlParams.get('id');

    if (mode === 'student' && wsId) {
      setIsStudentMode(true);
      fetch(`/api/worksheets/${wsId}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('학습지를 찾을 수 없습니다.');
        })
        .then((ws) => {
          setStudentWorksheet(ws);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, []);

  // Update URL without full refresh when switching
  const setStudentUrlParam = (wsId: string | null) => {
    const url = new URL(window.location.href);
    if (wsId) {
      url.searchParams.set('mode', 'student');
      url.searchParams.set('id', wsId);
    } else {
      url.searchParams.delete('mode');
      url.searchParams.delete('id');
    }
    window.history.pushState({}, '', url.toString());
  };

  // Auth handlers
  const handleSetupComplete = (newSettings: TeacherSettings) => {
    setSettings(newSettings);
    setIsAuthenticated(true);
    sessionStorage.setItem('teacher_authenticated', 'true');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('teacher_authenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('teacher_authenticated');
  };

  // Worksheet generation
  const handleGenerate = async (data: {
    topic: string;
    subject: string;
    gradeLevel: string;
    difficulty: '기초' | '표준' | '심화';
    considerations: string;
  }) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userApiKey: settings?.apiKey,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '학습지 생성 실패');
      }

      const newWs = await res.json();
      setWorksheets((prev) => [newWs, ...prev]);
      setActiveWorksheet(newWs);
    } catch (err: any) {
      alert(err.message || 'AI 학습지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save/Update worksheet
  const handleUpdateWorksheet = async (updated: Worksheet) => {
    try {
      const res = await fetch('/api/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const saved = await res.json();
        setActiveWorksheet(saved);
        setWorksheets((prev) => prev.map((w) => (w.id === saved.id ? saved : w)));
      }
    } catch (err) {
      console.error('Worksheet save failed:', err);
    }
  };

  // Delete worksheet
  const handleDeleteWorksheet = async (id: string) => {
    try {
      const res = await fetch(`/api/worksheets/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setWorksheets((prev) => prev.filter((w) => w.id !== id));
        if (activeWorksheet?.id === id) setActiveWorksheet(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // 1. Student View Route
  if (isStudentMode && studentWorksheet) {
    return (
      <StudentWorksheetView
        worksheet={studentWorksheet}
        onExitToTeacher={() => {
          setIsStudentMode(false);
          setStudentUrlParam(null);
        }}
      />
    );
  }

  // 2. Initial Setup or Teacher PIN Login Route (Screen 1)
  if (!isAuthenticated || !settings || !settings.isConfigured) {
    return (
      <InitialSetup
        existingSettings={settings}
        onComplete={handleSetupComplete}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // 3. Teacher Worksheet View Route (Screen 3)
  if (activeWorksheet) {
    return (
      <>
        <TeacherWorksheetView
          worksheet={activeWorksheet}
          onUpdateWorksheet={handleUpdateWorksheet}
          onClose={() => setActiveWorksheet(null)}
          onDistribute={(ws) => setDistributeModalWs(ws)}
          userApiKey={settings.apiKey}
        />

        {/* Distribution Modal if open */}
        {distributeModalWs && (
          <DistributionModal
            worksheet={distributeModalWs}
            onClose={() => setDistributeModalWs(null)}
            onOpenStudentView={(ws) => {
              setStudentWorksheet(ws);
              setIsStudentMode(true);
              setDistributeModalWs(null);
              setStudentUrlParam(ws.id);
            }}
            onOpenProjectorQr={(ws, qrUrl, studentUrl) => {
              setProjectorData({ worksheet: ws, qrUrl, studentUrl });
            }}
            onOpenSubmissions={(ws) => {
              setSubmissionsModalWs(ws);
            }}
          />
        )}

        {/* Submissions Modal if open */}
        {submissionsModalWs && (
          <SubmissionsModal
            worksheet={submissionsModalWs}
            onClose={() => setSubmissionsModalWs(null)}
          />
        )}

        {/* Projector QR Modal if open */}
        {projectorData && (
          <ProjectorQrModal
            worksheet={projectorData.worksheet}
            studentUrl={projectorData.studentUrl}
            onClose={() => setProjectorData(null)}
          />
        )}
      </>
    );
  }

  // 4. Main Screen Route (Screen 2: Studio & Archive)
  return (
    <>
      <MainScreen
        worksheets={worksheets}
        onSelectWorksheet={(ws) => setActiveWorksheet(ws)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        onRefresh={loadWorksheets}
        onDeleteWorksheet={handleDeleteWorksheet}
        onGenerate={handleGenerate}
        onOpenSubmissions={(ws) => setSubmissionsModalWs(ws)}
        onOpenDistribution={(ws) => setDistributeModalWs(ws)}
        isGenerating={isGenerating}
      />

      {/* Distribution Modal */}
      {distributeModalWs && (
        <DistributionModal
          worksheet={distributeModalWs}
          onClose={() => setDistributeModalWs(null)}
          onOpenStudentView={(ws) => {
            setStudentWorksheet(ws);
            setIsStudentMode(true);
            setDistributeModalWs(null);
            setStudentUrlParam(ws.id);
          }}
          onOpenProjectorQr={(ws, qrUrl, studentUrl) => {
            setProjectorData({ worksheet: ws, qrUrl, studentUrl });
          }}
          onOpenSubmissions={(ws) => {
            setSubmissionsModalWs(ws);
          }}
        />
      )}

      {/* Submissions Modal */}
      {submissionsModalWs && (
        <SubmissionsModal
          worksheet={submissionsModalWs}
          onClose={() => setSubmissionsModalWs(null)}
        />
      )}

      {/* Projector QR Modal */}
      {projectorData && (
        <ProjectorQrModal
          worksheet={projectorData.worksheet}
          studentUrl={projectorData.studentUrl}
          onClose={() => setProjectorData(null)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && settings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings(newSettings)}
          onClose={() => setIsSettingsOpen(false)}
          onRefreshData={loadWorksheets}
        />
      )}
    </>
  );
}
