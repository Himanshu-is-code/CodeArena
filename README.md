# CodeArena — Full-Stack Online Judge & AI Algorithmic Platform

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/DaisyUI-Tailwind-06B6D4?logo=tailwindcss&logoColor=white)](https://daisyui.com/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-VS_Code_Core-007ACC?logo=visual-studio-code&logoColor=white)](https://microsoft.github.io/monaco-editor/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI_Tutor-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Video_Streaming-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)

**CodeArena** is a production-grade, distributed online judge and algorithmic learning platform. It allows software engineers to solve algorithmic problems, compile and run code in multiple programming languages against automated test suites, receive context-aware hints from an AI tutor, watch high-definition video editorials, and review detailed submission performance analytics.

---

## 🏛️ System Architecture

The platform is designed around a decoupled client-server architecture integrating specialized third-party cloud engines for sandboxed compilation, media distribution, and LLM reasoning.

```
                     ┌──────────────────────────────────────────────┐
                     │          React + Vite Single Page App        │
                     │  (Monaco Editor, Redux Toolkit, DaisyUI)     │
                     └──────────────────────┬───────────────────────┘
                                            │ HTTPS / REST APIs
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │          Node.js / Express Backend           │
                     │  (JWT Auth, RBAC, Controllers, Validators)   │
                     └───┬─────────────┬─────────────┬───────────┬──┘
                         │             │             │           │
           ┌─────────────▼───┐   ┌─────▼───────┐  ┌──▼─────┐  ┌──▼────────────┐
           │  MongoDB Atlas  │   │   Judge0    │  │ Gemini │  │  Cloudinary   │
           │  (Users, Code,  │   │  Execution  │  │ AI API │  │ (Video CDN &  │
           │   Submissions)  │   │   Engine    │  │ (LLM)  │  │ Signed Upload)│
           └─────────────────┘   └─────────────┘  └────────┘  └───────────────┘
```

---

## 💻 Technology Stack

### Frontend (Client-Side)
- **Framework**: React 19 (via Vite build pipeline)
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) for global authentication, problems, and submission history state.
- **Code Editor**: Microsoft Monaco Editor (`@monaco-editor/react`) with syntax highlighting, indentation guides, and multi-language support.
- **Styling & UI**: Tailwind CSS v4 + DaisyUI component library (custom light theme configuration).
- **Form Handling & Validation**: React Hook Form + Zod resolvers.
- **Routing**: React Router DOM (v7) with role-based protected routes.
- **HTTP Client**: Axios with credentials interception (`withCredentials: true`).
- **Icons**: Lucide React.

### Backend (Server-Side)
- **Runtime**: Node.js (CommonJS modules)
- **Framework**: Express.js
- **Database ORM**: Mongoose ODM with relational references (`ObjectId`).
- **Security & Auth**:
  - JSON Web Tokens (`jsonwebtoken`) signed with HMAC SHA-256.
  - Secure, HTTP-only cookie persistence.
  - Password hashing with `bcrypt`.
  - CORS security middleware.
- **Sandboxed Code Execution**: Judge0 REST API integration for compiling and executing C++, Java, and JavaScript against standard input/output.
- **Generative AI Assistant**: Google Generative AI (`@google/genai`) powered by the Gemini model with specialized prompt engineering.
- **Media Architecture**: Cloudinary SDK for generating cryptographically signed direct client-to-cloud upload tokens and streaming video solutions.

---

## ⚙️ Core Architectural Modules

### 1. Sandboxed Code Execution Pipeline
1. The user inputs their solution into Monaco Editor and chooses a runtime (JavaScript, C++, or Java).
2. The frontend dispatches the code and test cases to `/problem/run` or `/problem/submit`.
3. The backend maps language identifiers to Judge0 language specifications and dispatches asynchronous execution batches.
4. Outputs are captured, memory/execution time are extracted, and answers are verified against expected test case assertions.
5. On formal submission, full status metrics (*Accepted, Wrong Answer, Time Limit Exceeded, Runtime Error, Compilation Error*) are written to MongoDB and linked to the user's account.

### 2. Socratic AI Tutor (Gemini Integration)
- Located in the problem workspace as a dedicated companion pane.
- Built to act as an algorithmic coach rather than a code generator.
- Prompt architecture injects the active problem's title, description, visible test cases, and the user's current editor code into the context window, guiding the learner through time complexity bottlenecks, edge cases, and algorithmic patterns without spoiling the full solution.

### 3. Direct Signed Video Solution Pipeline
- To avoid overloading the Node.js server with high-bandwidth video files, video management uses **signed upload signatures**.
- When an administrator uploads a problem editorial, the backend generates an authenticated signature (`cloudinary.utils.api_sign_request`).
- The frontend uploads the video file directly to Cloudinary CDN storage.
- Once completed, the metadata (public ID, secure URL, video duration) is persisted in the database and rendered on the problem page.

### 4. Role-Based Access Control (RBAC)
- **Normal Users**: Browse problem catalog, filter by difficulty/tags, solve problems, test code, submit solutions, track submission history, chat with the AI tutor, and watch video editorials.
- **Admin Users**: Access administrative dashboards to create problems, add hidden/visible test cases, upload video editorials, and manage content.

---

## 🗄️ Database Schemas (MongoDB)

- **`User`**:
  - `firstName`, `lastName`, `emailId`, `password` (hashed), `role` (`'user'` | `'admin'`).
- **`Problem`**:
  - `title`, `description`, `difficulty` (`'easy'` | `'medium'` | `'hard'`), `tags`, `visibleTestCases` (`input`, `output`, `explanation`), `hiddenTestCases`, `referenceSolution` (by language), `secureUrl`, `duration`.
- **`Submission`**:
  - `userId` (ref: User), `problemId` (ref: Problem), `code`, `language`, `status` (`Accepted`, `Wrong Answer`, etc.), `runtime`, `memory`, `errorMessage`, `submittedAt`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Database (Atlas or local)
- Judge0 API Key (RapidAPI or self-hosted)
- Google Gemini API Key
- Cloudinary Account (Cloud Name, API Key, API Secret)

### 1. Clone the Repository
```bash
git clone https://github.com/Himanshu-is-code/CodingPatform.git
cd CodingPatform
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=3000
DB_CONNECT_STRING=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JUDGE0_API_KEY=your_rapidapi_judge0_key
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

Run the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../Frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## 🔒 Security & Best Practices
- **Token Security**: JWT tokens are transmitted via HTTP-only cookies to mitigate XSS exposure.
- **Password Security**: Credentials hashed using strong `bcrypt` salt rounds.
- **Asset Offloading**: Large binary media (videos) bypass backend buffers completely through signed CDN delegation.
- **Clean Git Hygiene**: All sensitive configurations, `.env` files, and local scratch files are strictly ignored via `.gitignore`.
