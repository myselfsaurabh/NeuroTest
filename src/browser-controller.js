// src/browser-controller.js
const { chromium } = require('playwright');
const { askLLM } = require('./llm-service');
require('dotenv').config();

/**
 * Execute a single action in the browser based on LLM instructions
 * @param {Page} page - Playwright page object
 * @param {Object} action - Action details from LLM
 * @returns {Object|void} - Verification result if action is 'verify'
 */
async function executeAction(page, action) {
  console.log(`\n🔄 Executing action: ${action.type}`);
  
  try {
    switch(action.type) {
      case 'navigate':
        console.log(`  📄 Navigating to: ${action.url}`);
        await page.goto(action.url, { waitUntil: 'networkidle' });
        break;
      
      case 'click':
        console.log(`  🖱️ Clicking on: ${action.selector}`);
        await page.waitForSelector(action.selector, { state: 'visible', timeout: 10000 });
        await page.click(action.selector);
        break;
      
      case 'type':
        console.log(`  ⌨️ Typing "${action.text}" into: ${action.selector}`);
        await page.waitForSelector(action.selector, { state: 'visible', timeout: 10000 });
        await page.fill(action.selector, action.text);
        break;
      
      case 'press':
        console.log(`  🔤 Pressing ${action.key} on: ${action.selector}`);
        await page.waitForSelector(action.selector, { state: 'visible', timeout: 10000 });
        await page.press(action.selector, action.key);
        break;
      
      case 'verify':
        console.log(`  🔍 Verifying if "${action.expected}" is present`);
        // Wait a moment for page to fully load
        await page.waitForLoadState('networkidle');
        
        // Extract relevant page information for verification
        const url = page.url();
        const title = await page.title();
        const content = await page.content();
        
        // Check if selector is provided
        let elements = [];
        if (action.selector) {
          // Get text from all matching elements
          elements = await page.$$eval(action.selector, els => 
            els.map(el => ({ 
              text: el.textContent.trim(),
              isVisible: el.offsetWidth > 0 && el.offsetHeight > 0 
            }))
          );
        }
        
        // Ask LLM to verify if the expected result is present
        const verificationPrompt = `
          Task: Verify if "${action.expected}" is present in the search results.
          Current URL: ${url}
          Page title: ${title}
          Page content snippet: ${content.substring(0, 2000)}...
          Found elements: ${JSON.stringify(elements)}
          
          Is the search successful? Respond with a JSON object:
          {
            "success": boolean,
            "explanation": "detailed explanation of why the verification succeeded or failed"
          }
        `;
        
        const verification = await askLLM(verificationPrompt);
        console.log(`  ${verification.success ? '✅' : '❌'} Verification result: ${verification.explanation}`);
        return verification;
        
      case 'wait':
        const waitTime = action.time || 1000;
        console.log(`  ⏱️ Waiting for ${waitTime}ms`);
        await page.waitForTimeout(waitTime);
        break;
        
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  } catch (error) {
    console.error(`❌ Error executing action ${action.type}:`, error.message);
    // Take screenshot on failure
    await page.screenshot({ path: `error-${Date.now()}.png` });
    throw error;
  }
}

/**
 * Main function to run the automation sequence
 * @param {string} task - High-level description of the task
 * @returns {Promise<void>}
 */
async function runAutomation(task) {
  console.log("\n🚀 Starting automation task:", task);
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: process.env.HEADLESS === 'true',
    slowMo: parseInt(process.env.SLOW_MO || '0')
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    let currentState = {
      task,
      currentStep: "initial",
      completed: false,
      attempts: 0
    };
    
    // Main automation loop
    while (!currentState.completed && currentState.attempts < 10) {
      currentState.attempts++;
      
      // Capture current page state
      const url = page.url();
      const title = await page.title();
      let content = '';
      
      try {
        content = await page.content();
        // Take screenshot for debugging
        await page.screenshot({ path: `step-${currentState.attempts}.png` });
      } catch (e) {
        content = 'Error capturing page content';
        console.error("Error capturing page state:", e.message);
      }
      
      // Ask LLM what to do next
      const prompt = `
        Current task: ${currentState.task}
        Current URL: ${url || 'No URL yet (browser just launched)'}
        Page title: ${title || 'No title yet'}
        Current step: ${currentState.currentStep}
        Attempt: ${currentState.attempts} of 10
        
        Page content snippet: ${content.substring(0, 3000)}...
        
        What should be the next action to complete the task? 
        Respond with a JSON object containing:
        {
          "type": "navigate|click|type|press|verify|wait",
          "completed": boolean,
          "nextStep": "description of the next step",
          ... action-specific parameters ...
        }
        
        For example:
        - For navigation: { "type": "navigate", "url": "https://example.com" }
        - For clicking: { "type": "click", "selector": "#search-button" }
        - For typing: { "type": "type", "selector": "#search-box", "text": "search term" }
        - For key press: { "type": "press", "selector": "#search-box", "key": "Enter" }
        - For verification: { "type": "verify", "selector": ".search-results", "expected": "iPhone" }
        - For waiting: { "type": "wait", "time": 2000 }
      `;
      
      const nextAction = await askLLM(prompt);
      
      if (nextAction.type === 'verify') {
        const verification = await executeAction(page, nextAction);
        
        // Update state based on verification
        currentState = {
          task,
          currentStep: nextAction.nextStep || "verification complete",
          completed: nextAction.completed || verification.success,
          attempts: currentState.attempts
        };
      } else {
        await executeAction(page, nextAction);
        
        // Update state
        currentState = {
          task,
          currentStep: nextAction.nextStep || currentState.currentStep,
          completed: nextAction.completed || false,
          attempts: currentState.attempts
        };
      }
      
      // Brief pause to allow page to update
      await page.waitForTimeout(1000);
    }
    
    if (currentState.completed) {
      console.log("\n✅ Task completed successfully!");
    } else {
      console.log("\n⚠️ Maximum attempts reached without completing the task");
    }
    
  } catch (error) {
    console.error("\n❌ Error during automation:", error.message);
  } finally {
    await page.screenshot({ path: 'final-state.png' });
    console.log("\n🔚 Closing browser");
    await browser.close();
  }
}

module.exports = {
  runAutomation,
  executeAction
};