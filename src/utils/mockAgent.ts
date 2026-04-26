import { AssessmentMessage } from '../types';

interface QuestionBank {
  [skill: string]: {
    questions: Array<{ q: string; followUps: string[] }>;
    weakIndicator: RegExp;
    strongIndicator: RegExp;
    dontKnowIndicator: RegExp;
  };
}

// Additional randomized question variations to prevent Googling
const questionVariations: Record<string, string[]> = {
  'PyTorch': [
    "Your model outputs NaN after 100 batches. What's your debugging strategy?",
    "Explain when you'd use torch.no_grad() vs requires_grad_(False).",
    "How would you convert a PyTorch model to run on mobile devices?",
    "A custom autograd function isn't backpropagating correctly. How do you debug it?",
  ],
  'Python': [
    "Explain how Python's garbage collector works. When would it cause issues?",
    "What's the difference between @staticmethod and @classmethod?",
    "How would you profile a slow Python script and optimize it?",
    "Explain metaclasses and when you'd use them.",
  ],
  'Kubernetes': [
    "A pod is stuck in CrashLoopBackOff. Walk me through debugging.",
    "Explain the difference between ClusterIP, NodePort, and LoadBalancer services.",
    "How do you handle rolling back a bad deployment?",
    "What's a pod disruption budget and when would you use it?",
  ],
  'Distributed Training': [
    "How does gradient averaging work across multiple GPUs?",
    "What's the difference between synchronous and asynchronous training?",
    "Explain the parameter server architecture.",
    "How do you handle stragglers in distributed training?",
  ],
  'Machine Learning': [
    "Your model has high variance. What techniques would you try?",
    "Explain the bias-variance tradeoff with a concrete example.",
    "When would you use AUC-ROC vs precision-recall curves?",
    "How do you handle data leakage in time series problems?",
  ],
  'Deep Learning': [
    "Explain why ResNets can be trained deeper than plain networks.",
    "What's the purpose of dropout and when shouldn't you use it?",
    "Compare Adam optimizer to SGD with momentum.",
    "How do you handle exploding gradients in RNNs?",
  ],
  'Docker': [
    "What's the difference between ADD and COPY in a Dockerfile?",
    "How do you share data between containers?",
    "Explain Docker networking modes.",
    "What are Docker build stages and why use them?",
  ],
};

const questionBank: QuestionBank = {
  'Python': {
    questions: [
      {
        q: "Explain the difference between a list comprehension and a generator expression. When would you choose one over the other?",
        followUps: [
          "Interesting. How does Python's GIL affect multithreaded programs? How would you work around it for CPU-bound tasks?",
          "Can you explain descriptor protocol and how properties work under the hood?"
        ]
      }
    ],
    weakIndicator: /i think|maybe|not sure|probably|i guess|kind of|sort of/i,
    strongIndicator: /generator|lazy|evaluation|memory|efficient|with\s+statement|__enter__|__exit__|descriptor|__get__|__set__|bytecode/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*used|unsure|honestly|idk|i\s*haven'?t/i
  },
  'PyTorch': {
    questions: [
      {
        q: "A model's loss plateaus after epoch 3. Walk me through your debugging process — what would you check and in what order?",
        followUps: [
          "Good. Now if you suspected dying ReLUs in deeper layers, how would you diagnose and fix this?",
          "How would you implement gradient accumulation when you can't fit a full batch in memory?"
        ]
      }
    ],
    weakIndicator: /check|look at|maybe|try|google/i,
    strongIndicator: /gradient|learning.?rate|scheduler|activation|batch.?norm|weight.?init|vanish|explod|clip|nan|inf|tensorboard/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*used|unsure|honestly|idk|never\s*debugged/i
  },
  'Kubernetes': {
    questions: [
      {
        q: "What's the difference between a Deployment and a StatefulSet? Give me a real-world example of when you'd use each.",
        followUps: [
          "A pod keeps getting OOMKilled. Walk me through how you'd troubleshoot and fix this.",
          "How do you handle secrets across different environments (dev/staging/prod)?"
        ]
      }
    ],
    weakIndicator: /deploy|run|container|pod|not\s*sure/i,
    strongIndicator: /persistent|volume|ordered|scaling|replicas|rolling.?update|canary|helm|etcd|controller/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*used|unsure|only\s*heard/i
  },
  'Distributed Training': {
    questions: [
      {
        q: "Explain data parallelism vs model parallelism. When would you use each, and what are the tradeoffs?",
        followUps: [
          "How does gradient synchronization work in distributed training? What's AllReduce?",
          "A training job fails randomly on 4 GPUs but works on 1. What could be wrong?"
        ]
      }
    ],
    weakIndicator: /split|divide|multiple|gpus|parallel|not\s*sure/i,
    strongIndicator: /allreduce|ring|pipeline|shard|communication|bottleneck|sync|async|nccl|horovod|ddp/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*used|unsure|only\s*basic|never\s*done/i
  },
  'Rust': {
    questions: [
      {
        q: "Explain Rust's ownership model. Why does it exist and what problem does it solve?",
        followUps: [
          "What's the difference between &T and &mut T? What rules enforce memory safety here?",
          "How does error handling in Rust compare to exceptions in other languages?"
        ]
      }
    ],
    weakIndicator: /memory|safe|borrow|check|heard/i,
    strongIndicator: /lifetime|move|copy|trait|enum|result|option|zero.?cost|borrow.?checker|stack|heap/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*used|unsure|only\s*read|never\s*wrote/i
  },
  'MLflow': {
    questions: [
      {
        q: "How would you set up experiment tracking for a team of 5 ML engineers? Walk me through your approach.",
        followUps: [
          "How do you handle model versioning and promote models from staging to production?",
          "What's your approach to ensuring reproducibility across different machines?"
        ]
      }
    ],
    weakIndicator: /track|log|save|record|not\s*sure/i,
    strongIndicator: /artifact|registry|stage|promote|model.?version|experiment.?id|tags|uri|tracking.?server/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*used|unsure|only\s*basic/i
  },
  'Docker': {
    questions: [
      {
        q: "What's the difference between CMD and ENTRYPOINT in a Dockerfile? When would you use each?",
        followUps: [
          "How would you optimize a Docker image for a Python ML application that's currently 2GB?",
          "Explain multi-stage builds and when they're useful."
        ]
      }
    ],
    weakIndicator: /run|start|command|execute|not\s*sure/i,
    strongIndicator: /layer|cache|exec.?form|shell.?form|dockerfile|stage|build|alpine|slim|compose/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*used|unsure|only\s*used\s*basic/i
  },
  'Deep Learning': {
    questions: [
      {
        q: "Explain the vanishing gradient problem. Why does it happen and how do modern architectures address it?",
        followUps: [
          "How does batch normalization help training? What happens during inference?",
          "What's your understanding of attention mechanisms? Why are they so effective?"
        ]
      }
    ],
    weakIndicator: /gradient|problem|hard|train|not\s*sure/i,
    strongIndicator: /residual|skip.?connection|relu|batchnorm|layernorm|transformer|chain.?rule|backprop|sigmoid/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*studied|unsure|only\s*used\s*libraries/i
  },
  'Machine Learning': {
    questions: [
      {
        q: "You have a dataset with 95% class imbalance for fraud detection. How would you approach this problem?",
        followUps: [
          "What metrics would you use instead of accuracy? Why?",
          "How do you decide between oversampling, undersampling, and adjusting class weights?"
        ]
      }
    ],
    weakIndicator: /balance|equal|sample|more|less|not\s*sure/i,
    strongIndicator: /smote|f1|precision|recall|auc|roc|stratif|class.?weight|cost.?sensitive|threshold|pr.?curve/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*dealt|unsure|only\s*balanced/i
  },
  'NLP': {
    questions: [
      {
        q: "Compare BERT and GPT architectures. When would you choose one over the other for a real project?",
        followUps: [
          "How would you fine-tune a transformer model for a domain-specific task with limited data?",
          "What's your approach to handling documents that exceed the model's token limit?"
        ]
      }
    ],
    weakIndicator: /text|language|understand|generat|not\s*sure/i,
    strongIndicator: /bidirectional|autoregressive|encoder|decoder|tokeniz|embed|attention|masked|causal|prefix/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*used|unsure|only\s*called\s*api/i
  },
  'SQL': {
    questions: [
      {
        q: "Write a query to find customers who have never placed an order. Explain your approach.",
        followUps: [
          "A query is running slow on a 10M row table. How would you optimize it?",
          "What's your indexing strategy? How do you decide what to index?"
        ]
      }
    ],
    weakIndicator: /join|table|combine|match|not\s*sure/i,
    strongIndicator: /left.?join|where.*is\s*null|not\s*exists|explain|index|scan|subquery|cte|window|partition/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|only\s*simple|unsure|never\s*complex/i
  },
  'Computer Vision': {
    questions: [
      {
        q: "Explain how CNNs extract features from images. Why are convolutions effective for vision tasks?",
        followUps: [
          "You have only 500 labeled images for classification. How would you approach this?",
          "What data augmentation techniques have you found most effective and why?"
        ]
      }
    ],
    weakIndicator: /image|picture|detect|recogni[zs]e|not\s*sure/i,
    strongIndicator: /filter|kernel|stride|pooling|receptive.?field|translation.?invariant|augment|transfer.?learning/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*used|unsure|only\s*used\s*pretrained/i
  },
  'AWS': {
    questions: [
      {
        q: "Design a serverless ML inference pipeline on AWS. What services would you use and how would they connect?",
        followUps: [
          "How do you update a deployed model without downtime?",
          "How would you optimize costs for an inference endpoint that has variable traffic?"
        ]
      }
    ],
    weakIndicator: /cloud|deploy|server|amazon|not\s*sure/i,
    strongIndicator: /lambda|sagemaker|api.?gateway|step.?function|ecs|fargate|endpoint|autoscaling|cloudformation/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*used|unsure|only\s*basic\s*services/i
  },
  'CUDA': {
    questions: [
      {
        q: "Explain the CUDA execution model. What are thread blocks, warps, and grids?",
        followUps: [
          "How do you optimize memory access patterns in CUDA kernels?",
          "What is coalesced memory access and why does it matter for performance?"
        ]
      }
    ],
    weakIndicator: /gpu|parallel|fast|compute|not\s*sure/i,
    strongIndicator: /kernel|block|grid|shared.?memory|global.?memory|warp|occupancy|coalesc|register/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*used|unsure|only\s*used\s*pytorch/i
  },
  'Transformers': {
    questions: [
      {
        q: "Explain self-attention in detail. Why is it O(n²) and what are ways to reduce this complexity?",
        followUps: [
          "What's the role of positional encoding? What happens without it?",
          "Why use multi-head attention instead of single-head? What does each head learn?"
        ]
      }
    ],
    weakIndicator: /attention|focus|weight|token|not\s*sure/i,
    strongIndicator: /query|key|value|softmax|scaled|linear|projection|heads|sparse|flash.?attention|rotary/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*implemented|unsure|only\s*used/i
  },
  'Scikit-learn': {
    questions: [
      {
        q: "Build a complete ML pipeline: preprocessing, feature selection, and model training. How would you structure this?",
        followUps: [
          "How do you approach hyperparameter tuning? Compare grid search vs random search vs Bayesian optimization.",
          "How would you handle cross-validation with time series data?"
        ]
      }
    ],
    weakIndicator: /train|fit|model|predict|not\s*sure/i,
    strongIndicator: /pipeline|column.?transformer|grid.?search|cross.?val|stratif|bayesian|optuna/i,
    dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|only\s*basic|unsure|never\s*used\s*pipeline/i
  }
};

// Default questions for skills not in the bank
const defaultQuestions = {
  questions: [
    {
      q: "Describe a challenging project where you used this technology. What was difficult and how did you solve it?",
      followUps: [
        "What's a common pitfall with this technology that beginners often miss?",
        "How do you stay updated with best practices? What resources do you use?"
      ]
    }
  ],
  weakIndicator: /used|work|project|learn|not\s*sure/i,
  strongIndicator: /specific|example|challenge|optimize|best.?practice|production|debug|perf/i,
  dontKnowIndicator: /don'?t\s*know|no\s*idea|not\s*familiar|never\s*used|unsure|only\s*heard/i
};

/**
 * Generate a question for a skill assessment
 * Uses randomization to prevent Googling exact answers
 */
export function generateQuestion(
  skill: string,
  turn: number,
  previousMessages: AssessmentMessage[]
): string {
  const bank = questionBank[skill] || defaultQuestions;
  const questionSet = bank.questions[0];
  
  // Get variations for this skill
  const variations = questionVariations[skill] || [];
  
  if (turn === 0 || previousMessages.length === 0) {
    // Randomly choose between main question and variations
    if (variations.length > 0 && Math.random() > 0.5) {
      return variations[Math.floor(Math.random() * variations.length)];
    }
    return questionSet.q;
  }
  
  // For follow-ups, sometimes use variations
  if (variations.length > turn && Math.random() > 0.6) {
    return variations[turn];
  }
  
  const followUpIndex = Math.min(turn - 1, questionSet.followUps.length - 1);
  return questionSet.followUps[followUpIndex];
}

/**
 * Analyze a candidate's response and determine if we should probe deeper
 * Now with integrity penalty support
 */
export function analyzeResponse(
  skill: string,
  response: string,
  turn: number,
  integrityPenalty: number = 0
): { score: number; shouldContinue: boolean; confidence: number } {
  const bank = questionBank[skill] || defaultQuestions;
  
  // Check for "I don't know" patterns first
  const isDontKnow = bank.dontKnowIndicator.test(response);
  const isWeak = bank.weakIndicator.test(response);
  const isStrong = bank.strongIndicator.test(response);
  
  let score: number;
  let confidence: number;
  
  // STRONG NEGATIVE: "I don't know" responses
  if (isDontKnow) {
    score = 1 + Math.random() * 0.5; // 1-1.5
    confidence = 0.9; // Very confident they don't know
    return { 
      score: Math.max(1, score - integrityPenalty), 
      shouldContinue: turn < 1, // Maybe give one more chance
      confidence 
    };
  }
  
  // Check for AI-generated responses (too polished, contains markdown, etc.)
  const looksAIGenerated = 
    /^(certainly|sure|of course|here's|let me explain|i'd be happy)/i.test(response) ||
    /\*\*.*\*\*/.test(response) || // Markdown bold
    response.includes('```') || // Code blocks
    response.split('\n').length > 8; // Too structured
  
  if (looksAIGenerated) {
    score = 2; // Suspicious but not 0
    confidence = 0.4; // Low confidence - might be legit or might be copied
    return { 
      score: Math.max(1, score - integrityPenalty - 1), 
      shouldContinue: true, // Probe more
      confidence 
    };
  }
  
  // Base scoring based on technical content
  if (isStrong && !isWeak) {
    // Strong technical answer
    score = 4 + Math.random() * 0.5; // 4-4.5
    confidence = 0.85;
  } else if (isStrong && isWeak) {
    // Mixed - some good points but uncertain
    score = 3 + Math.random() * 0.5; // 3-3.5
    confidence = 0.65;
  } else if (isWeak && !isStrong) {
    // Weak answer - vague, uncertain
    score = 2 + Math.random() * 0.5; // 2-2.5
    confidence = 0.7;
  } else {
    // Neutral answer - no strong indicators either way
    score = 2.5 + Math.random() * 0.5; // 2.5-3
    confidence = 0.5;
  }
  
  // Length-based adjustment (but don't reward padding)
  const wordCount = response.split(/\s+/).length;
  if (wordCount < 15) {
    score -= 0.5; // Too brief
  } else if (wordCount > 200 && !isStrong) {
    score -= 0.3; // Long but not substantive
  }
  
  // Technical term density bonus
  const technicalTerms = response.match(/\b(algorithm|implementation|architecture|performance|optimization|trade-off|scalab|latency|throughput|efficient|memory|concurrent|parallel|async|sync|cache|pipeline|component|abstraction|interface|protocol)\b/gi);
  if (technicalTerms && technicalTerms.length >= 2) {
    score += 0.3;
  }
  
  // Apply integrity penalty
  score = Math.max(1, Math.min(5, score - integrityPenalty));
  
  // Decide if we should continue
  const shouldContinue = turn < 2 && (confidence < 0.8 || score < 3);
  
  return { score, shouldContinue, confidence };
}

/**
 * Generate a final assessment summary with honesty about weaknesses
 */
export function generateAssessmentSummary(
  skill: string,
  messages: AssessmentMessage[],
  finalScore: number,
  integrityPenalty: number = 0
): string {
  const level = Math.round(finalScore);
  const allText = messages.map(m => m.content).join(' ').toLowerCase();
  
  // Check if they admitted not knowing
  const admittedLack = /don'?t\s*know|not\s*familiar|never\s*used|no\s*experience/i.test(allText);
  
  // Integrity warning if pastes were detected
  const integrityWarning = integrityPenalty > 0 
    ? `\n⚠️ Note: ${Math.round(integrityPenalty * 2)} paste(s) detected during assessment. Score adjusted for authenticity.`
    : '';
  
  if (admittedLack && level <= 2) {
    return `I appreciate your honesty about ${skill}. Based on your responses, you appear to be at a beginner level (Level ${level}/5). This is valuable information — knowing where you stand is the first step to improvement. We'll include this in your learning plan.${integrityWarning}`;
  }
  
  const rationales: Record<number, string[]> = {
    5: [
      `Excellent demonstration of ${skill} expertise. You showed deep understanding of advanced concepts and could articulate nuanced tradeoffs. Score: ${level}/5.`,
      `Expert-level ${skill} knowledge confirmed. Your explanations of technical details suggest hands-on experience with complex implementations. Score: ${level}/5.`
    ],
    4: [
      `Strong working knowledge of ${skill}. You understand core concepts well and have practical experience to draw from. Score: ${level}/5.`,
      `Solid ${skill} skills demonstrated. You could explain key concepts and handle most real-world scenarios. Score: ${level}/5.`
    ],
    3: [
      `Intermediate understanding of ${skill}. You know the fundamentals but could benefit from deeper exploration of advanced topics. Score: ${level}/5.`,
      `Basic-to-intermediate ${skill} knowledge. You have a foundation to build on but there are gaps in your understanding. Score: ${level}/5.`
    ],
    2: [
      `Limited ${skill} knowledge detected. Your answers were vague and lacked technical depth. Score: ${level}/5.`,
      `Beginner-level ${skill} understanding. The responses suggest familiarity with concepts but limited practical application. Score: ${level}/5.`
    ],
    1: [
      `Minimal ${skill} knowledge. Based on your responses, this appears to be an area that needs significant development. Score: ${level}/5.`,
      `${skill} is not a strength area. Your responses indicated limited exposure to this technology. Score: ${level}/5.`
    ]
  };

  const options = rationales[level] || rationales[3];
  return options[Math.floor(Math.random() * options.length)] + integrityWarning;
}

/**
 * Detect if a response looks like it was copied from AI
 */
export function detectAIResponse(text: string): boolean {
  const aiPatterns = [
    /^(certainly|sure|of course|here's|let me explain)/i,
    /\*\*.*\*\*/, // Markdown bold
    /```[\s\S]*```/, // Code blocks
    /^\d+\.\s+/m, // Numbered lists starting at 1
    /in conclusion|to summarize|in summary/i,
    /it's worth noting|important to note|key takeaway/i
  ];
  
  return aiPatterns.some(pattern => pattern.test(text));
}
