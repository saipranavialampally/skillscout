import { useState, useCallback } from 'react';
import { AppState, Skill } from './types';
import { UploadPage } from './components/UploadPage';
import { ChatInterface } from './components/ChatInterface';
import { Scorecard } from './components/Scorecard';
import { extractSkillsFromJD, extractSkillsFromResume, generateScorecard } from './utils/scorer';

const initialState: AppState = {
  phase: 'upload',
  jdText: '',
  resumeText: '',
  skills: [],
  currentSkillIndex: 0,
  currentAssessment: null,
  scorecard: null,
  assessments: new Map()
};

export default function App() {
  const [state, setState] = useState<AppState>(initialState);

  const handleUpload = useCallback((jd: string, resume: string) => {
    // Extract skills from JD
    const jdSkills = extractSkillsFromJD(jd);
    const resumeSkills = extractSkillsFromResume(resume);

    // Merge JD skills with resume claimed levels
    const skills: Skill[] = jdSkills.map(skill => ({
      name: skill.name!,
      jd_weight: skill.jd_weight!,
      claimed_level: resumeSkills.get(skill.name!.toLowerCase()) || 
                     (skill.jd_weight === 3 ? 3 : 2),
      assessed_level: undefined
    }));

    // Ensure we have at least some skills
    if (skills.length === 0) {
      skills.push(
        { name: 'Python', jd_weight: 3, claimed_level: 4 },
        { name: 'Machine Learning', jd_weight: 3, claimed_level: 3 },
        { name: 'Deep Learning', jd_weight: 2, claimed_level: 3 }
      );
    }

    setState({
      ...state,
      phase: 'assessing',
      jdText: jd,
      resumeText: resume,
      skills,
      currentSkillIndex: 0,
      assessments: new Map()
    });
  }, [state]);

  const handleSkillComplete = useCallback((assessedLevel: number) => {
    setState(prev => {
      const newSkills = [...prev.skills];
      newSkills[prev.currentSkillIndex] = {
        ...newSkills[prev.currentSkillIndex],
        assessed_level: assessedLevel
      };

      const nextIndex = prev.currentSkillIndex + 1;
      
      if (nextIndex >= newSkills.length) {
        const scorecard = generateScorecard(newSkills);
        return {
          ...prev,
          skills: newSkills,
          phase: 'report',
          scorecard
        };
      }

      return {
        ...prev,
        skills: newSkills,
        currentSkillIndex: nextIndex
      };
    });
  }, []);

  const handleSkipSkill = useCallback(() => {
    setState(prev => {
      const newSkills = [...prev.skills];
      newSkills[prev.currentSkillIndex] = {
        ...newSkills[prev.currentSkillIndex],
        assessed_level: newSkills[prev.currentSkillIndex].claimed_level
      };

      const nextIndex = prev.currentSkillIndex + 1;
      
      if (nextIndex >= newSkills.length) {
        const scorecard = generateScorecard(newSkills);
        return {
          ...prev,
          skills: newSkills,
          phase: 'report',
          scorecard
        };
      }

      return {
        ...prev,
        skills: newSkills,
        currentSkillIndex: nextIndex
      };
    });
  }, []);

  const handleRestart = useCallback(() => {
    setState(initialState);
  }, []);

  // Render based on phase
  if (state.phase === 'upload') {
    return <UploadPage onSubmit={handleUpload} />;
  }

  if (state.phase === 'assessing') {
    const currentSkill = state.skills[state.currentSkillIndex];
    const progress = ((state.currentSkillIndex) / state.skills.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          <ChatInterface
            skill={currentSkill}
            onComplete={handleSkillComplete}
            onSkip={handleSkipSkill}
            skillNumber={state.currentSkillIndex + 1}
            totalSkills={state.skills.length}
          />
        </div>

        {/* Skill queue indicator */}
        <div className="border-t border-slate-700/50 bg-slate-900/50 px-6 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs text-slate-500 flex-shrink-0">Skills:</span>
              {state.skills.map((skill, idx) => (
                <div
                  key={skill.name}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    idx < state.currentSkillIndex
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : idx === state.currentSkillIndex
                      ? 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/30'
                      : 'bg-slate-700/50 text-slate-500'
                  }`}
                >
                  {idx < state.currentSkillIndex && '✓ '}
                  {skill.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.phase === 'report' && state.scorecard) {
    return <Scorecard scorecard={state.scorecard} onRestart={handleRestart} />;
  }

  return <UploadPage onSubmit={handleUpload} />;
}
