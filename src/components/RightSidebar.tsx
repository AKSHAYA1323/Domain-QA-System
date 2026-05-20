"use client";

import { History, FileText, MessageSquare, Code, LayoutDashboard, Lightbulb } from "lucide-react";

export interface ChatQuery {
  prompt: string;
  timestamp: Date;
}

interface RightSidebarProps {
  history: ChatQuery[];
}

export function RightSidebar({ history }: RightSidebarProps) {
  return (
    <aside className="w-full lg:w-[280px] flex flex-col gap-6 shrink-0">
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col gap-4 transition-colors">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          Recent Queries
        </h2>

        <div className="flex flex-col gap-3">
          {history.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No recent queries.</p>
          ) : (
            history.slice().reverse().slice(0, 5).map((q, i) => (
              <div key={i} className="flex flex-col gap-1">
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">{q.prompt}</p>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {q.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
          {history.length > 5 && (
            <button className="text-xs text-indigo-500 font-medium hover:underline mt-2 flex justify-center border border-slate-100 dark:border-slate-700/50 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              View all history
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col gap-4 transition-colors">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Quick Stats
        </h2>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Documents Uploaded</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">3</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <MessageSquare className="w-4 h-4 text-green-400" />
              <span>Questions Asked</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{history.length || 27}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Code className="w-4 h-4 text-yellow-500" />
              <span>Code Generated</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">14</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <LayoutDashboard className="w-4 h-4 text-rose-400" />
              <span>Sessions</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">8</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col gap-3 transition-colors">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-indigo-500" />
          Tips
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Upload research papers, lecture notes, or textbooks to get more accurate and personalized answers.
        </p>
      </div>
    </aside>
  );
}
