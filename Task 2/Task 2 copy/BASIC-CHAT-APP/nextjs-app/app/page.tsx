"use client";

import { Chat } from "@/components/chat";
import { QuizGenerator } from "@/components/quiz-generator";
import React, { useState } from "react";

export default function IndexPage() {
  return (
    <div className="app-container">
      <AppSwitcher />
    </div>
  );
}

function AppSwitcher() {
  const [currentApp, setCurrentApp] = useState<"chat" | "quiz">("quiz");

  return (
    <div>
      {/* Navigation Header */}
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-brand">
            <h1 className="nav-title">
              AI Learning Platform
            </h1>
          </div>
          <div className="nav-links">
            <button
              onClick={() => setCurrentApp("quiz")}
              className={`nav-link ${currentApp === "quiz" ? "active" : ""}`}
            >
              Quiz Generator
            </button>
            <button
              onClick={() => setCurrentApp("chat")}
              className={`nav-link ${currentApp === "chat" ? "active" : ""}`}
            >
              AI Chat
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {currentApp === "quiz" ? <QuizGenerator /> : <ChatWrapper />}
      </main>
    </div>
  );
}

function ChatWrapper() {
  return (
    <div className="card container">
      <h2 className="section-title">AI Chat Assistant</h2>
      <div className="chat-container">
        <Chat />
      </div>
    </div>
  );
}
