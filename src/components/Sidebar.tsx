"use client";

import { useRef } from "react";
import { Upload, X, FileText, File as FileIcon, FileSpreadsheet } from "lucide-react";

const topics = [
  { name: "Supervised Learning", icon: "📈" },
  { name: "Deep Learning", icon: "🧠" },
  { name: "NLP & Transformers", icon: "💬" },
  { name: "Computer Vision", icon: "👁️" },
  { name: "Model Evaluation", icon: "📊" },
  { name: "MLOps", icon: "⚙️" },
];

interface SidebarProps {
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export function Sidebar({ uploadedFiles, setUploadedFiles }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files as FileList);
      setUploadedFiles(prev => {
        const combined = [...prev, ...newFiles];
        // Enforce 5 files limit
        if (combined.length > 5) {
          alert("You can upload a maximum of 5 files.");
          return combined.slice(0, 5);
        }
        return combined;
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(0) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileIcon className="w-5 h-5 text-rose-500 shrink-0" />;
    if (ext === 'csv' || ext === 'xlsx') return <FileSpreadsheet className="w-5 h-5 text-green-500 shrink-0" />;
    return <FileText className="w-5 h-5 text-blue-500 shrink-0" />;
  };

  const getFileExt = (file: File) => {
    return file.name.split('.').pop()?.toUpperCase() || "DOC";
  };

  return (
    <aside className="w-full lg:w-[280px] flex flex-col gap-6 shrink-0 h-[calc(100vh-120px)] lg:h-auto min-h-0">
      <div className="flex flex-col flex-1 gap-6 overflow-y-auto hide-scrollbar pb-2">
        {/* ML Topics */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col gap-4 transition-colors shrink-0">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">ML Topics</h2>
          
          <div className="flex flex-col gap-2">
            {topics.map((topic) => (
              <button
                key={topic.name}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-all text-left group w-full"
              >
                <span className="text-xl group-hover:scale-110 transition-transform bg-white dark:bg-slate-700 p-1 rounded-lg shadow-sm">{topic.icon}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-tight">{topic.name}</span>
              </button>
            ))}
          </div>
          
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">
            Specialized in machine learning theory, models, training, and deployment.
          </p>
        </div>

        {/* Reference Docs */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col gap-4 transition-colors shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Reference Docs</h2>
            <span className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {uploadedFiles.length}/5
            </span>
          </div>
          
          {uploadedFiles.length > 0 && (
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-start justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-3 text-xs transition-colors group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600">
                      {getFileIcon(file)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-slate-700 dark:text-slate-200 font-semibold">{file.name}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
                        {getFileExt(file)} • {formatSize(file.size)}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(i)} 
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-md transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf,.txt,.csv,.docx,.pptx"
          />
          <button 
            onClick={() => {
              if (uploadedFiles.length >= 5) {
                alert("Maximum of 5 files reached. Please remove a file first.");
              } else {
                fileInputRef.current?.click();
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload PDF / Text
          </button>
          
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed text-center">
            Uploaded text is sent with each question so answers cite your sources.
          </p>
        </div>
      </div>

    </aside>
  );
}
