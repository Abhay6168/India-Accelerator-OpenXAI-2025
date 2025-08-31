import { NextRequest, NextResponse } from "next/server";

interface CompleteRequest {
  sessionId: string;
  finalScore: number;
  userProfile: any;
}

export async function POST(request: NextRequest) {
  try {
    const data: CompleteRequest = await request.json();
    
    // In a real application, you would:
    // 1. Save the quiz results to a database
    // 2. Update user profile and learning analytics
    // 3. Generate personalized recommendations
    // 4. Update adaptive learning algorithms
    
    console.log(`Quiz completed - Session: ${data.sessionId}, Score: ${data.finalScore}`);
    console.log("User profile updated:", data.userProfile);

    // Generate learning recommendations based on performance
    const recommendations = generateRecommendations(data.userProfile, data.finalScore);

    return NextResponse.json({ 
      success: true,
      message: "Quiz results saved successfully",
      recommendations
    });
  } catch (error: any) {
    console.error("Quiz completion error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to save quiz results" },
      { status: 500 }
    );
  }
}

function generateRecommendations(userProfile: any, finalScore: number) {
  const recommendations = [];
  
  // Performance-based recommendations
  if (finalScore < 5) {
    recommendations.push("Consider reviewing basic concepts before taking more quizzes");
    recommendations.push("Try starting with easier difficulty levels");
  } else if (finalScore < 8) {
    recommendations.push("Good progress! Try mixing easy and medium difficulty questions");
    recommendations.push("Focus on areas where you scored lower");
  } else {
    recommendations.push("Excellent performance! Ready for harder challenges");
    recommendations.push("Consider exploring advanced topics in this subject");
  }

  // Topic-based recommendations
  if (userProfile.performanceHistory && userProfile.performanceHistory.length > 0) {
    const recentPerformance = userProfile.performanceHistory.slice(-3);
    const avgAccuracy = recentPerformance.reduce((sum: number, perf: any) => sum + perf.accuracy, 0) / recentPerformance.length;
    
    if (avgAccuracy > 80) {
      recommendations.push("Your consistent performance suggests you're ready for more challenging topics");
    } else if (avgAccuracy < 60) {
      recommendations.push("Consider spending more time on fundamental concepts");
    }
  }

  return recommendations;
}
