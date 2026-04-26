import { Skill, Scorecard, LearningPlanItem } from '../types';
import skillGraphData from '../data/skillGraph.json';

const skillGraph = skillGraphData.skills;

/**
 * Calculate adjacency between two skills
 * Returns 1 if high adjacency, 0.5 if low
 */
export function calculateAdjacency(skill1: string, skill2: string): number {
  const s1 = skill1.toLowerCase();
  const s2 = skill2.toLowerCase();
  
  const skill1Data = skillGraph[s1 as keyof typeof skillGraph];
  if (skill1Data && skill1Data.adjacent.includes(s2)) {
    return 1;
  }
  
  const skill2Data = skillGraph[s2 as keyof typeof skillGraph];
  if (skill2Data && skill2Data.adjacent.includes(s1)) {
    return 1;
  }
  
  // Check same category
  if (skill1Data && skill2Data && skill1Data.category === skill2Data.category) {
    return 0.75;
  }
  
  return 0.5;
}

/**
 * Calculate best adjacency score for a skill based on candidate's existing skills
 */
export function calculateBestAdjacency(targetSkill: string, existingSkills: Skill[]): number {
  const assessedSkills = existingSkills.filter(s => s.assessed_level && s.assessed_level >= 3);
  
  if (assessedSkills.length === 0) return 0.5;
  
  let maxAdjacency = 0;
  for (const skill of assessedSkills) {
    const adj = calculateAdjacency(targetSkill, skill.name);
    // Weight by proficiency
    const weightedAdj = adj * (skill.assessed_level! / 5);
    maxAdjacency = Math.max(maxAdjacency, weightedAdj);
  }
  
  return Math.max(maxAdjacency, 0.3); // Minimum adjacency
}

/**
 * Calculate gap severity: (required_level - actual_score) × weight
 * Anything above 4 is critical
 */
export function calculateGapSeverity(skill: Skill): number {
  const assessed = skill.assessed_level || skill.claimed_level;
  const gap = Math.max(0, 5 - assessed); // Gap from perfect
  return gap * skill.jd_weight;
}

/**
 * Calculate learnability: adjacency × (1 / gap_severity)
 * Higher = more achievable to close the gap
 */
export function calculateLearnability(skill: Skill, allSkills: Skill[]): number {
  const gapSeverity = skill.gap_severity || calculateGapSeverity(skill);
  const adjacency = skill.adjacency || calculateBestAdjacency(skill.name, allSkills);
  
  if (gapSeverity === 0) return 1; // No gap = already learned
  
  // Normalize: higher learnability = easier to learn
  return adjacency / Math.max(gapSeverity, 0.5);
}

/**
 * Generate the full scorecard with gaps and learning plan
 */
export function generateScorecard(skills: Skill[]): Scorecard {
  // Calculate all metrics for each skill
  const scoredSkills = skills.map(skill => {
    const assessed = skill.assessed_level || skill.claimed_level;
    return {
      ...skill,
      assessed_level: assessed,
      gap_severity: calculateGapSeverity(skill),
      adjacency: calculateBestAdjacency(skill.name, skills),
      learnability: calculateLearnability(skill, skills)
    };
  });

  // Calculate readiness percentage
  const totalWeight = scoredSkills.reduce((sum, s) => sum + s.jd_weight, 0);
  const weightedScore = scoredSkills.reduce((sum, s) => {
    const proficiency = (s.assessed_level || 0) / 5;
    return sum + (proficiency * s.jd_weight);
  }, 0);
  const readinessPct = Math.round((weightedScore / totalWeight) * 100);

  // Identify critical gaps (gap_severity > 4)
  const criticalGaps = scoredSkills
    .filter(s => s.gap_severity! > 4)
    .sort((a, b) => (b.gap_severity || 0) - (a.gap_severity || 0));

  // Generate learning plan prioritized by: (gap × weight) / learnability
  const planItems = scoredSkills
    .filter(s => s.gap_severity! > 1) // Only include skills with meaningful gaps
    .map(skill => {
      const priority = (skill.gap_severity! * skill.jd_weight) / (skill.learnability || 0.5);
      return { skill, priority };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4) // Max 4 items
    .map((item, index) => generatePlanItem(item.skill, index, scoredSkills));

  // Estimate weeks to ready based on total hours
  const totalHours = planItems.reduce((sum, item) => sum + item.hours_est, 0);
  const weeksToReady = Math.ceil(totalHours / 15); // Assuming 15 hours/week study time

  return {
    skills: scoredSkills,
    readiness_pct: readinessPct,
    weeks_to_ready: weeksToReady,
    plan: planItems,
    critical_gaps: criticalGaps
  };
}

/**
 * Generate a learning plan item for a skill
 */
function generatePlanItem(skill: Skill, index: number, allSkills: Skill[]): LearningPlanItem {
  const resources = getResourcesForSkill(skill.name);
  const assessed = skill.assessed_level || 0;
  const gap = 5 - assessed;
  
  // Hours estimation based on gap and weight
  const baseHours = gap * 4; // 4 hours per level
  const hoursEst = Math.round(baseHours * skill.jd_weight * 0.7);
  
  const startWeek = index * 2 + 1;
  const endWeek = startWeek + Math.ceil(hoursEst / 15);
  const weeks = `Week ${startWeek}${endWeek > startWeek ? `-${endWeek}` : ''}`;

  return {
    skill: skill.name,
    priority: (index + 1) as 1 | 2 | 3,
    resource: resources.name,
    resource_url: resources.url,
    hours_est: hoursEst,
    why_first: generateWhyReason(skill, allSkills),
    weeks
  };
}

/**
 * Get learning resources for a skill
 */
function getResourcesForSkill(skill: string): { name: string; url: string } {
  const resources: Record<string, { name: string; url: string }> = {
    'python': { name: 'Python.org Official Tutorial + Real Python', url: 'https://docs.python.org/3/tutorial/' },
    'pytorch': { name: 'PyTorch Official Tutorials', url: 'https://pytorch.org/tutorials/' },
    'tensorflow': { name: 'TensorFlow Official Guide', url: 'https://www.tensorflow.org/tutorials' },
    'kubernetes': { name: 'KodeKloud Kubernetes Labs', url: 'https://kodekloud.com/courses/kubernetes-for-beginners/' },
    'distributed training': { name: 'Hugging Face Distributed Training Guide', url: 'https://huggingface.co/docs/transformers/main_classes/deepspeed' },
    'rust': { name: 'The Rust Programming Language Book', url: 'https://doc.rust-lang.org/book/' },
    'mlflow': { name: 'MLflow Official Documentation', url: 'https://mlflow.org/docs/latest/index.html' },
    'docker': { name: 'Docker Getting Started Guide', url: 'https://docs.docker.com/get-started/' },
    'deep learning': { name: 'Stanford CS231n + fast.ai', url: 'https://course.fast.ai/' },
    'nlp': { name: 'Hugging Face NLP Course', url: 'https://huggingface.co/learn/nlp-course' },
    'computer vision': { name: 'PyTorch Vision Tutorials', url: 'https://pytorch.org/tutorials/intermediate/torchvision_tutorial.html' },
    'cuda': { name: 'CUDA Programming Guide', url: 'https://docs.nvidia.com/cuda/cuda-c-programming-guide/' },
    'mlops': { name: 'Made With ML MLOps Course', url: 'https://madewithml.com/' },
    'aws': { name: 'AWS Machine Learning Path', url: 'https://aws.amazon.com/machine-learning/' },
    'scikit-learn': { name: 'Scikit-learn Tutorials', url: 'https://scikit-learn.org/stable/tutorial/' },
    'pandas': { name: 'Pandas Official Tutorials', url: 'https://pandas.pydata.org/docs/getting_started/tutorials.html' },
  };

  const normalizedSkill = skill.toLowerCase();
  return resources[normalizedSkill] || { 
    name: `${skill} Documentation & Courses`, 
    url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' tutorial')}` 
  };
}

/**
 * Generate a reason why this skill should be learned first
 */
function generateWhyReason(skill: Skill, _allSkills: Skill[]): string {
  const adjacency = skill.adjacency || 0.5;
  const gap = skill.gap_severity || 0;
  
  if (adjacency >= 0.8 && gap > 3) {
    return `High adjacency to your existing skills + critical gap for the role`;
  } else if (adjacency >= 0.8) {
    return `Leverages your existing expertise - quick win`;
  } else if (gap > 5) {
    return `Critical requirement - must address for this role`;
  } else {
    return `Important gap that blocks other skills`;
  }
}

/**
 * Parse JD text to extract skills with weights
 */
export function extractSkillsFromJD(jdText: string): Partial<Skill>[] {
  const skills: Partial<Skill>[] = [];
  const text = jdText.toLowerCase();
  
  // Common skill patterns
  const skillPatterns = [
    { pattern: /python\s*\(?expert/g, name: 'Python', weight: 3 as const },
    { pattern: /pytorch/g, name: 'PyTorch', weight: 3 as const },
    { pattern: /tensorflow/g, name: 'TensorFlow', weight: 2 as const },
    { pattern: /kubernetes|k8s/g, name: 'Kubernetes', weight: 2 as const },
    { pattern: /docker/g, name: 'Docker', weight: 2 as const },
    { pattern: /distributed\s*training/g, name: 'Distributed Training', weight: 3 as const },
    { pattern: /rust/g, name: 'Rust', weight: 1 as const },
    { pattern: /mlflow/g, name: 'MLflow', weight: 2 as const },
    { pattern: /deep\s*learning/g, name: 'Deep Learning', weight: 3 as const },
    { pattern: /machine\s*learning|ml/g, name: 'Machine Learning', weight: 3 as const },
    { pattern: /nlp|natural\s*language/g, name: 'NLP', weight: 2 as const },
    { pattern: /computer\s*vision|cv/g, name: 'Computer Vision', weight: 2 as const },
    { pattern: /sql/g, name: 'SQL', weight: 2 as const },
    { pattern: /aws|amazon\s*web/g, name: 'AWS', weight: 2 as const },
    { pattern: /cuda|gpu/g, name: 'CUDA', weight: 2 as const },
    { pattern: /transformers/g, name: 'Transformers', weight: 2 as const },
    { pattern: /scikit-learn|sklearn/g, name: 'Scikit-learn', weight: 2 as const },
  ];

  // Check for required/must have vs preferred/nice to have
  const requiredSection = text.match(/required[:\s].*?(?:preferred|bonus|nice|$)/s);
  const preferredSection = text.match(/preferred[:\s].*?(?:bonus|$)/s);
  const bonusSection = text.match(/bonus[:\s].*?(?:\.|$)/s);

  for (const { pattern, name, weight } of skillPatterns) {
    if (pattern.test(jdText)) {
      // Determine actual weight based on context
      let actualWeight = weight;
      const nameLower = name.toLowerCase();
      
      if (bonusSection && bonusSection[0].toLowerCase().includes(nameLower)) {
        actualWeight = 1;
      } else if (preferredSection && preferredSection[0].toLowerCase().includes(nameLower)) {
        actualWeight = 2;
      } else if (requiredSection && requiredSection[0].toLowerCase().includes(nameLower)) {
        actualWeight = 3;
      }
      
      skills.push({ name, jd_weight: actualWeight });
    }
  }

  return skills;
}

/**
 * Parse resume text to extract claimed skill levels
 */
export function extractSkillsFromResume(resumeText: string): Map<string, number> {
  const skillLevels = new Map<string, number>();

  // Pattern matching for skill levels
  const levelPatterns = [
    { skill: 'python', patterns: [/python\s*\(?expert/i, /python\s*\(?advanced/i] },
    { skill: 'pytorch', patterns: [/pytorch/i] },
    { skill: 'tensorflow', patterns: [/tensorflow/i] },
    { skill: 'kubernetes', patterns: [/kubernetes|k8s/i] },
    { skill: 'docker', patterns: [/docker/i] },
    { skill: 'sql', patterns: [/sql/i] },
    { skill: 'deep learning', patterns: [/deep\s*learning/i] },
  ];

  // Check for explicit level indicators
  const expertIndicators = /expert|senior|lead|\d+\+?\s*years|advanced/gi;
  const intermediateIndicators = /intermediate|some|basic|exposure|familiar/gi;
  const beginnerIndicators = /beginner|learning|introductory|basic\s*understanding/gi;

  for (const { skill, patterns } of levelPatterns) {
    for (const pattern of patterns) {
      const match = resumeText.match(pattern);
      if (match) {
        // Look for context around the match
        const contextStart = Math.max(0, match.index! - 50);
        const contextEnd = Math.min(resumeText.length, match.index! + 100);
        const context = resumeText.slice(contextStart, contextEnd);
        
        let level = 3; // Default intermediate
        if (expertIndicators.test(context)) level = 5;
        else if (intermediateIndicators.test(context)) level = 3;
        else if (beginnerIndicators.test(context)) level = 2;
        
        skillLevels.set(skill, level);
        break;
      }
    }
  }

  return skillLevels;
}
