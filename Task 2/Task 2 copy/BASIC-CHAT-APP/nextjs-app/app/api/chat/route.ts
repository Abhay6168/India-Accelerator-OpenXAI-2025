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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Enhanced system prompt for educational assistance
    const systemPrompt = `You are an AI learning assistant integrated into an educational platform. You help users learn various topics through conversation. Be helpful, educational, and encouraging. When discussing topics, provide clear explanations and practical examples. If users ask about quizzes or learning, guide them to use the Quiz Generator feature available in this platform.`;

    const response = await ollama.chat({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: data.message }
      ],
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 1000,
      }
    });
    
    return NextResponse.json({ message: response.message.content });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error.message ?? JSON.stringify(error) },
      { status: 500 }
    );
  }
}
