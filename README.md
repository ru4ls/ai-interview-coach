# AI Interview Coach

<!-- ![AI Interview Coach Screenshot](https://raw.githubusercontent.com/ruals/testing-repo/main/preview.png) -->
<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

**AI Interview Coach** is a full-stack web application designed to help job seekers prepare for interviews. It leverages the power of Google's Gemini LLM to act as an intelligent AI interviewer, providing in-depth, real-time feedback.

This project is built with a modern architecture using React/TypeScript on the frontend and Node.js/Express on the backend, containerized with Docker, and designed for deployment on the Google Cloud Platform.

<br/>

<!--p align="center">
  <a href="https://www.youtube.com/watch?v=vxyFBMsRFiQ" target="_blank">
    <img src="https://img.youtube.com/vi/vxyFBMsRFiQ/maxresdefault.jpg" alt="Watch the Video Demo of the AI Interview Coach" width="90%">
  </a>
</p-->

## The Problem This Solves

Job interviews are a high-stakes, high-stress process. Many talented candidates struggle not because of a lack of skills, but due to a lack of practice in a realistic setting. Key challenges for job seekers include:

- **Lack of Realistic Practice:** Practicing in front of a mirror or with friends doesn't simulate the pressure of a real interview.
- **No Immediate, Objective Feedback:** It's hard to know what you're doing wrong. Friends may be too polite, and professional coaches can be expensive.
- **Context is King:** Generic interview questions are helpful, but real interviews focus on the specific role and the candidate's actual resume.
- **Accessibility:** High-quality interview coaching is often a paid service, creating a barrier for many.

This **AI Interview Coach** directly addresses these problems by providing a free, accessible, and highly personalized platform for users to practice in a simulated, yet realistic, verbal interview environment. It acts as a dedicated coach that's available 24/7.

## Key Features

- **Dynamic Interview Sessions:** Users can set up customized interview sessions by selecting their industry, job role, and preferred language.
- **Deep Personalization:** The AI uses context from an uploaded resume (PDF), a profile summary, and the job description to ask highly relevant, tailored questions.
- **Structured Interview Flow:** The interview progresses through distinct phases: Introduction, Experience, Role-Specific, and Personality, with a user-configurable number of questions for each phase.
- **Dual AI Personas:**
    - **AI Interviewer:** Acts as the conversationalist, asking questions naturally.
    - **AI Analyst:** Works behind the scenes to provide objective analysis, scores, hints, and example answers.
- **Verbal Interviews (TTS & STT):**
    - **Text-to-Speech:** The AI Interviewer "speaks" using high-quality, selectable voices from Google Cloud TTS.
    - **Speech-to-Text:** Users can answer questions using their voice, with real-time transcription powered by a WebSocket connection to the Google Cloud STT streaming API.
- **Modern & Responsive UI:**
    - A professional interface with fully functional Light & Dark modes.
    - Clean and intuitive layouts for both the setup and the interview session.
    - Smooth animations (Framer Motion) and audio feedback (sound blips) for a polished user experience.
- **Comprehensive Analysis:** After the interview, users receive a final summary report detailing their overall score, key strengths, and areas for improvement.

## Tech Stack

### Frontend
- **Framework:** React.js with TypeScript
- **Styling:** Material-UI (MUI) with custom theming
- **State Management:** React Hooks (`useState`, `useEffect`, `useContext`, Custom Hooks)
- **Animation:** Framer Motion
- **Notifications:** React Hot Toast
- **Real-time Communication:** Client-side WebSocket API

### Backend
- **Framework:** Node.js with Express.js
- **Language:** TypeScript
- **Real-time Communication:** `ws` (Node.js WebSocket library)
- **AI & Cloud Services:**
    - **Google Gemini API:** For core conversational logic and analysis.
    - **Google Cloud Text-to-Speech:** To generate the AI's voice.
    - **Google Cloud Speech-to-Text:** For real-time streaming transcription of the user's voice.
- **Utilities:** `multer` for file uploads, `pdf-parse` for resume reading.

### Environment
- **Containerization:** Docker & Docker Compose
- **Deployment Target:** Google Cloud Run

## ⚙️ Local Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [Docker](https://www.docker.com/) & Docker Compose
- [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) installed and authenticated (`gcloud auth login`).
- A Google Cloud account with an active billing account.

### Step 1: Google Cloud Project Setup

1.  **Create a Project:** Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project. Note your **Project ID**.

2.  **Enable APIs:** In your new project, you must enable the following APIs. You can find them by searching their names in the console's search bar.
    - `Generative Language API` (for Gemini)
    - `Cloud Text-to-Speech API`
    - `Cloud Speech-to-Text API`

### Step 2: Get API Keys & Credentials

This application requires two types of credentials.

#### A. Gemini API Key

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Click **"Get API key"** and then **"Create API key in new project"**.
3.  Select the Google Cloud Project you just created.
4.  Your API key will be generated. Copy this key.
5.  You will use this for the `GEMINI_API_KEY` variable in your `.env` file.

#### B. Google Cloud Service Account (for TTS & STT)

The Text-to-Speech and Speech-to-Text libraries use a service account file for authentication.

1.  In the Google Cloud Console, navigate to **IAM & Admin > Service Accounts**.
2.  Click **+ CREATE SERVICE ACCOUNT**.
    -   Give it a name (e.g., `ai-coach-service-account`).
    -   Click **CREATE AND CONTINUE**.
3.  **Grant Permissions:** Add the following roles to the service account:
    - `Cloud Text-to-Speech User`
    - `Cloud Speech-to-Text User`
    - Click **CONTINUE**, then **DONE**.
4.  **Generate a JSON Key:**
    -   Find the service account you just created in the list and click on its email address.
    -   Go to the **KEYS** tab.
    -   Click **ADD KEY > Create new key**.
    -   Select **JSON** as the key type and click **CREATE**. A JSON file will download automatically.
5.  **Prepare the Credential:**
    -   Open the downloaded JSON file.
    -   Copy its **entire content**.
    -   You will use this for the `GCP_CREDENTIALS_JSON` variable in your `.env` file. It must be a **single-line string** (remove all line breaks).

### Step 3: Local Configuration

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/ru4ls/ai-interview-coach.git
    cd ai-interview-coach
    ```

2.  **Create `.env` file:**
    -   In the root directory of the project, create a file named `.env`.
    -   Add the credentials you acquired in the previous step:
    ```env
    # From Google AI Studio
    GEMINI_API_KEY=your_gemini_api_key_here

    # The single-line JSON content from your Service Account file
    GCP_CREDENTIALS_JSON={"type": "service_account", "project_id": "...", ...}
    ```
    - Copy this .env to /backend/.env

### Step 4: Run the Application

1.  **Build and Run with Docker Compose:**
    This command will build the Docker images and start both containers.
    ```bash
    docker-compose up --build
    ```

2.  **Access the Application:**
    -   Open your browser and navigate to `http://localhost:3000`.
    -   The backend server will be running on `http://localhost:8080`.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.