// Core type definitions for SkillScout

export interface Skill {
  name: string;
  jd_weight: 1 | 2 | 3; // 3 = must have, 2 = preferred, 1 = bonus
  claimed_level: number; // 1-5 from resume
  assessed_level?: number; // 1-5 from assessment
  gap_severity?: number;
  adjacency?: number;
  learnability?: number;
}

export interface AssessmentMessage {
  role: 'agent' | 'candidate';
  content: string;
  timestamp: number;
}

export interface SkillAssessment {
  skill: Skill;
  messages: AssessmentMessage[];
  currentTurn: number;
  maxTurns: number;
  isComplete: boolean;
  confidence: number;
}

export interface LearningPlanItem {
  skill: string;
  priority: 1 | 2 | 3;
  resource: string;
  resource_url: string;
  hours_est: number;
  why_first: string;
  weeks: string;
}

export interface Scorecard {
  skills: Skill[];
  readiness_pct: number;
  weeks_to_ready: number;
  plan: LearningPlanItem[];
  critical_gaps: Skill[];
  integrity_score?: number;
  violations?: number;
}

export interface AppState {
  phase: 'upload' | 'extracting' | 'assessing' | 'report';
  jdText: string;
  resumeText: string;
  skills: Skill[];
  currentSkillIndex: number;
  currentAssessment: SkillAssessment | null;
  scorecard: Scorecard | null;
  assessments: Map<string, AssessmentMessage[]>;
}

// Sample JD for demo
export const SAMPLE_JD = `Senior ML Engineer

Required Skills:
- Python (Expert level required)
- PyTorch (Must have - 3+ years)
- Distributed Training (Required)
- Deep Learning fundamentals (Required)

Preferred Skills:
- Kubernetes (Nice to have)
- MLflow (Preferred)
- Rust (Bonus - willingness to learn)

We're looking for someone who can build and scale ML systems.`;

// Sample Resume for demo
export const SAMPLE_RESUME = `John Smith - ML Engineer

Experience:
- 3 years Python development
- Built BERT fine-tuning pipelines using PyTorch
- Some Kubernetes exposure in production
- Basic understanding of distributed systems

Skills:
- Python (Expert)
- PyTorch (Advanced)
- TensorFlow (Intermediate)
- Docker (Intermediate)
- SQL (Advanced)`;
