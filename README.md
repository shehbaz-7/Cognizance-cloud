# 🧠 Cognizance — AI-Powered Skill Retention & Mastery Platform

An intelligent learning platform that tracks knowledge retention, predicts skill decay using cognitive science, and generates personalized learning interventions to help users achieve long-term mastery.

Built with **Next.js 16**, **React 19**, **TypeScript**, and **NVIDIA NIM AI Models**.

---

## 🚀 Overview

Most learning platforms focus on delivering content.

**Cognizance focuses on retention.**

Using the **Ebbinghaus Forgetting Curve**, the platform continuously measures how well users retain knowledge, identifies weak areas before they become problems, and automatically generates targeted learning materials, quizzes, study plans, and AI tutoring sessions.

The result is a closed-loop learning system:

```text
Learn
   ↓
Practice
   ↓
Analyze Weaknesses
   ↓
Generate Targeted Content
   ↓
Review & Reinforce
   ↓
Mastery
```

---

## ✨ Key Features

### 📊 Cognitive Command Center

* Real-time skill health dashboard
* Retention tracking across all skills
* Decay risk forecasting
* Learning streak monitoring
* Personalized AI recommendations

### 🛣️ Neural Roadmap Generator

* AI-generated learning paths
* Beginner, Intermediate, and Expert tracks
* Structured phase-based progression
* Time estimates and milestones
* One-click study material generation

### 📝 Smart Notes & Master Manuals

* AI-generated study notes
* Deep-dive concept explanations
* Code examples and best practices
* PDF & Word export support
* Source attribution from multiple knowledge providers

### 🧪 Neural Practice Lab

* Adversarial quizzes
* Misconception-focused questions
* Detailed explanations
* Performance tracking
* Weakness-aware assessment

### 🎙️ AI Oral Viva

* Socratic-style questioning
* Dynamic follow-up questions
* Understanding depth evaluation
* Context-aware conversations

### 🤖 Sage AI Tutor

* Personal AI study companion
* Long-context technical discussions
* Guided learning approach
* Concept explanations, examples, and mini quizzes

### 🔍 Weak Spots Analyzer

* Concept-level weakness detection
* Accuracy-based severity scoring
* AI-generated 7-day improvement plans
* Resource recommendations

### 🕸️ Neural Connections Graph

* Interactive concept visualization
* Force-directed knowledge maps
* Mastery-based node coloring
* Dynamic relationship generation

### 📈 Skill Analytics

* Retention metrics
* Decay prediction
* Performance trends
* Learning behavior insights

### 🔔 Smart Alerts

* Review reminders
* Decay warnings
* Weekly learning summaries
* Milestone achievements

---

## 🧠 Retention Science Engine

Cognizance models memory retention using the **Ebbinghaus Forgetting Curve**.

```text
R = 0.5^(t / S)
```

Where:

| Variable | Meaning                |
| -------- | ---------------------- |
| R        | Retention Probability  |
| t        | Time Since Last Review |
| S        | Retention Strength     |

### Features

* Retention prediction
* Forgetting risk estimation
* Review scheduling
* Dynamic strength adaptation

The platform determines the optimal review moment before knowledge loss becomes significant.

---

## 🏗️ Architecture

```text
Frontend (Next.js)
│
├── Dashboard
├── Learn
├── Notes
├── Quiz
├── Viva
├── Study Buddy
├── Weakness Analyzer
├── Analytics
└── Concept Graph
│
▼
Global Skill Context
│
▼
Retention Engine
│
▼
API Layer
│
├── Notes Generation
├── Roadmap Generation
├── Weakness Analysis
├── Recommendations
├── Viva Engine
└── Study Buddy
│
▼
AI Router
│
├── NVIDIA NIM Models
├── Multi-Model Routing
└── Fallback System
```

---

## ⚙️ Technology Stack

| Category         | Technology           |
| ---------------- | -------------------- |
| Framework        | Next.js 16           |
| Language         | TypeScript           |
| UI               | React 19             |
| Styling          | Tailwind CSS 4       |
| Animation        | Framer Motion        |
| AI Platform      | NVIDIA NIM           |
| Visualization    | react-force-graph-2d |
| Code Editor      | Monaco Editor        |
| Validation       | Zod                  |
| PDF Export       | jsPDF                |
| State Management | React Context API    |

---

## 🤖 AI Architecture

The platform uses a centralized AI routing layer that intelligently selects the best model for each task.

| Task             | Model                   |
| ---------------- | ----------------------- |
| Notes Generation | Llama 3.1 8B            |
| Code Assistance  | Llama 3.1 8B            |
| Quiz Analysis    | Llama 3.1 8B            |
| Recommendations  | Llama 3.1 8B            |
| Viva Sessions    | Llama 3.1 8B            |
| Embeddings       | NVIDIA NV-EmbedQA-E5-V5 |

### Benefits

* Task-specific optimization
* Consistent API interface
* Automatic fallback support
* High availability

---

## 🌐 Knowledge Aggregation Engine

Cognizance enriches learning content by combining information from multiple public sources:

* Wikipedia
* DEV.to
* Stack Overflow
* GitHub
* DuckDuckGo
* Open Library

### Features

* Parallel fetching
* Source attribution
* Cached responses
* Graceful failure handling

---

## 🎮 Gamification

Learning is reinforced through progression systems:

### XP System

* Complete roadmap steps
* Generate study material
* Take quizzes
* Finish reviews

### Progression

* Levels
* Streaks
* Achievement badges
* Neural Growth rewards

---

## 📂 Project Structure

```bash
src/
├── app/
│   ├── page.tsx
│   ├── learn/
│   ├── notes/
│   ├── quiz/
│   ├── viva/
│   ├── study-buddy/
│   ├── weakness/
│   ├── graph/
│   ├── analytics/
│   ├── alerts/
│   └── api/
│
├── components/
│   ├── layout/
│   └── coding/
│
└── lib/
    ├── SkillContext.tsx
    ├── retention-engine.ts
    ├── concept-analyzer.ts
    ├── web-content.ts
    ├── nvidia-ai.ts
    └── ai/router.ts
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone <repository-url>
cd cognizance-next
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create a `.env.local` file:

```env
NVIDIA_API_KEY=your_api_key_here
```

### Start Development Server

```bash
npm run dev
```

Visit:

```text
http://localhost:3000
```

---

## 📦 Production Build

```bash
npm run build
npm start
```

---

## 🔌 API Endpoints

| Endpoint              | Method | Purpose                        |
| --------------------- | ------ | ------------------------------ |
| /api/generate-notes   | POST   | Generate study notes           |
| /api/generate-roadmap | POST   | Create learning roadmap        |
| /api/analyze-weakness | POST   | Detect weak concepts           |
| /api/recommendations  | POST   | Generate study recommendations |
| /api/study-buddy      | POST   | AI tutoring                    |
| /api/viva             | POST   | Oral examination               |
| /api/concept-graph    | POST   | Generate concept graph         |
| /api/problems         | POST   | Coding problem generation      |
| /api/submit           | POST   | Code evaluation                |
| /api/debug            | POST   | Debug assistance               |

---

## 🎯 Mission

Cognizance transforms learning from content consumption into continuous knowledge retention.

By combining cognitive science, AI personalization, retention analytics, and adaptive practice, it helps learners move beyond short-term memorization and toward true mastery.

---

Built with Next.js, React, TypeScript, NVIDIA NIM, and the Ebbinghaus Forgetting Curve.
