import { useState } from 'react';
import { FileText, Upload, Sparkles, ArrowRight, Copy, Check, Key } from 'lucide-react';
import { SAMPLE_JD, SAMPLE_RESUME } from '../types';
import { isAIEnabled } from '../utils/groqApi';

interface UploadPageProps {
  onSubmit: (jd: string, resume: string) => void;
}

export function UploadPage({ onSubmit }: UploadPageProps) {
  const hasApiKey = isAIEnabled();
  const [jdText, setJdText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [activeTab, setActiveTab] = useState<'jd' | 'resume'>('jd');
  const [copied, setCopied] = useState<'jd' | 'resume' | null>(null);

  const handleSubmit = () => {
    if (jdText.trim() && resumeText.trim()) {
      onSubmit(jdText, resumeText);
    }
  };

  const loadSample = (type: 'jd' | 'resume') => {
    if (type === 'jd') {
      setJdText(SAMPLE_JD);
    } else {
      setResumeText(SAMPLE_RESUME);
    }
  };

  const copyToClipboard = async (text: string, type: 'jd' | 'resume') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const isValid = jdText.trim().length > 50 && resumeText.trim().length > 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SkillScout</h1>
              <p className="text-xs text-slate-400">AI-Powered Skill Assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {hasApiKey ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                AI Enabled (Llama 3)
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 text-slate-400 rounded-lg text-xs">
                <Key className="w-3 h-3" />
                Pattern Matching Mode
              </div>
            )}
            <div className="text-sm text-slate-400">
              Step 1 of 3: Input
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Assess Skills with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">AI Precision</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Paste a job description and resume to get an objective skill assessment, 
            identify gaps, and generate a personalized learning plan.
          </p>
        </div>

        {/* Input Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* JD Input */}
          <div className={`bg-slate-800/50 rounded-2xl border-2 transition-all ${
            activeTab === 'jd' ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : 'border-slate-700/50'
          }`}>
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Job Description</h3>
                  <p className="text-xs text-slate-400">Paste the complete JD</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(jdText, 'jd')}
                  className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
                  disabled={!jdText}
                >
                  {copied === 'jd' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => loadSample('jd')}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20 transition-colors"
                >
                  Load Sample
                </button>
              </div>
            </div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              onFocus={() => setActiveTab('jd')}
              placeholder="Paste the job description here...

Example:
Senior ML Engineer - Required: Python (Expert), PyTorch, Distributed Training. Preferred: Kubernetes, MLflow, Rust..."
              className="w-full h-80 p-4 bg-transparent text-slate-300 placeholder:text-slate-500 resize-none focus:outline-none"
            />
            <div className="px-4 pb-3 flex items-center justify-between text-xs">
              <span className={`${jdText.length > 50 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {jdText.length} characters
              </span>
              {jdText.length > 0 && jdText.length < 50 && (
                <span className="text-amber-400">Add more detail for better extraction</span>
              )}
            </div>
          </div>

          {/* Resume Input */}
          <div className={`bg-slate-800/50 rounded-2xl border-2 transition-all ${
            activeTab === 'resume' ? 'border-cyan-500/50 ring-2 ring-cyan-500/20' : 'border-slate-700/50'
          }`}>
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Resume / CV</h3>
                  <p className="text-xs text-slate-400">Candidate's background</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(resumeText, 'resume')}
                  className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
                  disabled={!resumeText}
                >
                  {copied === 'resume' ? <Check className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => loadSample('resume')}
                  className="px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-500/10 rounded-lg hover:bg-cyan-500/20 transition-colors"
                >
                  Load Sample
                </button>
              </div>
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              onFocus={() => setActiveTab('resume')}
              placeholder="Paste the resume here...

Example:
John Smith - ML Engineer
3 years Python development
Built BERT fine-tuning pipelines using PyTorch..."
              className="w-full h-80 p-4 bg-transparent text-slate-300 placeholder:text-slate-500 resize-none focus:outline-none"
            />
            <div className="px-4 pb-3 flex items-center justify-between text-xs">
              <span className={`${resumeText.length > 50 ? 'text-cyan-400' : 'text-slate-500'}`}>
                {resumeText.length} characters
              </span>
              {resumeText.length > 0 && resumeText.length < 50 && (
                <span className="text-amber-400">Add more detail for better analysis</span>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`group px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-3 transition-all ${
              isValid
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-105'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            Start Assessment
            <ArrowRight className={`w-5 h-5 transition-transform ${isValid ? 'group-hover:translate-x-1' : ''}`} />
          </button>
          
          {!isValid && (
            <p className="text-sm text-slate-500">
              Please add both a job description and resume (50+ characters each)
            </p>
          )}
        </div>

        {/* Features Preview */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Adaptive Assessment</h3>
            <p className="text-sm text-slate-400">
              AI asks follow-up questions based on your responses, probing deeper when answers are weak.
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl">🧬</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Skill DNA Fingerprint</h3>
            <p className="text-sm text-slate-400">
              Visual comparison of claimed vs. assessed proficiency in a unique, screenshot-worthy format.
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Fastest Path to Hired</h3>
            <p className="text-sm text-slate-400">
              Personalized learning plan prioritized by what you can learn fastest given your existing skills.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
