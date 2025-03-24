# Setting Up Microsoft Playwright MCP for Browser Automation

This guide will help you set up and integrate Microsoft's Playwright MCP (Machine Comprehension of Programs) with your existing browser automation framework.

## What is Playwright MCP?

Microsoft Playwright MCP is a powerful library that enables natural language control of web browsers. It uses machine learning to understand and execute natural language commands by translating them into browser actions. This makes it perfect for browser automation tasks.

## Prerequisites

- Node.js and npm installed
- Existing Playwright setup
- Your local Gemma 3 model already set up

## Step 1: Install Playwright MCP

You have two options for installing MCP:

### Option A: Install via npm (recommended)

```bash
npm install @microsoft/playwright-mcp
```

### Option B: Clone the GitHub repository

If you prefer to use the source code directly:

```bash
# Clone the repo
git clone https://github.com/microsoft/playwright-mcp.git

# Install dependencies within the cloned repo
cd playwright-mcp
npm install
```

If you use Option B, you'll need to set the `MCP_PATH` environment variable in your `.env` file to point to the cloned repository location.

## Step 2: Update Your Environment Variables

Add the following to your `.env` file:

```bash
# MCP Configuration
MCP_PATH=/path/to/playwright-mcp  # Only needed if you cloned the repo instead of npm install

# Local Gemma model URL
LOCAL_MODEL_URL=http://localhost:11434/v1/chat/completions

# Browser configuration
HEADLESS=false
SLOW_MO=300
```

## Step 3: Verify Your Installation

You can verify your MCP installation by running a simple test:

```javascript
// test-mcp.js
const { chromium } = require('playwright');
const mcp = require('@microsoft/playwright-mcp');

async function testMCP() {
  console.log("Testing MCP installation...");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await mcp.initialize(page);
    await page.goto('https://www.google.com');
    console.log("Executing MCP command: 'search for playwright'");
    await mcp.exec(page, "search for playwright");
    await page.waitForTimeout(3000);
    console.log("MCP is working correctly!");
  } catch (error) {
    console.error("Error testing MCP:", error);
  } finally {
    await browser.close();
  }
}

testMCP();
```

Run it with:
```bash
node test-mcp.js
```

## Step 4: Run the Integrated Test

Now you can run the integrated test that combines MCP with your local Gemma model:

```bash
node tests/mcp-amazon-search.test.js
```

## How MCP Works with Gemma

Our implementation combines the strengths of both technologies:

1. **Gemma (LLM)**: Makes high-level decisions about what tasks to perform next based on the current state of the page and the overall goal.

2. **MCP**: Handles the complex task of understanding web page structure and executing natural language commands by translating them into precise browser actions.

This approach solves several problems:

- **Reliability**: MCP is more reliable at interacting with web elements than traditional selectors
- **Adaptability**: MCP can adapt to changes in website structure
- **Simplicity**: Tasks can be described in natural language

## Troubleshooting

### Common Issues

1. **Module not found error for @microsoft/playwright-mcp**:
   - Ensure you've installed MCP either via npm or by cloning the repo
   - If you cloned the repo, make sure MCP_PATH is set correctly in your .env file

2. **MCP execution errors**:
   - Try using more specific natural language commands
   - Break complex tasks into simpler steps
   - Add appropriate waiting times between steps

3. **Permission issues**:
   - Some sites may block automation. Try using a different user agent or browser configuration.

### Improving MCP Performance

- Use simple, clear language for commands
- Be specific about what elements to interact with
- Include context in your commands when needed
- For complex workflows, break tasks into smaller steps

## Further Resources

- [Playwright MCP GitHub Repository](https://github.com/microsoft/playwright-mcp)
- [Playwright Documentation](https://playwright.dev/docs/intro)