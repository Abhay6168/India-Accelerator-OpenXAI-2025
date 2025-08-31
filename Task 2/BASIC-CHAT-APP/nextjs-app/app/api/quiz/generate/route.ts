import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";
import { readFileSync } from "fs";
import { join } from "path";

// Read the model from the configuration file
let model = "llama3";
try {
  const modelPath = join(process.cwd(), "..", "ollama-model.txt");
  model = readFileSync(modelPath, "utf8").trim();
} catch (error) {
  console.log("Using default model: llama3");
}

interface QuizRequest {
  topic: string;
  questionCount: number;
  difficulty: string;
  adaptiveDifficulty: boolean;
  userProfile: any;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "easy" | "medium" | "hard";
  explanation: string;
  topic: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: QuizRequest = await request.json();
    
    // Enhanced prompt for better quiz generation
    const systemPrompt = `You are an expert educational content creator specializing in generating high-quality, engaging quiz questions. Your task is to create educational quizzes that are appropriate for the specified difficulty level and topic.

CRITICAL: You must respond with ONLY a valid JSON object. Do not include any other text, explanations, or formatting.`;

    const userPrompt = `Create a ${data.questionCount}-question multiple choice quiz about "${data.topic}" for ${data.difficulty} level learners.

REQUIREMENTS:
1. Each question must have exactly 4 answer options
2. Questions should be practical, relevant, and educational
3. Difficulty distribution:
   - Beginner: 70% easy, 30% medium
   - Intermediate: 40% easy, 40% medium, 20% hard  
   - Advanced: 20% easy, 40% medium, 40% hard
4. Include detailed, educational explanations
5. Cover diverse aspects of ${data.topic}
6. Ensure questions test understanding, not just memorization

RESPONSE FORMAT (JSON only):
{
  "quiz": {
    "id": "quiz_${Date.now()}",
    "topic": "${data.topic}",
    "difficulty": "${data.difficulty}",
    "questions": [
      {
        "id": "q1",
        "question": "Clear, specific question about ${data.topic}?",
        "options": ["Correct answer", "Plausible wrong answer", "Another wrong option", "Obviously wrong option"],
        "correctAnswer": 0,
        "difficulty": "easy",
        "explanation": "Comprehensive explanation covering why the answer is correct and key learning points",
        "topic": "${data.topic}"
      }
    ]
  }
}

Generate ${data.questionCount} questions now:`;

    console.log(`Generating quiz for topic: ${data.topic}, difficulty: ${data.difficulty}, questions: ${data.questionCount}`);

    // Make multiple attempts to get a valid response from Ollama
    let quizData;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !quizData) {
      try {
        attempts++;
        console.log(`Attempt ${attempts} to generate quiz`);

        const response = await ollama.chat({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 4000,
          }
        });

        const content = response.message.content.trim();
        console.log("Raw Ollama response:", content.substring(0, 200) + "...");

        // Try to extract and parse JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          quizData = JSON.parse(jsonStr);
          
          // Validate the structure
          if (validateQuizStructure(quizData, data)) {
            console.log("Successfully generated and validated quiz");
            break;
          } else {
            console.log("Quiz structure validation failed, retrying...");
            quizData = null;
          }
        } else {
          console.log("No valid JSON found in response, retrying...");
        }
      } catch (parseError) {
        console.log(`Parse error on attempt ${attempts}:`, parseError);
        if (attempts === maxAttempts) {
          console.log("Max attempts reached, using fallback quiz");
          quizData = createEnhancedFallbackQuiz(data.topic, data.questionCount, data.difficulty);
        }
      }
    }

    // Final fallback if all attempts failed
    if (!quizData) {
      console.log("All attempts failed, using enhanced fallback quiz");
      quizData = createEnhancedFallbackQuiz(data.topic, data.questionCount, data.difficulty);
    }

    // Ensure quiz structure is correct and enhance if needed
    quizData = enhanceQuizData(quizData, data);

    return NextResponse.json(quizData);
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    
    // Return an enhanced fallback quiz on error
    const fallbackQuiz = createEnhancedFallbackQuiz("General Knowledge", 5, "medium");
    return NextResponse.json(fallbackQuiz);
  }
}

function validateQuizStructure(quizData: any, requestData: QuizRequest): boolean {
  try {
    if (!quizData?.quiz?.questions || !Array.isArray(quizData.quiz.questions)) {
      return false;
    }

    const questions = quizData.quiz.questions;
    if (questions.length !== requestData.questionCount) {
      return false;
    }

    return questions.every((q: any) => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length === 4 &&
      typeof q.correctAnswer === 'number' &&
      q.correctAnswer >= 0 && 
      q.correctAnswer <= 3 &&
      q.explanation &&
      ['easy', 'medium', 'hard'].includes(q.difficulty)
    );
  } catch {
    return false;
  }
}

function enhanceQuizData(quizData: any, requestData: QuizRequest) {
  // Ensure proper structure
  if (!quizData.quiz) {
    quizData = { quiz: quizData };
  }

  // Set metadata
  quizData.quiz.id = quizData.quiz.id || `quiz_${Date.now()}`;
  quizData.quiz.topic = requestData.topic;
  quizData.quiz.difficulty = requestData.difficulty;

  // Enhance questions
  quizData.quiz.questions = quizData.quiz.questions.map((q: any, index: number) => ({
    id: q.id || `q${index + 1}`,
    question: q.question || `Enhanced question ${index + 1} about ${requestData.topic}`,
    options: Array.isArray(q.options) && q.options.length === 4 
      ? q.options 
      : generateOptionsForTopic(requestData.topic, index),
    correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 
      ? q.correctAnswer 
      : 0,
    difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) 
      ? q.difficulty 
      : getDifficultyByIndex(index, quizData.quiz.questions.length, requestData.difficulty),
    explanation: q.explanation || `This is the correct answer because it accurately represents a key concept in ${requestData.topic}. Understanding this helps build foundational knowledge in the subject.`,
    topic: requestData.topic
  }));

  return quizData;
}

function createEnhancedFallbackQuiz(topic: string, questionCount: number, difficulty: string) {
  const questions = [];
  
  for (let i = 1; i <= questionCount; i++) {
    questions.push(createEnhancedSampleQuestion(topic, i, difficulty, questionCount));
  }

  return {
    quiz: {
      id: `quiz_${Date.now()}`,
      topic,
      difficulty,
      questions
    }
  };
}

function createEnhancedSampleQuestion(topic: string, questionNumber: number, baseDifficulty: string, totalQuestions: number): QuizQuestion {
  const difficulty = getDifficultyByIndex(questionNumber - 1, totalQuestions, baseDifficulty);
  
  // Topic-specific question templates
  const topicQuestions = getTopicSpecificQuestions(topic, questionNumber, difficulty);
  
  return {
    id: `q${questionNumber}`,
    question: topicQuestions.question,
    options: topicQuestions.options,
    correctAnswer: 0,
    difficulty: difficulty as "easy" | "medium" | "hard",
    explanation: topicQuestions.explanation,
    topic
  };
}

function getDifficultyByIndex(index: number, total: number, baseDifficulty: string): string {
  const progress = index / total;
  
  switch (baseDifficulty) {
    case "beginner":
      return progress < 0.7 ? "easy" : "medium";
    case "intermediate":
      return progress < 0.4 ? "easy" : progress < 0.8 ? "medium" : "hard";
    case "advanced":
      return progress < 0.2 ? "easy" : progress < 0.6 ? "medium" : "hard";
    default:
      return progress < 0.5 ? "easy" : progress < 0.8 ? "medium" : "hard";
  }
}

function generateOptionsForTopic(topic: string, index: number): string[] {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes("javascript") || topicLower.includes("js")) {
    return [
      "The correct JavaScript concept",
      "An incorrect but plausible option",
      "A common misconception",
      "An obviously wrong choice"
    ];
  } else if (topicLower.includes("python")) {
    return [
      "The correct Python implementation",
      "A syntax error option",
      "Wrong method or function",
      "Completely unrelated code"
    ];
  } else {
    return [
      `Correct answer for ${topic} concept ${index + 1}`,
      `Incorrect but related ${topic} option`,
      `Common ${topic} mistake`,
      `Unrelated option`
    ];
  }
}

function getTopicSpecificQuestions(topic: string, questionNumber: number, difficulty: string) {
  const topicLower = topic.toLowerCase();
  
  // JavaScript questions
  if (topicLower.includes("javascript") || topicLower.includes("js")) {
    return {
      question: `What is the correct way to ${difficulty === 'easy' ? 'declare a variable' : difficulty === 'medium' ? 'handle asynchronous operations' : 'implement complex design patterns'} in JavaScript?`,
      options: [
        difficulty === 'easy' ? "let variableName = value;" : difficulty === 'medium' ? "async/await pattern" : "Observer pattern implementation",
        difficulty === 'easy' ? "variable variableName = value;" : difficulty === 'medium' ? "callback hell approach" : "Incorrect singleton pattern",
        difficulty === 'easy' ? "var variableName;" : difficulty === 'medium' ? "synchronous approach only" : "Wrong factory pattern",
        difficulty === 'easy' ? "define variableName = value;" : difficulty === 'medium' ? "blocking operations" : "Misused decorator pattern"
      ],
      explanation: `In JavaScript, ${difficulty === 'easy' ? 'let and const are the modern ways to declare variables, providing block scope and better error handling' : difficulty === 'medium' ? 'async/await provides cleaner syntax for handling promises and asynchronous operations' : 'proper design pattern implementation requires understanding of JavaScript\'s prototypal inheritance and closure mechanics'}.`
    };
  }
  
  // Python questions
  else if (topicLower.includes("python")) {
    return {
      question: `Which is the best practice for ${difficulty === 'easy' ? 'creating lists' : difficulty === 'medium' ? 'error handling' : 'memory management'} in Python?`,
      options: [
        difficulty === 'easy' ? "my_list = []" : difficulty === 'medium' ? "try-except blocks" : "Context managers and generators",
        difficulty === 'easy' ? "my_list = list()" : difficulty === 'medium' ? "if-else for errors" : "Manual memory allocation",
        difficulty === 'easy' ? "my_list = new list()" : difficulty === 'medium' ? "ignoring exceptions" : "Global variables everywhere",
        difficulty === 'easy' ? "my_list = array()" : difficulty === 'medium' ? "print error messages" : "Memory leaks are acceptable"
      ],
      explanation: `Python best practices emphasize ${difficulty === 'easy' ? 'using [] for list creation as it\'s more readable and slightly faster' : difficulty === 'medium' ? 'proper exception handling with try-except blocks to gracefully handle errors' : 'efficient memory usage through context managers, generators, and understanding Python\'s garbage collection'}.`
    };
  }
  
  // Generic questions for other topics
  else {
    return {
      question: `What is a fundamental concept in ${topic} that every ${difficulty} learner should understand?`,
      options: [
        `Core ${topic} principle that forms the foundation`,
        `Advanced ${topic} concept beyond current level`,
        `Outdated ${topic} practice no longer recommended`,
        `Unrelated concept from different field`
      ],
      explanation: `Understanding fundamental concepts in ${topic} is crucial for building a strong foundation. This particular concept helps learners grasp the core principles and prepares them for more advanced topics in the field.`
    };
  }
}
