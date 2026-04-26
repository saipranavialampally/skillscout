import { LearningPlanItem } from '../types';
import { ExternalLink, Clock, Calendar, Zap, ChevronRight } from 'lucide-react';

interface LearningPlanProps {
  plan: LearningPlanItem[];
  weeksToReady: number;
}

export function LearningPlan({ plan, weeksToReady }: LearningPlanProps) {
  if (plan.length === 0) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-semibold text-emerald-400 mb-2">No Gaps to Address!</h3>
        <p className="text-slate-400">Your skills align well with the job requirements.</p>
      </div>
    );
  }

  const totalHours = plan.reduce((sum, item) => sum + item.hours_est, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Total Study Time</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalHours} hrs</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Estimated Timeline</span>
          </div>
          <div className="text-2xl font-bold text-white">{weeksToReady} weeks</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs">Focus Areas</span>
          </div>
          <div className="text-2xl font-bold text-white">{plan.length}</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-700" />
        
        <div className="space-y-4">
          {plan.map((item, index) => (
            <PlanItem key={item.skill} item={item} index={index} />
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <div className="flex gap-3">
          <span className="text-xl">💡</span>
          <div>
            <h4 className="text-sm font-semibold text-amber-400 mb-1">Pro Tip</h4>
            <p className="text-xs text-slate-400">
              Skills are ordered by learnability — we prioritized what you can learn fastest 
              given your existing expertise. Completing item 1 makes item 2 easier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlanItemProps {
  item: LearningPlanItem;
  index: number;
}

function PlanItem({ item, index }: PlanItemProps) {
  const priorityColors = {
    1: 'from-red-500 to-orange-500',
    2: 'from-amber-500 to-yellow-500',
    3: 'from-cyan-500 to-blue-500'
  };

  return (
    <div className="relative flex gap-4">
      {/* Timeline node */}
      <div className="relative z-10 flex-shrink-0">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${priorityColors[item.priority]} flex items-center justify-center text-white font-bold shadow-lg`}>
          {index + 1}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-500">{item.weeks}</span>
                <span className="text-xs text-slate-600">•</span>
                <span className="text-xs text-cyan-400">{item.hours_est} hours</span>
              </div>
              <h3 className="text-lg font-semibold text-white">{item.skill}</h3>
            </div>
            <a 
              href={item.resource_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Start Learning
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 rounded-lg">
              <span className="text-sm">📚</span>
              <span className="text-xs text-slate-300">{item.resource}</span>
            </div>
          </div>

          <p className="text-sm text-slate-400 flex items-start gap-2">
            <ChevronRight className="w-4 h-4 flex-shrink-0 text-emerald-500 mt-0.5" />
            {item.why_first}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="h-1 bg-slate-700">
          <div 
            className={`h-full bg-gradient-to-r ${priorityColors[item.priority]} w-0`}
            style={{ 
              animation: 'progressFill 2s ease-out forwards',
              animationDelay: `${index * 300}ms`
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Compact plan for the scorecard view
export function LearningPlanSummary({ plan, weeksToReady }: LearningPlanProps) {
  const totalHours = plan.reduce((sum, item) => sum + item.hours_est, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-slate-400">
          {plan.length} skills to learn
        </span>
        <span className="text-slate-300 font-medium">
          {totalHours} hrs / {weeksToReady} weeks
        </span>
      </div>

      {plan.slice(0, 3).map((item, index) => (
        <div 
          key={item.skill}
          className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg"
        >
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${
            item.priority === 1 ? 'from-red-500 to-orange-500' :
            item.priority === 2 ? 'from-amber-500 to-yellow-500' :
            'from-cyan-500 to-blue-500'
          } flex items-center justify-center text-white text-sm font-bold`}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{item.skill}</div>
            <div className="text-xs text-slate-500">{item.weeks} • {item.hours_est} hrs</div>
          </div>
          <div className="text-xs text-slate-500">
            +{Math.round((1 / (item.hours_est / 20)) * 100)}% ready
          </div>
        </div>
      ))}

      {plan.length > 3 && (
        <div className="text-center text-xs text-slate-500 pt-2">
          +{plan.length - 3} more skills in full plan
        </div>
      )}
    </div>
  );
}
