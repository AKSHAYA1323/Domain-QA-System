"use client";

import { useState } from "react";
import { MessageSquare, Code, Database, Lightbulb, Send, ArrowUpRight, BookOpen, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const tabs = [
  { id: "qa", label: "Q&A", icon: MessageSquare },
  { id: "code", label: "Code Gen", icon: Code },
  { id: "datasets", label: "Dataset Suggestion", icon: Database },
  { id: "projects", label: "Projects", icon: Lightbulb },
];

const tabContent = {
  qa: {
    icon: MessageSquare,
    title: "Ask anything about Machine Learning",
    subtitle: "Upload papers or notes to ground answers in your own sources.",
    prompts: [
      "Explain the attention mechanism in transformers.",
      "How does gradient boosting work?",
      "What is the difference between RNN and LSTM?",
      "Explain dropout in deep learning."
    ],
    placeholder: "Ask your machine learning question..."
  },
  code: {
    icon: Code,
    title: "Generate runnable ML code",
    subtitle: "Pick a starter prompt or describe what you need.",
    prompts: [
      "Fine-tune DistilBERT for sentiment classification.",
      "Train a CNN on CIFAR-10 with mixed precision.",
      "Write a PyTorch dataloader for image segmentation.",
      "Optimize a HuggingFace inference script."
    ],
    placeholder: "Describe the ML code you want to generate..."
  },
  datasets: {
    icon: Database,
    title: "Find the right dataset for your task",
    subtitle: "Pick a starter prompt or describe what you need.",
    prompts: [
      "Datasets for medical image segmentation.",
      "Open multilingual instruction-tuning datasets.",
      "Audio classification datasets for wildlife.",
      "Time-series financial data sources."
    ],
    placeholder: "What kind of dataset are you looking for..."
  },
  projects: {
    icon: Lightbulb,
    title: "Portfolio-worthy ML project ideas",
    subtitle: "Pick a starter prompt or describe what you need.",
    prompts: [
      "Portfolio projects for an intermediate NLP learner.",
      "Computer vision projects I can finish in a weekend.",
      "Reinforcement learning environments for beginners.",
      "End-to-end MLOps pipeline examples."
    ],
    placeholder: "Describe your skill level or interest for project ideas..."
  }
};

const features = [
  { icon: <BookOpen className="w-5 h-5 text-indigo-500" />, title: "AI-Powered Answers", desc: "Get accurate, grounded answers using RAG and advanced LLMs." },
  { icon: <Database className="w-5 h-5 text-blue-500" />, title: "Your Knowledge", desc: "Upload documents to personalize and ground responses." },
  { icon: <Code className="w-5 h-5 text-blue-600" />, title: "Code Generation", desc: "Generate, explain and optimize ML code instantly." },
  { icon: <BarChart2 className="w-5 h-5 text-fuchsia-500" />, title: "Datasets & Projects", desc: "Discover datasets and projects tailored to your goals." }
];

interface MainContentProps {
  uploadedFiles: File[];
  onSend?: (prompt: string) => void;
}

export function MainContent({ uploadedFiles, onSend }: MainContentProps) {
  const [activeTab, setActiveTab] = useState("qa");
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const currentInput = inputValue; // Capture current input
    setIsSending(true);
    setResponse(null);
    setInputValue(""); // Clear input immediately

    if (onSend) {
      onSend(currentInput);
    }

    const formData = new FormData();
    formData.append("prompt", currentInput);
    uploadedFiles.forEach(file => {
      formData.append("files", file);
    });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate response");
      }

      setResponse(data.response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setResponse("Error: " + message);
    } finally {
      setIsSending(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setResponse(null);
    setInputValue("");
  };

  const content = tabContent[activeTab as keyof typeof tabContent];
  const Icon = content.icon;

  return (
    <main className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
      {/* Tabs - Now wrapped in a white pill-like container at the top left */}
      <div className="flex mb-4 w-full bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-1.5 shrink-0 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap relative ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicatorMain"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
                  style={{ bottom: "-4px" }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800/80 rounded-2xl flex flex-col shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden transition-colors shrink-0">
        {/* Content Area */}
        <div className="flex flex-col p-6 lg:px-10 lg:pt-10 lg:pb-6 relative overflow-y-auto hide-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-start text-center max-w-4xl mx-auto w-full mt-2"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-500 text-white flex items-center justify-center mb-6 shadow-md shadow-indigo-500/20">
                <Icon className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-3">{content.title}</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-md">{content.subtitle}</p>

              {response ? (
                <div className="w-full text-left bg-slate-50 dark:bg-slate-800/50 p-6 lg:p-8 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm mt-4 transition-colors">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">AI</span>
                    Response
                  </h3>
                  <div className="prose prose-sm md:prose-base prose-indigo dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed overflow-auto max-h-[400px] hide-scrollbar text-left pb-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {response}
                    </ReactMarkdown>
                  </div>
                  <button onClick={() => setResponse(null)} className="text-sm text-indigo-500 mt-6 hover:underline font-medium">Clear response</button>
                </div>
              ) : isSending ? (
                <div className="flex flex-col items-center justify-center mt-12 gap-4">
                  <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">Generating response...</p>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-10">
                  {/* Prompts Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {content.prompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputValue(prompt)}
                        className="px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-left w-full shadow-sm flex items-center justify-between group"
                      >
                        <span className="truncate pr-4">{prompt}</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
                      </button>
                    ))}
                  </div>

                  {/* Feature Cards Grid (only visible if QA tab for accuracy to screenshot, or just show universally) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-4">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex flex-col gap-3 p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 shadow-sm text-left">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                          {feature.icon}
                        </div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{feature.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Input Area - Redesigned */}
        <div className="px-4 pb-4 lg:px-6 lg:pb-6 bg-transparent transition-colors shrink-0 w-full">
          <div className="w-full flex flex-col shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-500 transition-all overflow-hidden">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={content.placeholder}
              className="w-full min-h-[56px] max-h-[200px] px-5 py-3 resize-none bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm md:text-base"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <div className="flex items-center justify-end p-2 pt-0">
              <button
                onClick={handleSend}
                disabled={isSending || !inputValue.trim()}
                className="w-8 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-sm mr-1"
              >
                <Send className="w-3.5 h-3.5 ml-[-1px]" />
              </button>
            </div>
          </div>
          <div className="text-center mt-2">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Press <kbd className="font-sans px-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Enterrrrrrrr</kbd> to send · <kbd className="font-sans px-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Shift+Enter</kbd> for newline
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
