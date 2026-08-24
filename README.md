# 🧠 Tri-Minds Learning App

> An AI-powered personalized learning platform that helps learners create learning plans, interact with an AI tutor, practice with dynamically generated quizzes, and track their learning progress.

## 📌 Overview

**Tri-Minds Learning App** is a full-stack AI learning platform built to provide a personalized and interactive learning experience.

The application combines a modern React frontend with a FastAPI backend and a locally hosted LLM through Ollama.

### ✨ Key Features

* 🤖 **AI Tutor** — Ask questions and get AI-powered explanations.
* 📚 **Personalized Learning Plan** — Generate structured learning plans based on topic, level, and duration.
* 📝 **AI Quiz Generator** — Dynamically generate multiple-choice quizzes.
* 🧠 **Quiz Memory** — Helps avoid repeatedly generating the same questions.
* 📊 **Progress Tracking** — Track completed learning weeks and learning progress.
* 🎯 **Difficulty Levels** — Beginner, Intermediate, and Advanced learning levels.
* ⚡ **Local AI** — Uses Ollama with Llama 3.2 for AI processing.
* 🌐 **Full-Stack Architecture** — React frontend + FastAPI backend.
* ☁️ **Deployment Ready** — Frontend can be deployed on Vercel and backend exposed through Cloudflare Tunnel.

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────┐
│                Tri-Minds App                 │
└──────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│          React + Vite Frontend               │
│                                              │
│  • Dashboard                                 │
│  • AI Tutor                                  │
│  • Learning Plan                             │
│  • Quiz                                      │
│  • Progress                                  │
│  • Settings                                  │
└──────────────────────────────────────────────┘
                       │
                       │ REST API
                       ▼
┌──────────────────────────────────────────────┐
│              FastAPI Backend                 │
│                                              │
│  /api/v1/tutor                               │
│  /api/v1/learning-plan                       │
│  /api/v1/quiz                                │
└──────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│               AI Layer                       │
│                                              │
│          Ollama + Llama 3.2                  │
└──────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS
* Lucide React
* LocalStorage

### Backend

* Python
* FastAPI
* Uvicorn
* Pydantic
* LangChain
* LangGraph

### AI / LLM

* Ollama
* Llama 3.2

### Deployment

* GitHub
* Vercel
* Cloudflare Tunnel

---

## 📂 Project Structure

```text
Tri-Minds-Learning-App/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── LearningPlan.jsx
│   │   │   ├── AITutor.jsx
│   │   │   ├── Quiz.jsx
│   │   │   └── Progress.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   └── quiz_agent.py
│   │   │
│   │   ├── routers/
│   │   │   ├── tutor.py
│   │   │   ├── learning_plan.py
│   │   │   └── quiz.py
│   │   │
│   │   ├── schemas/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── .env
│
├── README.md
└── .gitignore
```

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/saravana2720/Tri-Minds-Learning-App.git

cd Tri-Minds-Learning-App
```

---

# ⚛️ Frontend Setup

Move into the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🐍 Backend Setup

Open another terminal and move into the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it:

### Linux / Ubuntu

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# 🤖 Ollama Setup

Tri-Minds uses **Ollama** to run the local LLM.

Install Ollama and verify:

```bash
ollama --version
```

Pull the required model:

```bash
ollama pull llama3.2
```

Verify installed models:

```bash
ollama list
```

Start Ollama if required:

```bash
ollama serve
```

---

# ▶️ Start the Backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend:

```text
http://127.0.0.1:8000
```

FastAPI Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

---

# 🔌 API Endpoints

## AI Tutor

```http
POST /api/v1/tutor
```

Used to send questions to the AI Tutor.

---

## Learning Plan

```http
POST /api/v1/learning-plan
```

Generates a personalized learning plan.

Example input:

```json
{
  "topic": "Machine Learning",
  "level": "beginner",
  "duration": 4
}
```

---

## Quiz

```http
POST /api/v1/quiz
```

Generates AI-powered multiple-choice questions.

Example:

```json
{
  "topic": "Machine Learning",
  "level": "beginner",
  "number_of_questions": 5
}
```

The quiz system validates:

* Exactly 4 options
* Correct answer must match an option
* Unique options
* Explanation required
* No duplicate questions
* Question IDs start from 1

---

# 🧠 AI Quiz Memory

The quiz agent maintains memory of previously generated questions.

Example:

```text
QUIZ MEMORY SAVED:
machine learning|beginner

Stored questions: 6
```

This helps the system avoid repeatedly generating the same questions for the same topic and difficulty level.

---

# 🌐 Environment Variables

For the frontend, create:

```text
frontend/.env
```

Example:

```env
VITE_API_URL=http://127.0.0.1:8000
```

For production, replace the local backend URL with the publicly accessible backend URL.

Example:

```env
VITE_API_URL=https://your-backend-url.example.com
```

> Never commit real API keys or secrets to GitHub.

---

# ☁️ Deployment

## Frontend — Vercel

The React/Vite frontend can be deployed using Vercel.

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Configure the frontend environment variable:

```text
VITE_API_URL
```

Set it to the deployed/public backend URL.

---

## Backend — Cloudflare Tunnel

For development/testing, the local FastAPI backend can be exposed using Cloudflare Tunnel.

Start FastAPI:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Then:

```bash
cloudflared tunnel --url http://127.0.0.1:8000
```

Cloudflare will provide a public HTTPS URL.

Use that URL as:

```env
VITE_API_URL=https://your-tunnel-url.trycloudflare.com
```

> Cloudflare Quick Tunnels are useful for development/testing. For a permanent production deployment, use a proper hosted backend/server.

---

# 🔐 CORS Configuration

Because the frontend and backend can run on different domains, the FastAPI backend must allow the frontend origin.

Development example:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Production should allow the deployed frontend domain.

Example:

```text
https://your-app.vercel.app
```

---

# 📊 Application Flow

```text
User
 │
 ▼
React Dashboard
 │
 ├── AI Tutor ──────────────┐
 │                          │
 ├── Learning Plan ─────────┤
 │                          ▼
 └── Quiz ─────────────── FastAPI
                            │
                            ▼
                         LangGraph
                            │
                            ▼
                         Ollama
                            │
                            ▼
                        Llama 3.2
                            │
                            ▼
                       AI Response
                            │
                            ▼
                      React Frontend
```

---

# 🎯 Learning Workflow

```text
1. Choose a learning topic
          ↓
2. Select difficulty level
          ↓
3. Select learning duration
          ↓
4. Generate personalized plan
          ↓
5. Study each learning week
          ↓
6. Ask AI Tutor questions
          ↓
7. Take AI-generated quizzes
          ↓
8. Track learning progress
```

---

# 📸 Screenshots

Add screenshots of the application here.

Recommended screenshots:

* Dashboard
* AI Tutor
* Learning Plan
* Quiz
* Progress
* Settings

Example:

```markdown
![Dashboard](screenshots/dashboard.png)

![AI Tutor](screenshots/ai-tutor.png)

![Learning Plan](screenshots/learning-plan.png)

![Quiz](screenshots/quiz.png)

![Progress](screenshots/progress.png)
```

---

# 🔮 Future Enhancements

* 🔐 User authentication
* 👤 User profiles
* 💾 Persistent database storage
* 📈 Advanced analytics
* 🏆 Gamification and badges
* 🔥 Learning streaks
* 📚 Course/resource recommendations
* 🎤 Voice-based AI Tutor
* 📄 PDF learning material support
* 🧠 RAG-based personalized learning
* 🌍 Multi-language learning
* 📱 Mobile application
* 🚀 Production backend deployment

---

# 🧪 Development

Run frontend:

```bash
cd frontend
npm run dev
```

Run backend:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Check API documentation:

```text
http://127.0.0.1:8000/docs
```

---

# 🤝 Contributing

Contributions are welcome.

```text
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Commit your changes
6. Push the branch
7. Create a Pull Request
```

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Saravana**

GitHub:

```text
https://github.com/saravana2720
```

Repository:

```text
https://github.com/saravana2720/Tri-Minds-Learning-App
```

---

## ⭐ Project

If you find this project useful, consider giving the repository a ⭐ on GitHub.

**Tri-Minds Learning App — Learn Smarter. Learn Faster. Learn with AI.**
