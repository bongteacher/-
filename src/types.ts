export type BlankType = 'fill_blank' | 'ox' | 'short_answer' | 'choice';

export interface BlankItem {
  id: string;
  order: number;
  activityId: string;
  activityTitle: string;
  questionText: string;
  correctAnswer: string;
  acceptableAnswers?: string[];
  type: BlankType;
  options?: string[];
  explanation?: string;
}

export type SectionType = 'concept' | 'warmup' | 'activity' | 'self_check';

export interface ActivitySection {
  id: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  content: string;
  blanks: BlankItem[];
}

export interface Worksheet {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  difficulty: '기초' | '표준' | '심화';
  topic: string;
  considerations?: string;
  status: '초안' | '배포 중' | '마감';
  aiPedagogyIntent: string;
  coreConcept: string;
  learningObjectives: string[];
  sections: ActivitySection[];
  totalBlanksCount: number;
  createdAt: string;
  updatedAt: string;
  submissionCount?: number;
}

export interface GradedItem {
  blankId: string;
  activityTitle: string;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  teacherOverridden?: boolean;
  comment?: string;
}

export interface StudentSubmission {
  id: string;
  worksheetId: string;
  studentNumber: string;
  studentName: string;
  submittedAt: string;
  answers: Record<string, string>;
  filledCount: number;
  totalCount: number;
  score: number;
  maxScore: number;
  gradedItems: GradedItem[];
}

export interface TeacherSettings {
  pin: string;
  apiKey: string;
  isConfigured: boolean;
}

export interface StorageStats {
  worksheetCount: number;
  submissionCount: number;
  usedBytes: number;
  usedKb: string;
  isUnlimitedLocal: boolean;
  message: string;
}
