import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ChevronRight, AlertTriangle, Shield, Eye, EyeOff, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Skill, AssessmentMessage } from '../types';
import { generateQuestion, analyzeResponse, generateAssessmentSummary } from '../utils/mockAgent';
import { generateQuestionAI, analyzeResponseAI, getGroqApiKey } from '../utils/groqApi';

interface ChatInterfaceProps {
  skill: Skill;
  onComplete: (assessedLevel: number) => void;
  onSkip: () => void;
  skillNumber: number;
  totalSkills: number;
}

interface ViolationLog {
  type: 'paste' | 'tab_switch' | 'copy' | 'suspicious_speed';
  timestamp: number;
  details: string;
}

export function ChatInterface({ 
  skill, 
  onComplete, 
  onSkip,
  skillNumber,
  totalSkills 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<AssessmentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [turn, setTurn] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [currentScore, setCurrentScore] = useState(skill.claimed_level);
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [violations, setViolations] = useState<ViolationLog[]>([]);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isBeingWatched, setIsBeingWatched] = useState(true);
  const [typingMetrics, setTypingMetrics] = useState({ wpm: 0, naturalness: 100 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [lieDetectorLevel, setLieDetectorLevel] = useState(50);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingStartTime = useRef<number>(0);
  const keystrokeTimes = useRef<number[]>([]);
  
  // Check if AI is enabled
  const useAI = !!getGroqApiKey();

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBeingWatched(false);
        setTabSwitches(prev => prev + 1);
        setViolations(prev => [...prev, {
          type: 'tab_switch',
          timestamp: Date.now(),
          details: 'User left the assessment tab'
        }]);
        setShowWarning('⚠️ Tab switch detected! This has been logged.');
        playWarningSound();
        setTimeout(() => setShowWarning(null), 4000);
      } else {
        setIsBeingWatched(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Window blur detection
  useEffect(() => {
    const handleBlur = () => {
      setIsBeingWatched(false);
      setViolations(prev => [...prev, {
        type: 'tab_switch',
        timestamp: Date.now(),
        details: 'Window lost focus'
      }]);
    };

    const handleFocus = () => setIsBeingWatched(true);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Copy detection
  useEffect(() => {
    const handleCopy = (_e: ClipboardEvent) => {
      const selectedText = window.getSelection()?.toString();
      if (selectedText && selectedText.length > 10) {
        setViolations(prev => [...prev, {
          type: 'copy',
          timestamp: Date.now(),
          details: `Copied ${selectedText.length} characters`
        }]);
      }
    };

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, []);

  // Play sounds
  const playWarningSound = () => {
    if (!soundEnabled) return;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (_e) { /* Audio not supported */ }
  };

  const playSuccessSound = () => {
    if (!soundEnabled) return;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.2, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.2);
        }, i * 100);
      });
    } catch (_e) { /* Audio not supported */ }
  };

  // Start with initial question
  useEffect(() => {
    const askFirstQuestion = async () => {
      setIsTyping(true);
      try {
        let question: string;
        if (useAI) {
          question = await generateQuestionAI(skill.name, 0, skill.claimed_level, []);
        } else {
          question = generateQuestion(skill.name, 0, []);
        }
        addAgentMessage(question);
      } catch (error) {
        console.error('Failed to generate question:', error);
        addAgentMessage(generateQuestion(skill.name, 0, []));
      }
    };
    
    const timer = setTimeout(askFirstQuestion, 800);
    return () => clearTimeout(timer);
  }, [skill.name]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addAgentMessage = (content: string) => {
    setIsTyping(true);
    // Simulate slight delay for natural feel
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'agent',
        content,
        timestamp: Date.now()
      }]);
      setIsTyping(false);
    }, 600 + Math.random() * 400);
  };

  // Analyze typing pattern
  const analyzeTypingPattern = (_text: string): number => {
    if (keystrokeTimes.current.length < 5) return 50;
    
    const intervals: number[] = [];
    for (let i = 1; i < keystrokeTimes.current.length; i++) {
      intervals.push(keystrokeTimes.current[i] - keystrokeTimes.current[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.min(100, stdDev * 2);
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const wordCount = pastedText.trim().split(/\s+/).length;
    
    setViolations(prev => [...prev, {
      type: 'paste',
      timestamp: Date.now(),
      details: `Pasted ${wordCount} words`
    }]);
    
    setShowWarning('🚫 Paste blocked! Please type your answer.');
    playWarningSound();
    setTimeout(() => setShowWarning(null), 3000);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    
    const now = Date.now();
    keystrokeTimes.current.push(now);
    
    if (keystrokeTimes.current.length > 20) {
      keystrokeTimes.current.shift();
    }
    
    if (typingStartTime.current === 0 && newValue.length > 0) {
      typingStartTime.current = now;
    }
    
    const elapsedMinutes = (now - typingStartTime.current) / 60000;
    const words = newValue.trim().split(/\s+/).length;
    const wpm = elapsedMinutes > 0.1 ? Math.round(words / elapsedMinutes) : 0;
    
    const naturalness = analyzeTypingPattern(newValue);
    setTypingMetrics({ wpm, naturalness });
    
    // Update lie detector
    setLieDetectorLevel(prev => {
      if (wpm > 100) return Math.max(0, prev - 5);
      if (naturalness > 60 && wpm < 80) return Math.min(100, prev + 1);
      return prev;
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const answerText = input.trim();
    keystrokeTimes.current = [];
    typingStartTime.current = 0;

    const userMessage: AssessmentMessage = {
      role: 'candidate',
      content: answerText,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Calculate integrity penalty
    const pasteCount = violations.filter(v => v.type === 'paste').length;
    const tabSwitchPenalty = Math.min(1, tabSwitches * 0.3);
    const pastePenalty = pasteCount * 0.5;
    const integrityPenalty = tabSwitchPenalty + pastePenalty;

    // Analyze response
    setIsTyping(true);
    
    try {
      let analysis: { score: number; shouldContinue: boolean; confidence: number; rationale: string };
      
      if (useAI) {
        const aiResult = await analyzeResponseAI(
          skill.name,
          answerText,
          skill.claimed_level,
          turn,
          [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        );
        analysis = aiResult;
        setAiRationale(aiResult.rationale);
      } else {
        const regexResult = analyzeResponse(skill.name, answerText, turn, integrityPenalty);
        analysis = { ...regexResult, rationale: 'Pattern-based analysis' };
      }

      // Apply integrity penalty to AI score
      const adjustedScore = Math.max(1, analysis.score - integrityPenalty);
      
      setCurrentScore(adjustedScore);
      setConfidence(analysis.confidence);
      setLieDetectorLevel(adjustedScore >= 3 ? 75 : adjustedScore >= 2 ? 40 : 20);

      if (analysis.shouldContinue && turn < 2) {
        // Ask follow-up
        setTimeout(async () => {
          try {
            let followUp: string;
            if (useAI) {
              followUp = await generateQuestionAI(
                skill.name,
                turn + 1,
                skill.claimed_level,
                [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
              );
            } else {
              followUp = generateQuestion(skill.name, turn + 1, [...messages, userMessage]);
            }
            addAgentMessage(followUp);
            setTurn(prev => prev + 1);
          } catch (error) {
            addAgentMessage(generateQuestion(skill.name, turn + 1, [...messages, userMessage]));
            setTurn(prev => prev + 1);
          }
        }, 500);
      } else {
        // Assessment complete
        setTimeout(() => {
          const summary = generateAssessmentSummary(skill.name, [...messages, userMessage], adjustedScore, integrityPenalty);
          addAgentMessage(summary);
          
          if (adjustedScore >= 4) {
            setShowConfetti(true);
            playSuccessSound();
            setTimeout(() => setShowConfetti(false), 3000);
          }
          
          setTimeout(() => {
            onComplete(adjustedScore);
          }, 2500);
        }, 800);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback to regex
      const regexResult = analyzeResponse(skill.name, answerText, turn, integrityPenalty);
      setCurrentScore(regexResult.score - integrityPenalty);
      setConfidence(regexResult.confidence);
      
      if (regexResult.shouldContinue && turn < 2) {
        const followUp = generateQuestion(skill.name, turn + 1, [...messages, userMessage]);
        addAgentMessage(followUp);
        setTurn(prev => prev + 1);
      } else {
        const summary = generateAssessmentSummary(skill.name, [...messages, userMessage], regexResult.score - integrityPenalty, integrityPenalty);
        addAgentMessage(summary);
        setTimeout(() => onComplete(regexResult.score - integrityPenalty), 2500);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Components
  const LieDetector = () => (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-700" />
          <circle
            cx="48" cy="48" r="40"
            stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"
            className={`transition-all duration-500 ${
              lieDetectorLevel >= 70 ? 'text-emerald-500' :
              lieDetectorLevel >= 40 ? 'text-amber-500' : 'text-red-500'
            }`}
            style={{
              strokeDasharray: `${2 * Math.PI * 40}`,
              strokeDashoffset: `${2 * Math.PI * 40 * (1 - lieDetectorLevel / 100)}`
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white">{lieDetectorLevel}%</span>
          <span className="text-[9px] text-slate-400">Trust</span>
        </div>
      </div>
      <span className="text-xs text-slate-500 mt-1">
        {useAI ? 'AI Confidence' : 'Pattern Match'}
      </span>
    </div>
  );

  const TypingStats = () => (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-slate-500">Speed:</span>
        <span className={`font-medium ${
          typingMetrics.wpm > 100 ? 'text-red-400' : 
          typingMetrics.wpm > 60 ? 'text-amber-400' : 'text-emerald-400'
        }`}>
          {typingMetrics.wpm} WPM
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-slate-500">Natural:</span>
        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              typingMetrics.naturalness > 60 ? 'bg-emerald-500' : 
              typingMetrics.naturalness > 30 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${typingMetrics.naturalness}%` }}
          />
        </div>
      </div>
    </div>
  );

  const ViolationBadge = () => (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
      violations.length === 0 ? 'bg-emerald-500/20 text-emerald-400' :
      violations.length <= 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
    }`}>
      <Shield className="w-4 h-4" />
      <span className="text-xs font-medium">
        {violations.length === 0 ? 'Clean' : `${violations.length} flag${violations.length > 1 ? 's' : ''}`}
      </span>
    </div>
  );

  // Confetti
  const Confetti = () => {
    if (!showConfetti) return null;
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-20px',
              backgroundColor: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b'][Math.floor(Math.random() * 4)],
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
              animation: `fall ${1 + Math.random() * 2}s ease-out forwards`,
              animationDelay: `${Math.random() * 0.5}s`
            }}
          />
        ))}
        <style>{`
          @keyframes fall {
            to { transform: translateY(100vh) rotate(${Math.random() * 360}deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      <Confetti />
      
      {/* Warning Banner */}
      {showWarning && (
        <div className="bg-red-500/20 border-b border-red-500/30 px-6 py-3 flex items-center gap-3 animate-pulse z-40">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300 font-medium flex-1">{showWarning}</p>
          <button onClick={() => setShowWarning(null)} className="text-red-400 hover:text-red-300 text-xl">×</button>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Skill {skillNumber} of {totalSkills}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  skill.jd_weight === 3 ? 'bg-red-500/20 text-red-400' :
                  skill.jd_weight === 2 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {skill.jd_weight === 3 ? 'Required' : skill.jd_weight === 2 ? 'Preferred' : 'Bonus'}
                </span>
                {useAI && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">{skill.name}</h2>
            </div>
            <LieDetector />
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              isBeingWatched ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isBeingWatched ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-xs font-medium">{isBeingWatched ? 'Watching' : 'Tab Switched!'}</span>
            </div>

            <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50">
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <ViolationBadge />
            
            <button onClick={onSkip} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
              Skip <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Live metrics bar */}
        <div className="flex items-center justify-between py-3 px-4 bg-slate-900/50 rounded-xl">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Resume claims:</span>
              <span className="text-white font-semibold">{skill.claimed_level}/5</span>
              <span className="text-slate-600">→</span>
              <span className="text-slate-400">Assessed:</span>
              <span className={`font-bold text-lg ${
                currentScore < skill.claimed_level ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {currentScore.toFixed(1)}/5
              </span>
              {violations.length > 0 && (
                <span className="text-red-400 text-xs">(-{(violations.length * 0.5).toFixed(1)})</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Confidence:</span>
              <div className="w-28 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    confidence > 0.7 ? 'bg-emerald-500' : confidence > 0.4 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{Math.round(confidence * 100)}%</span>
            </div>
          </div>

          <TypingStats />
        </div>

        {tabSwitches > 0 && (
          <div className="mt-2 text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />
            {tabSwitches} tab switch{tabSwitches > 1 ? 'es' : ''} detected
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={`flex gap-3 ${msg.role === 'candidate' ? 'flex-row-reverse' : ''}`}
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              msg.role === 'agent' 
                ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400' 
                : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400'
            }`}>
              {msg.role === 'agent' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div className={`max-w-[75%] ${
              msg.role === 'agent' 
                ? 'bg-slate-700/50 rounded-2xl rounded-tl-md' 
                : 'bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-2xl rounded-tr-md'
            } px-5 py-4 shadow-lg`}>
              <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="bg-slate-700/50 rounded-2xl rounded-tl-md px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span className="text-sm text-slate-400">
                  {useAI ? 'AI is analyzing your response...' : 'Analyzing...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* AI Rationale (optional debug/feedback) */}
        {aiRationale && !isTyping && messages.length > 1 && (
          <div className="flex justify-center">
            <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
              💡 {aiRationale}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        {turn === 0 && messages.length <= 1 && (
          <div className="mb-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-sm text-amber-200 font-medium mb-1">How to score well:</p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• <strong className="text-slate-300">Be specific:</strong> "I'd check gradient norms and learning rate" beats "I'd check things"</li>
                  <li>• <strong className="text-slate-300">Use technical terms:</strong> Mention algorithms, tools, and concepts you know</li>
                  <li>• <strong className="text-slate-300">Give examples:</strong> "When I debugged X, I used Y approach"</li>
                  <li>• <strong className="text-slate-300">Be honest:</strong> "I don't know" is better than guessing wrong</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Type your answer in your own words..."
              rows={3}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 resize-none transition-all"
              disabled={isTyping}
            />
            <div className="absolute bottom-2 right-3 text-xs text-slate-500">{input.length} chars</div>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`px-6 rounded-xl transition-all flex items-center justify-center gap-2 font-medium ${
              input.trim() && !isTyping
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-105'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
            <span>Send</span>
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <span>Press Enter to send</span>
            <span className="text-slate-600">•</span>
            <span>Paste is blocked</span>
            <span className="text-slate-600">•</span>
            <span className={isBeingWatched ? 'text-emerald-500' : 'text-red-500'}>
              {isBeingWatched ? '✓ Proctoring active' : '⚠ Tab switch'}
            </span>
          </p>
          
          {violations.length > 0 && (
            <p className="text-xs text-amber-400 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {violations.length} violation{violations.length > 1 ? 's' : ''} logged
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
