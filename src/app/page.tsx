"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent";
import { RightSidebar, type ChatQuery } from "@/components/RightSidebar";

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatQuery[]>([]);

  return (
    <>
      <Header />
      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0 w-full justify-center">
        <Sidebar uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />
        <MainContent
          uploadedFiles={uploadedFiles}
          onSend={(prompt) => setChatHistory(prev => [...prev, { prompt, timestamp: new Date() }])}
        />
        <div className="hidden xl:block">
          <RightSidebar history={chatHistory} />
        </div>
      </div>
    </>
  );
}
