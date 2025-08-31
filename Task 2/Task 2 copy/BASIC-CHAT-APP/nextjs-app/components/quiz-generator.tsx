"use client";

import { useState, useEffect } from "react";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "easy" | "medium" | "hard";
  explanation: string;
  topic: string;
}

interface QuizSession {
  id: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  score: number;
  userAnswers: (number | null)[];
  isCompleted: boolean;
  adaptiveDifficulty: boolean;
}

interface UserProfile {
  name: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  preferredTopics: string[];
  performanceHistory: {
    topic: string;
    accuracy: number;
    averageDifficulty: string;
  }[];
}

const ProgressBar = ({ progress }: { progress: number }) => {
  const progressClass = `progress-${Math.round(progress / 10) * 10}`;
  
  return (
    <div className="progress-container">
      <div className={`progress-bar ${progressClass}`}></div>
    </div>
  );
};

export function QuizGenerator() {
  const [currentView, setCurrentView] = useState<"setup" | "quiz" | "results">("setup");
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    skillLevel: "beginner",
    preferredTopics: [],
    performanceHistory: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(true);
  const [customTopic, setCustomTopic] = useState("");
  const [error, setError] = useState("");

  const predefinedTopics = [
    "JavaScript", "Python", "React", "Node.js", "TypeScript", "HTML/CSS",
    "Data Science", "Machine Learning", "Web Development", "Database",
    "Computer Science", "Mathematics", "Physics", "Chemistry", "Biology",
    "History", "Geography", "Literature", "Philosophy", "Psychology"
  ];

  const generateQuiz = async () => {
    setLoading(true);
    setError("");
    
    const topic = customTopic || selectedTopic;
    if (!topic) {
      setError("Please select or enter a topic");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          questionCount,
          difficulty: userProfile.skillLevel,
          adaptiveDifficulty,
          userProfile
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }

      const data = await response.json();
      setQuizSession({
        ...data.quiz,
        currentQuestionIndex: 0,
        score: 0,
        userAnswers: new Array(data.quiz.questions.length).fill(null),
        isCompleted: false,
        adaptiveDifficulty
      });
      setCurrentView("quiz");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answerIndex: number) => {
    if (!quizSession) return;

    const updatedAnswers = [...quizSession.userAnswers];
    updatedAnswers[quizSession.currentQuestionIndex] = answerIndex;

    const currentQuestion = quizSession.questions[quizSession.currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const newScore = isCorrect ? quizSession.score + 1 : quizSession.score;

    const updatedSession = {
      ...quizSession,
      userAnswers: updatedAnswers,
      score: newScore
    };

    // If adaptive difficulty is enabled, adjust next question difficulty
    if (adaptiveDifficulty && quizSession.currentQuestionIndex < quizSession.questions.length - 1) {
      try {
        await fetch("/api/quiz/adapt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: quizSession.id,
            isCorrect,
            currentDifficulty: currentQuestion.difficulty,
            questionIndex: quizSession.currentQuestionIndex
          }),
        });
      } catch (err) {
        console.error("Failed to adapt difficulty:", err);
      }
    }

    setQuizSession(updatedSession);
  };

  const nextQuestion = () => {
    if (!quizSession) return;

    if (quizSession.currentQuestionIndex < quizSession.questions.length - 1) {
      setQuizSession({
        ...quizSession,
        currentQuestionIndex: quizSession.currentQuestionIndex + 1
      });
    } else {
      // Quiz completed
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    if (!quizSession) return;

    const completedSession = {
      ...quizSession,
      isCompleted: true
    };

    setQuizSession(completedSession);

    // Update user profile with performance data
    const accuracy = (quizSession.score / quizSession.questions.length) * 100;
    const avgDifficulty = calculateAverageDifficulty(quizSession.questions);
    
    const updatedProfile = {
      ...userProfile,
      performanceHistory: [
        ...userProfile.performanceHistory,
        {
          topic: quizSession.topic,
          accuracy,
          averageDifficulty: avgDifficulty
        }
      ]
    };

    setUserProfile(updatedProfile);
    
    try {
      await fetch("/api/quiz/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: quizSession.id,
          finalScore: quizSession.score,
          userProfile: updatedProfile
        }),
      });
    } catch (err) {
      console.error("Failed to save quiz results:", err);
    }

    setCurrentView("results");
  };

  const calculateAverageDifficulty = (questions: QuizQuestion[]): string => {
    const difficultyValues = { easy: 1, medium: 2, hard: 3 };
    const avg = questions.reduce((sum, q) => sum + difficultyValues[q.difficulty], 0) / questions.length;
    
    if (avg <= 1.3) return "easy";
    if (avg <= 2.3) return "medium";
    return "hard";
  };

  const restartQuiz = () => {
    setQuizSession(null);
    setCurrentView("setup");
    setCustomTopic("");
    setSelectedTopic("");
    setError("");
  };

  const getPerformanceInsights = () => {
    if (userProfile.performanceHistory.length === 0) return null;

    const avgAccuracy = userProfile.performanceHistory.reduce((sum, perf) => sum + perf.accuracy, 0) / userProfile.performanceHistory.length;
    const strongTopics = userProfile.performanceHistory.filter(perf => perf.accuracy >= 80).map(perf => perf.topic);
    const weakTopics = userProfile.performanceHistory.filter(perf => perf.accuracy < 60).map(perf => perf.topic);

    return { avgAccuracy, strongTopics, weakTopics };
  };

  if (currentView === "setup") {
    return (
      <div className="card container">
        <h1 className="quiz-title">
          Personalized Quiz Generator
        </h1>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="grid-container">
          {/* User Profile Section */}
          <div className="profile-section">
            <h2 className="section-title">Profile Setup</h2>
            
            <div className="form-group">
              <label className="form-label">
                Your Name (Optional)
              </label>
              <input
                type="text"
                value={userProfile.name}
                onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                className="form-input"
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="skill-level" className="form-label">
                Skill Level
              </label>
              <select
                id="skill-level"
                title="Select your skill level"
                value={userProfile.skillLevel}
                onChange={(e) => setUserProfile({...userProfile, skillLevel: e.target.value as any})}
                className="form-select"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={adaptiveDifficulty}
                  onChange={(e) => setAdaptiveDifficulty(e.target.checked)}
                  className="checkbox"
                />
                <span>
                  Enable Adaptive Difficulty
                </span>
              </label>
              <p className="form-help">
                Difficulty adjusts based on your performance
              </p>
            </div>
          </div>

          {/* Quiz Configuration Section */}
          <div className="config-section">
            <h2 className="section-title">Quiz Configuration</h2>
            
            <div className="form-group">
              <label htmlFor="topic-select" className="form-label">
                Select Topic
              </label>
              <select
                id="topic-select"
                title="Choose a topic for your quiz"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="form-select"
              >
                <option value="">Choose a topic...</option>
                {predefinedTopics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Or Enter Custom Topic
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="form-input"
                placeholder="Enter any topic you want to learn about"
              />
            </div>

            <div className="form-group">
              <label htmlFor="question-count" className="form-label">
                Number of Questions
              </label>
              <select
                id="question-count"
                title="Select number of questions for your quiz"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="form-select"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        {userProfile.performanceHistory.length > 0 && (
          <div className="insights-section">
            <h3 className="insights-title">Your Learning Progress</h3>
            {(() => {
              const insights = getPerformanceInsights();
              return insights ? (
                <div className="insights-grid">
                  <div className="insight-item">
                    <span className="insight-label">Average Accuracy:</span>
                    <div className="insight-value accuracy">
                      {insights.avgAccuracy.toFixed(1)}%
                    </div>
                  </div>
                  <div className="insight-item">
                    <span className="insight-label">Strong Topics:</span>
                    <div className="insight-value strong">
                      {insights.strongTopics.join(", ") || "None yet"}
                    </div>
                  </div>
                  <div className="insight-item">
                    <span className="insight-label">Focus Areas:</span>
                    <div className="insight-value weak">
                      {insights.weakTopics.join(", ") || "None identified"}
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        <button
          onClick={generateQuiz}
          disabled={loading}
          className="btn btn-primary start-quiz-btn"
        >
          {loading ? "Generating Quiz..." : "Start Quiz"}
        </button>
      </div>
    );
  }

  if (currentView === "quiz" && quizSession) {
    const currentQuestion = quizSession.questions[quizSession.currentQuestionIndex];
    const hasAnswered = quizSession.userAnswers[quizSession.currentQuestionIndex] !== null;
    const progressPercentage = ((quizSession.currentQuestionIndex + (hasAnswered ? 1 : 0)) / quizSession.questions.length) * 100;

    return (
      <div className="card container">
        {/* Quiz Header */}
        <div className="quiz-header">
          <div className="quiz-info">
            <h1 className="quiz-title">{quizSession.topic} Quiz</h1>
            <p className="question-info">
              Question {quizSession.currentQuestionIndex + 1} of {quizSession.questions.length}
            </p>
          </div>
          <div className="score-display">
            <div className="score-label">Score</div>
            <div className="score-value">
              {quizSession.score}/{quizSession.currentQuestionIndex + (hasAnswered ? 1 : 0)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar progress={progressPercentage} />

        {/* Question */}
        <div className="question-section">
          <div className="difficulty-badges">
            <span className={`difficulty-badge ${currentQuestion.difficulty}`}>
              {currentQuestion.difficulty.toUpperCase()}
            </span>
            {adaptiveDifficulty && (
              <span className="adaptive-badge">
                ADAPTIVE
              </span>
            )}
          </div>
          
          <h2 className="quiz-question">
            {currentQuestion.question}
          </h2>

          {/* Answer Options */}
          <div className="answer-options">
            {currentQuestion.options.map((option, index) => {
              const isSelected = quizSession.userAnswers[quizSession.currentQuestionIndex] === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showResult = hasAnswered;

              return (
                <button
                  key={index}
                  onClick={() => !hasAnswered && submitAnswer(index)}
                  disabled={hasAnswered}
                  className={`answer-option ${
                    !hasAnswered
                      ? ""
                      : showResult && isCorrect
                      ? "correct"
                      : showResult && isSelected && !isCorrect
                      ? "incorrect"
                      : "disabled"
                  }`}
                >
                  <div className="option-content">
                    <span>{option}</span>
                    {showResult && isCorrect && (
                      <span className="result-indicator correct-indicator">✓ Correct</span>
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <span className="result-indicator incorrect-indicator">✗ Incorrect</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {hasAnswered && (
            <div className="explanation-section">
              <h3 className="explanation-title">Explanation:</h3>
              <p className="explanation-text">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="quiz-navigation">
          <button
            onClick={() => setCurrentView("setup")}
            className="btn btn-secondary back-btn"
          >
            ← Back to Setup
          </button>
          
          {hasAnswered && (
            <button
              onClick={nextQuestion}
              className="btn btn-primary next-btn"
            >
              {quizSession.currentQuestionIndex < quizSession.questions.length - 1
                ? "Next Question →"
                : "Complete Quiz"
              }
            </button>
          )}
        </div>
      </div>
    );
  }

  if (currentView === "results" && quizSession) {
    const accuracy = (quizSession.score / quizSession.questions.length) * 100;
    const insights = getPerformanceInsights();

    return (
      <div className="card container">
        <h1 className="quiz-title">
          Quiz Results
        </h1>

        {/* Overall Score */}
        <div className="results-summary">
          <div className="score-percentage">
            {accuracy.toFixed(1)}%
          </div>
          <div className="score-details">
            {quizSession.score} out of {quizSession.questions.length} correct
          </div>
          <div className="topic-name">
            Topic: {quizSession.topic}
          </div>
        </div>

        {/* Performance Level */}
        <div className="text-center mb-8">
          <div className={`inline-block px-6 py-2 rounded-full font-medium ${
            accuracy >= 90 ? "bg-green-100 text-green-800" :
            accuracy >= 70 ? "bg-blue-100 text-blue-800" :
            accuracy >= 50 ? "bg-yellow-100 text-yellow-800" :
            "bg-red-100 text-red-800"
          }`}>
            {accuracy >= 90 ? "Excellent!" :
             accuracy >= 70 ? "Good Job!" :
             accuracy >= 50 ? "Keep Practicing!" :
             "Needs Improvement"}
          </div>
        </div>

        {/* Question Review */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Question Review</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {quizSession.questions.map((question, index) => {
              const userAnswer = quizSession.userAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <div
                  key={question.id}
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-800">
                      {index + 1}. {question.question}
                    </h3>
                    <span className={`text-sm font-medium ${
                      isCorrect ? "text-green-600" : "text-red-600"
                    }`}>
                      {isCorrect ? "✓" : "✗"}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div>Your answer: {question.options[userAnswer || 0]}</div>
                    {!isCorrect && (
                      <div className="text-green-600">
                        Correct answer: {question.options[question.correctAnswer]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Learning Insights */}
        {insights && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Learning Journey</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {insights.avgAccuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Overall Average</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {insights.strongTopics.length}
                </div>
                <div className="text-sm text-gray-600">Strong Topics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {userProfile.performanceHistory.length}
                </div>
                <div className="text-sm text-gray-600">Quizzes Taken</div>
              </div>
            </div>
            
            {insights.weakTopics.length > 0 && (
              <div className="mt-4 p-3 bg-orange-50 rounded">
                <h3 className="font-medium text-orange-800 mb-1">Recommended Focus Areas:</h3>
                <p className="text-orange-700">{insights.weakTopics.join(", ")}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={restartQuiz}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-md transition duration-200"
          >
            Take Another Quiz
          </button>
          <button
            onClick={() => {
              const sameTopic = selectedTopic || customTopic;
              setSelectedTopic(sameTopic);
              setCustomTopic("");
              restartQuiz();
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-md transition duration-200"
          >
            Practice Same Topic
          </button>
        </div>
      </div>
    );
  }

  return null;
}
