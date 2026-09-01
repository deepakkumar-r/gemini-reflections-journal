import React from 'react';
import { 
  ShieldCheck, 
  X, 
  Lock, 
  Database, 
  KeyRound, 
  Server, 
  Eye, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-[#E5DFD5] rounded-3xl shadow-2xl flex flex-col text-stone-900 overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Agentic Threat Model & Security Specs</h2>
              <p className="text-xs text-stone-500">Analysis across the 5 Threat Zones & Zero-Trust Configuration</p>
            </div>
          </div>
          <button
            id="close-threat-model-btn"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm bg-white">
          
          {/* Threat Zone Matrix */}
          <div>
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-3">
              1. The 5 Threat Zones & Defense Matrix
            </h3>
            <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FAF8F5] text-stone-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="p-3.5 border-b border-stone-200">Threat Zone</th>
                    <th className="p-3.5 border-b border-stone-200">Identified Vulnerability / Risk</th>
                    <th className="p-3.5 border-b border-stone-200">Implemented Security Countermeasure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700 text-xs">
                  <tr className="hover:bg-stone-50/80">
                    <td className="p-3.5 font-bold text-stone-900">1. Input Surfaces</td>
                    <td className="p-3.5 text-stone-600">Malformed JSON payloads, oversized requests, script injections in reflections</td>
                    <td className="p-3.5 text-emerald-800 font-medium">Strict express JSON size limit (10mb), defensive null-safe destructuring, and sanitized React Markdown rendering.</td>
                  </tr>
                  <tr className="hover:bg-stone-50/80">
                    <td className="p-3.5 font-bold text-stone-900">2. Planning & Reasoning</td>
                    <td className="p-3.5 text-stone-600">Indirect prompt injection attempting to leak system prompts or change AI role</td>
                    <td className="p-3.5 text-emerald-800 font-medium">Rigid system instruction boundaries, role separation, and plain text encapsulation for all conversation history.</td>
                  </tr>
                  <tr className="hover:bg-stone-50/80">
                    <td className="p-3.5 font-bold text-stone-900">3. Tool Execution</td>
                    <td className="p-3.5 text-stone-600">API failures, model unavailability, and unhandled server crashes</td>
                    <td className="p-3.5 text-emerald-800 font-medium">Resilient 4-tier model fallback ladder (<code className="text-stone-900 font-mono">gemini-3.6-flash &rarr; 3.1-flash-lite &rarr; flash-latest &rarr; 3.7-flash</code>) with error recovery matrix.</td>
                  </tr>
                  <tr className="hover:bg-stone-50/80">
                    <td className="p-3.5 font-bold text-stone-900">4. Memory & State</td>
                    <td className="p-3.5 text-stone-600">Cross-user data read/write, unauthorized document modification in Firestore</td>
                    <td className="p-3.5 text-emerald-800 font-medium">Zero insecure defaults: strict owner-bound rules (<code className="text-stone-900 font-mono">request.auth.uid == userId</code>) for all entries & interactions. Undefined-stripping utility.</td>
                  </tr>
                  <tr className="hover:bg-stone-50/80">
                    <td className="p-3.5 font-bold text-stone-900">5. Inter-System Comm</td>
                    <td className="p-3.5 text-stone-600">Gemini API key exposure in browser client, token leakage</td>
                    <td className="p-3.5 text-emerald-800 font-medium">Zero-hardcoded secrets. Gemini API key is solely accessed server-side in Express proxy via Secret Manager / environment injection.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Firestore Security Rules */}
          <div>
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>2. Active Firestore Security Rules (<code className="text-stone-700 font-mono">firestore.rules</code>)</span>
            </h3>
            <pre className="p-4 rounded-2xl bg-stone-900 font-mono text-[11px] text-emerald-400 overflow-x-auto shadow-2xs">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
            </pre>
          </div>

          {/* Production Secret Manager Setup */}
          <div>
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-amber-700" />
              <span>3. Secret Manager Setup (Google Cloud Run)</span>
            </h3>
            <pre className="p-4 rounded-2xl bg-stone-900 font-mono text-[11px] text-stone-200 overflow-x-auto shadow-2xs">
{`# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \\
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \\
  --role="roles/secretmanager.secretAccessor"`}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-[#FAF8F5] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
