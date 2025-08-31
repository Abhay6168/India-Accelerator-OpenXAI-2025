#!/bin/bash

# AI Quiz Learning Platform - Setup Script
echo "🎯 AI Quiz Learning Platform Setup"
echo "=================================="

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Please install it first:"
    echo "   Visit: https://ollama.com/download"
    exit 1
fi

echo "✅ Ollama found"

# Check if Ollama service is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "⚠️  Ollama service is not running. Starting it..."
    ollama serve &
    sleep 3
fi

echo "✅ Ollama service is running"

# Read the configured model
MODEL=$(cat ../ollama-model.txt 2>/dev/null || echo "llama3")
echo "📦 Configured model: $MODEL"

# Check if model is available
if ! ollama list | grep -q "$MODEL"; then
    echo "📥 Pulling model: $MODEL (this may take a while...)"
    ollama pull "$MODEL"
else
    echo "✅ Model $MODEL is available"
fi

echo ""
echo "🚀 Setup complete! You can now:"
echo "   1. Run 'npm run dev' to start the development server"
echo "   2. Open http://localhost:3000 in your browser"
echo "   3. Start creating personalized quizzes!"
echo ""
echo "💡 Tips:"
echo "   - Try different topics: JavaScript, Python, Math, Science"
echo "   - Enable adaptive difficulty for personalized learning"
echo "   - Use the AI chat for additional learning support"
