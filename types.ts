
import { LucideIcon } from 'lucide-react';

export type DiseaseStage = 'H0' | 'E1' | 'E2' | 'E3' | 'N0';

export interface TreatmentProtocol {
  immediate: string[];
  preventive?: string[];
  cultural?: string[];
  chemical?: string[];
  nutritional?: string[];
  recovery?: string[];
  photographyTips?: string[];
  tips?: string[];
}

export interface DiseaseInfo {
  name: string;
  severity: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
  description: string;
  symptoms: string[];
  biologicalInterpretation: string;
  visualDescription: string;
  forAIUse: string;
  lesionSizeRange?: string;
  treatment: TreatmentProtocol;
  prognosis?: string;
}

export interface ImageQuality {
  avgBrightness: number;
  isTooDark: boolean;
  isTooBright: boolean;
  hasShadows: boolean;
  hasOverexposure: boolean;
  resolution: { width: number; height: number };
  isLowRes: boolean;
}

export interface AnalysisResult {
  stage: DiseaseStage;
  confidence: number;
  disease: DiseaseInfo;
  lesionCount: number;
  avgLesionSize: number;
  severityScore: string;
  timestamp: string;
  qualityIssues: {
    tooDark?: boolean;
    shadows?: boolean;
    lowRes?: boolean;
    overexposed?: boolean;
  } | null;
  aiExplanation?: string;
  detectedSymptoms: string[];
  visualEvidenceRegions: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  stage: DiseaseStage;
  diseaseName: string;
  confidence: number;
  severityScore: string;
  thumbnail?: string;
}
