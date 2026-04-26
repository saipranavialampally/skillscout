# SkillScout 🎯

AI-Powered Skill Assessment Platform with adaptive questioning, live proctoring, and personalized learning plans.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open http://localhost:5173
```

## Enable AI Assessment (Optional)

For intelligent, adaptive questioning powered by Llama 3 70B:

```bash
# 1. Copy the example env file
cp .env.example .env

# 2. Get your FREE Groq API key
#    - Go to https://console.groq.com
#    - Sign up (instant, no credit card)
#    - Create API Key

# 3. Add your key to .env
VITE_GROQ_API_KEY=gsk_your_key_here

# 4. Restart the dev server
npm run dev
```

**Without API key**: Uses pattern matching (works offline)
**With API key**: Uses Llama 3 70B for real AI analysis

## Features

### 🤖 AI-Powered Assessment
- Adaptive questions that probe deeper based on answers
- Real understanding analysis (not just keywords)
- Personalized follow-up questions
- Powered by Llama 3 70B via Groq (free tier)

### 🧬 Skill DNA Visualization
- Visual comparison of claimed vs assessed skills
- Color-coded bars showing gaps at a glance
- Screenshot-worthy design

### 🛡️ Anti-Cheat Proctoring
- Tab switch detection
- Paste blocking
- Typing speed analysis
- Pattern naturalness detection
- Integrity score that affects final rating

### 📈 Fastest Path to Hired
- Personalized learning plan
- Prioritized by what's learnable first
- Real resources (official docs, courses)
- Time estimates for each skill

### 🎉 Wow Factors
- Live "Lie Detector" trust gauge
- Real-time typing statistics
- Confetti on high scores
- Sound alerts for violations

## How It Works

1. **Upload**: Paste job description and resume
2. **Extract**: AI identifies required skills with weights
3. **Assess**: Adaptive chat-based skill interview (2-3 questions per skill)
4. **Analyze**: Gap analysis with severity scoring
5. **Plan**: Personalized learning roadmap

## Scoring Model

| Component | Formula | Description |
|-----------|---------|-------------|
| Gap Severity | `(required - actual) × weight` | Higher = more critical |
| Learnability | `adjacency / gap` | Higher = easier to learn |
| Priority | `(gap × weight) / learnability` | What to learn first |

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **AI**: Groq API (Llama 3 70B) with regex fallback
- **Charts**: Recharts for radar visualization
- **Proctoring**: Browser Visibility API + typing analysis

## Sample Input

**Job Description:**
```
Senior ML Engineer
Required: Python (Expert), PyTorch, Distributed Training
Preferred: Kubernetes, MLflow
Bonus: Rust
```

**Resume:**
```
John Smith - ML Engineer
3 years Python, built BERT fine-tuning pipelines
Some Kubernetes exposure, basic distributed systems
```

## License

MIT
