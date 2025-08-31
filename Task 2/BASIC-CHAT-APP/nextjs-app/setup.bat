@echo off
REM AI Quiz Learning Platform - Windows Setup Script
echo 🎯 AI Quiz Learning Platform Setup
echo ==================================

REM Check if Ollama is installed
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ollama is not installed. Please install it first:
    echo    Visit: https://ollama.com/download
    pause
    exit /b 1
)

echo ✅ Ollama found

REM Check if Ollama service is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Ollama service is not running. Please start it manually:
    echo    Run 'ollama serve' in another terminal
    pause
)

echo ✅ Ollama service is running

REM Read the configured model
set /p MODEL=<..\ollama-model.txt 2>nul || set MODEL=llama3
echo 📦 Configured model: %MODEL%

REM Check if model is available
ollama list | findstr /C:"%MODEL%" >nul 2>&1
if %errorlevel% neq 0 (
    echo 📥 Pulling model: %MODEL% (this may take a while...)
    ollama pull %MODEL%
) else (
    echo ✅ Model %MODEL% is available
)

echo.
echo 🚀 Setup complete! You can now:
echo    1. Run 'npm run dev' to start the development server
echo    2. Open http://localhost:3000 in your browser
echo    3. Start creating personalized quizzes!
echo.
echo 💡 Tips:
echo    - Try different topics: JavaScript, Python, Math, Science
echo    - Enable adaptive difficulty for personalized learning
echo    - Use the AI chat for additional learning support
pause
