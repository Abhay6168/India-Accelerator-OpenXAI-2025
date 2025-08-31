## AI Learning Platform - Personalized Quiz Generator

A comprehensive learning platform that combines AI-powered chat assistance with personalized quiz generation. This app creates quizzes tailored to your topic and skill level, with difficulty that adapts based on your answers. Perfect for study, training, or exam prep.

## Features

### 🧠 Personalized Quiz Generator

- **Adaptive Difficulty**: Questions automatically adjust based on your performance
- **Custom Topics**: Generate quizzes on any subject you want to learn
- **Skill Level Matching**: Tailored content for beginner, intermediate, and advanced learners
- **Performance Tracking**: Monitor your progress and identify areas for improvement
- **Detailed Explanations**: Learn from mistakes with comprehensive answer explanations

### 💬 AI Chat Assistant

- **Powered by Ollama**: Get help with questions and explanations
- **Learning Support**: Ask questions about topics you're studying
- **Instant Feedback**: Real-time assistance during your learning journey

### 📊 Learning Analytics

- **Progress Insights**: Track your learning journey with detailed analytics
- **Topic Strengths**: Identify subjects where you excel
- **Focus Areas**: Get recommendations on what to study next
- **Performance History**: Review past quiz results and improvements

## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **AI Backend**: Ollama (local LLM)
- **API**: Next.js API Routes

## Getting Started

### Prerequisites

- Node.js 18+
- Ollama installed and running locally

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd BASIC-CHAT-APP/nextjs-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup Ollama model**

   - Install Ollama from https://ollama.com
   - Pull a model (default is llama3):
     ```bash
     ollama pull llama3
     ```
   - Make sure Ollama is running:
     ```bash
     ollama serve
     ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Creating a Quiz

1. **Setup Your Profile**

   - Enter your name (optional)
   - Select your skill level (beginner/intermediate/advanced)
   - Choose whether to enable adaptive difficulty

2. **Configure Your Quiz**

   - Select from predefined topics or enter a custom topic
   - Choose the number of questions (5-20)
   - Start the quiz

3. **Take the Quiz**

   - Answer multiple-choice questions
   - Get immediate feedback with explanations
   - Watch difficulty adapt based on your performance

4. **Review Results**
   - See your score and performance breakdown
   - Review incorrect answers with explanations
   - Get personalized learning recommendations

### Using AI Chat

- Switch to the AI Chat tab
- Ask questions about any topic
- Get explanations, definitions, and learning help
- Use it alongside quizzes for comprehensive learning

## Features in Detail

### Adaptive Difficulty System

The quiz engine automatically adjusts question difficulty based on your performance:

- ✅ **Correct Answer**: Difficulty increases for next question
- ❌ **Incorrect Answer**: Difficulty decreases to match your level
- 📈 **Continuous Learning**: System learns your optimal challenge level

### Personalized Learning Path

- **Performance Tracking**: Monitor accuracy across different topics
- **Weakness Identification**: System identifies areas needing improvement
- **Strength Recognition**: Celebrate subjects where you excel
- **Smart Recommendations**: Get suggestions for what to study next

### Comprehensive Analytics

- **Overall Performance**: Track your learning journey over time
- **Topic-Specific Insights**: See how you perform in different subjects
- **Progress Visualization**: Watch your improvement with each quiz
- **Learning Streaks**: Build momentum with consistent practice

## API Endpoints

### Quiz Generation

`POST /api/quiz/generate`

- Generates personalized quiz based on topic and user profile

### Adaptive Learning

`POST /api/quiz/adapt`

- Adjusts difficulty based on user performance

### Quiz Completion

`POST /api/quiz/complete`

- Saves results and generates learning recommendations

### AI Chat

`POST /api/chat`

- Handles AI conversation and learning assistance

## Customization

### Adding New Topics

Modify the `predefinedTopics` array in `components/quiz-generator.tsx`:

```typescript
const predefinedTopics = [
  "Your Custom Topic",
  // ... existing topics
];
```

### Changing AI Model

Update the model in `ollama-model.txt` and API routes:

```typescript
const model = "your-preferred-model";
```

### Styling Customization

- Modify `tailwind.config.js` for theme changes
- Update `app/globals.css` for custom styles
- Customize components in `components/` directory

## Deployment

### Local Deployment

```bash
npm run build
npm run start
```

### Production Deployment

1. Ensure Ollama is properly configured in production
2. Set environment variables as needed
3. Deploy using your preferred platform (Vercel, Docker, etc.)

## Learning Best Practices

### For Students

- Start with easier difficulty levels
- Enable adaptive difficulty for optimal challenge
- Review explanations for incorrect answers
- Take quizzes regularly to build knowledge retention
- Use the chat feature to clarify confusing concepts

### For Educators

- Create custom topics for your curriculum
- Monitor student progress through analytics
- Use mixed difficulty levels to assess comprehension
- Combine quizzes with AI chat for comprehensive assessment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:

- Check the troubleshooting section
- Open an issue on GitHub
- Contact the development team

## Roadmap

### Upcoming Features

- 📱 Mobile app version
- 🎯 Spaced repetition system
- 👥 Multiplayer quiz modes
- 📚 Study material integration
- 🏆 Achievement system
- 📊 Advanced analytics dashboard

---

**Happy Learning! 🚀**
