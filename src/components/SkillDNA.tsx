import { Skill } from '../types';

interface SkillDNAProps {
  skills: Skill[];
  showLabels?: boolean;
  animated?: boolean;
}

export function SkillDNA({ skills, showLabels = true, animated = true }: SkillDNAProps) {
  // Sort skills by weight (highest first) then by gap severity
  const sortedSkills = [...skills].sort((a, b) => {
    const gapA = a.gap_severity || 0;
    const gapB = b.gap_severity || 0;
    if (b.jd_weight !== a.jd_weight) return b.jd_weight - a.jd_weight;
    return gapB - gapA;
  });

  return (
    <div className="space-y-3">
      {sortedSkills.map((skill, index) => (
        <SkillBar 
          key={skill.name} 
          skill={skill} 
          showLabels={showLabels}
          delay={animated ? index * 100 : 0}
        />
      ))}
    </div>
  );
}

interface SkillBarProps {
  skill: Skill;
  showLabels: boolean;
  delay: number;
}

function SkillBar({ skill, showLabels, delay }: SkillBarProps) {
  const claimed = skill.claimed_level || 0;
  const assessed = skill.assessed_level || 0;
  const hasGap = assessed < claimed;
  const exceedsClaimed = assessed > claimed;
  
  // Color based on gap
  const getBarColor = () => {
    if (exceedsClaimed) return 'bg-emerald-500';
    if (hasGap) return 'bg-red-500';
    return 'bg-cyan-500';
  };

  // Weight badge color
  const getWeightBadge = () => {
    switch (skill.jd_weight) {
      case 3: return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 2: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getWeightLabel = () => {
    switch (skill.jd_weight) {
      case 3: return 'Required';
      case 2: return 'Preferred';
      default: return 'Bonus';
    }
  };

  return (
    <div 
      className="group"
      style={{ animationDelay: `${delay}ms` }}
    >
      {showLabels && (
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">{skill.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getWeightBadge()}`}>
              {getWeightLabel()}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">Claimed: {claimed}/5</span>
            <span className={`font-semibold ${
              hasGap ? 'text-red-400' : exceedsClaimed ? 'text-emerald-400' : 'text-cyan-400'
            }`}>
              Assessed: {assessed.toFixed(1)}/5
            </span>
          </div>
        </div>
      )}
      
      <div className="relative h-6 bg-slate-700/50 rounded-full overflow-hidden">
        {/* Claimed level (ghost bar) */}
        <div 
          className="absolute inset-y-0 left-0 bg-slate-600/50 rounded-full transition-all duration-700"
          style={{ 
            width: `${claimed * 20}%`,
            animationDelay: `${delay}ms`
          }}
        />
        
        {/* Assessed level (solid bar) */}
        <div 
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${getBarColor()}`}
          style={{ 
            width: `${assessed * 20}%`,
            animationDelay: `${delay + 200}ms`,
            opacity: 0.9
          }}
        />
        
        {/* Claimed marker line */}
        {claimed > 0 && (
          <div 
            className="absolute inset-y-0 w-0.5 bg-slate-300/50"
            style={{ left: `${claimed * 20}%` }}
          />
        )}

        {/* Gap indicator */}
        {hasGap && (
          <div 
            className="absolute inset-y-0 bg-red-500/20"
            style={{ 
              left: `${assessed * 20}%`,
              width: `${(claimed - assessed) * 20}%`
            }}
          />
        )}
      </div>

      {/* Hover tooltip */}
      {skill.gap_severity !== undefined && skill.gap_severity > 4 && (
        <div className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Critical gap — needs immediate attention
        </div>
      )}
    </div>
  );
}

// Compact version for summary displays
export function SkillDNAMini({ skills }: { skills: Skill[] }) {
  const sortedSkills = [...skills]
    .sort((a, b) => b.jd_weight - a.jd_weight)
    .slice(0, 6);

  return (
    <div className="flex gap-1">
      {sortedSkills.map((skill) => {
        const assessed = skill.assessed_level || 0;
        const claimed = skill.claimed_level || 0;
        const hasGap = assessed < claimed;
        
        return (
          <div 
            key={skill.name}
            className="flex flex-col items-center gap-1"
            title={`${skill.name}: ${assessed}/5`}
          >
            <div className="w-8 h-20 bg-slate-700/50 rounded-sm overflow-hidden relative flex flex-col-reverse">
              <div 
                className={`w-full transition-all duration-700 ${
                  hasGap ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ height: `${assessed * 20}%` }}
              />
              <div 
                className="absolute w-full border-t-2 border-dashed border-slate-400"
                style={{ bottom: `${claimed * 20}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500 truncate w-full text-center">
              {skill.name.slice(0, 4)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
