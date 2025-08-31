import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";

const model = "llama3";

interface AdaptRequest {
  sessionId: string;
  isCorrect: boolean;
  currentDifficulty: string;
  questionIndex: number;
}

export async function POST(request: NextRequest) {
  try {
    const data: AdaptRequest = await request.json();
    
    // Simple adaptive logic
    let newDifficulty = data.currentDifficulty;
    
    if (data.isCorrect) {
      // If user got it right, increase difficulty
      if (data.currentDifficulty === "easy") {
        newDifficulty = "medium";
      } else if (data.currentDifficulty === "medium") {
        newDifficulty = "hard";
      }
    } else {
      // If user got it wrong, decrease difficulty
      if (data.currentDifficulty === "hard") {
        newDifficulty = "medium";
      } else if (data.currentDifficulty === "medium") {
        newDifficulty = "easy";
      }
    }

    // Store the adaptation decision (in a real app, you'd save this to a database)
    console.log(`Adaptive difficulty: ${data.currentDifficulty} -> ${newDifficulty} (Question ${data.questionIndex}, Correct: ${data.isCorrect})`);

    return NextResponse.json({ 
      success: true, 
      newDifficulty,
      message: `Difficulty adapted from ${data.currentDifficulty} to ${newDifficulty}`
    });
  } catch (error: any) {
    console.error("Adaptation error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to adapt difficulty" },
      { status: 500 }
    );
  }
}
