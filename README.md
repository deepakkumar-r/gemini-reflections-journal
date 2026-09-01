# ReflectAI — Secure Cognitive Journal & Reflection Assistant

#AccelerateAiwithCloudRun

A user-authenticated journaling and multi-turn reflection workspace powered by **Gemini 3.6 Flash**, **Firebase Authentication**, and **Google Cloud Firestore**.

---

## 🌟 Key Features

* **Multi-Turn Cognitive Reflection**: Deep, multi-turn AI reasoning loops across daily reflections, brainstorming, problem solving, gratitude, and action planning.
* **Voice Stream Socratic Audio Dialogue**: Live voice input stream with real-time waveform visualization, Socratic questioning, and automated text-to-speech audio responses.
* **Cognitive Growth & Blindspot Radar**: Longitudinal analysis mapping 6 cognitive dimensions, sentiment trajectories, and recurring mental model blindspots using Recharts.
* **Zero-Trust Firestore Security**: Every entry and transcript is partitioned strictly under `/users/{userId}` with strict owner-bound Firestore security rules (`request.auth.uid == userId`).
* **Resilient Model Fallback Ladder**: Automated fallback ladder across Gemini models (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`).

---

## 🏛️ System Architecture & Threat Model

ReflectAI implements an end-to-end zero-trust architecture designed according to OWASP Top 10 Web and LLM Security standards across 5 critical threat zones:

| Threat Zone | Identified Vulnerability / Risk | Implemented Countermeasure |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Malformed JSON payloads, oversized requests, script injection | Express JSON limit (`10mb`), defensive null-safe parameter parsing, sanitized markdown output. |
| **2. Planning & Reasoning** | Indirect prompt injection via conversation history | Rigid system prompt boundaries, role encapsulation (`user` vs `model`), and structured plain-text history ingestion. |
| **3. Tool & API Execution** | Model downtime, rate limiting, and unhandled server crashes | 4-tier model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`). |
| **4. Memory & State** | Cross-user data leakage and unauthorized Firestore reads/writes | Strict owner-bound Firestore security rules (`request.auth.uid == userId`) and payload undefined-stripping utility. |
| **5. Inter-System Comm** | API key leakage and token interception | Server-side Express proxy with zero hardcoded API keys; dynamic injection via Secret Manager / environment variables. |

---

## 🔒 Cloud Firestore Security Rules (`firestore.rules`)

User interactions and journal entries are strictly isolated to the authenticated user ID (`userId`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile isolation
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User interaction sessions and chat history isolation
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User journal entries and reflection records isolation
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 💻 Local Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and set your Gemini API key:

```bash
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
APP_URL="http://localhost:3000"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deployment Steps (Google Cloud Run & Secret Manager)

### 1. Prerequisites & API Activation
Ensure the `gcloud` CLI is authenticated and the required GCP APIs are enabled:

```bash
# Set active GCP project
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com
```

### 2. Secret Manager Configuration
Securely store your Gemini API key in Secret Manager and grant access to the Cloud Run runtime service account:

```bash
# Create and populate the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Obtain project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy to Cloud Run
Deploy the application container to Cloud Run with automatic secret injection:

```bash
gcloud run deploy reflectai-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### 4. Apply Challenge Resource Label
Apply the mandatory resource label for automated verification:

```bash
gcloud run services update reflectai-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Functional Verification Guide

### Test Case 1: Google Authentication & Session Initialization
1. Navigate to the application URL.
2. Verify that unauthenticated users see the landing page with the **Sign in with Google** button or **Instant Live Preview Vault**.
3. Click **Sign in with Google** (or launch Guest Mode).
4. Verify seamless transition to the private Dashboard.

### Test Case 2: Multi-Turn Cognitive Reflection
1. In the Dashboard, click **New Reflection** or select a starter prompt.
2. Select a reflection mode (`Daily Reflection`, `Brainstorming`, `Problem Solving`, `Gratitude`, `Action Planning`).
3. Send a reflection entry and verify Gemini 3.6 Flash responses with multi-turn context retention.

### Test Case 3: Executive Synthesis & Action Takeaways
1. Click **Generate Summary** on an active entry.
2. Verify Gemini synthesizes an executive summary, checklist takeaways, mood classification, and tag suggestions.

### Test Case 4: Cognitive Blindspot Radar
1. Navigate to the **Cognitive Radar** tab.
2. View 6-dimension radar metrics, sentiment trajectory, and AI-recommended coaching questions.
