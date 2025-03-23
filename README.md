# LLM-Powered Browser Automation

This project demonstrates browser automation using Large Language Models (LLM) with Playwright. It supports both OpenAI's GPT models and local Gemma models through Ollama.

## Features

- 🤖 LLM-powered browser automation
- 🎭 Built with Playwright
- 🔄 Supports both OpenAI GPT and local Gemma models
- 🌐 Automated web testing capabilities
- 📱 Example tests for e-commerce sites

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Ollama (for local Gemma model)
- OpenAI API key (for GPT models)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd llm-playwright-automation
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables by creating a `.env` file:
```plaintext
# For OpenAI
OPENAI_API_KEY=your_openai_api_key

# For Local Gemma
LOCAL_MODEL_URL=http://localhost:11434/v1/chat/completions

# Browser Configuration
HEADLESS=false
SLOW_MO=50
```

## Setting up Gemma with Ollama

1. Install Ollama from [ollama.ai](https://ollama.ai)

2. Pull and run the Gemma model:
```bash
ollama pull gemma
ollama run gemma
```

## Running Tests

### Using OpenAI GPT
```bash
npm run test:amazon
```

### Using Local Gemma
```bash
npm run test:gemma
```

## Project Structure

```
├── src/
│   ├── browser-controller.js    # Browser automation logic
│   ├── llm-service.js          # OpenAI integration
│   ├── gemma-llm-service.js    # Gemma integration
│   └── index.js                # Main entry point
├── tests/
│   ├── amazon-search.test.js   # OpenAI-based test
│   └── gemma-amazon-search.test.js # Gemma-based test
├── .env                        # Environment variables
└── package.json               
```

## How It Works

1. The system takes a natural language task description
2. LLM (either OpenAI or Gemma) analyzes the task and current browser state
3. LLM determines the next automation action
4. Playwright executes the action in the browser
5. Process repeats until task completion

## Example Tasks

```javascript
// Example task description
const taskDescription = "Open a browser, navigate to amazon.com, search for 'iPhone', and verify that the search results contain iPhones.";
```

## Supported Actions

- 🌐 Navigate to URLs
- 🖱️ Click elements
- ⌨️ Type text
- 🔤 Press keys
- ✅ Verify content
- ⏱️ Wait for elements/time

## Error Handling

- Automatic screenshots on failure
- Fallback actions for LLM errors
- Detailed error logging
- Maximum attempt limits

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Troubleshooting

### Common Issues

1. **LLM Connection Errors**
   - Verify API keys in `.env`
   - Ensure Ollama is running for Gemma tests
   - Check network connectivity

2. **Browser Automation Issues**
   - Increase `SLOW_MO` value in `.env`
   - Check element selectors
   - Verify page load times

3. **Dependencies**
   - Run `npm install` to ensure all packages are up to date
   - Check Node.js version compatibility

### Debug Mode

Set `DEBUG=1` in your `.env` file for additional logging:
```plaintext
DEBUG=1
HEADLESS=false
SLOW_MO=100
```

## Support

For issues and feature requests, please use the GitHub Issues tracker.