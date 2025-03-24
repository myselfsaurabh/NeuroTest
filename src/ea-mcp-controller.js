// src/ea-mcp-controller.js
const { chromium } = require('playwright');
const { askLocalLLM } = require('./gemma-llm-service');
require('dotenv').config();

/**
 * Creates a browser instance for use with ExecuteAutomation MCP Server
 * @returns {Promise<{browser: Browser, page: Page}>} Browser and page objects
 */
async function createBrowser() {
  console.log("\n🚀 Creating browser for EA MCP...");
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: process.env.HEADLESS === 'true',
    slowMo: parseInt(process.env.SLOW_MO || '0')
  });
  
  // Create context
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
  });
  
  // Create page
  const page = await context.newPage();
  
  console.log("✅ Browser created");
  return { browser, page };
}

/**
 * Executes a natural language command by making a request to the MCP Server
 * @param {Object} page - Playwright page object
 * @param {string} command - Natural language command to execute
 * @returns {Promise<boolean>} Success or failure
 */
async function executeCommand(page, command) {
  console.log(`\n🔄 Executing command: "${command}"`);
  
  try {
    // Get the current page URL
    const url = page.url();
    
    // Extract command type (navigate, click, type, etc.)
    let commandType = 'general';
    if (command.toLowerCase().includes('navigate') || command.toLowerCase().includes('go to')) {
      commandType = 'navigate';
    } else if (command.toLowerCase().includes('click')) {
      commandType = 'click';
    } else if (command.toLowerCase().includes('type') || command.toLowerCase().includes('enter')) {
      commandType = 'type';
    } else if (command.toLowerCase().includes('verify') || command.toLowerCase().includes('check')) {
      commandType = 'verify';
    }
    
    // Handle each command type
    switch (commandType) {
      case 'navigate':
        // Extract URL from command
        const urlMatch = command.match(/(?:navigate to|go to|open|visit)\s+(?:the\s+)?(?:website\s+)?(?:at\s+)?(?:URL\s+)?(?:https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i);
        
        if (urlMatch) {
          const targetUrl = urlMatch[1].startsWith('http') ? urlMatch[1] : `https://${urlMatch[1]}`;
          console.log(`  📄 Navigating to: ${targetUrl}`);
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('networkidle').catch(() => {});
        } else {
          console.error('  ❌ Could not extract URL from command');
          return false;
        }
        break;
        
      case 'click':
        // Extract what to click from command
        const clickTarget = command.replace(/click(?: on)?/i, '').trim();
        console.log(`  🖱️ Clicking on: "${clickTarget}"`);
        
        // Try to find the element by various attributes
        const clickSelectors = [
          `text=${clickTarget}`,
          `[aria-label*="${clickTarget}" i]`,
          `[placeholder*="${clickTarget}" i]`,
          `[alt*="${clickTarget}" i]`,
          `[title*="${clickTarget}" i]`,
          `button:has-text("${clickTarget}")`,
          `a:has-text("${clickTarget}")`,
          `input[type="submit"][value*="${clickTarget}" i]`
        ];
        
        let clicked = false;
        for (const selector of clickSelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              await element.click();
              clicked = true;
              console.log(`  ✅ Clicked using selector: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (!clicked) {
          console.error(`  ❌ Could not find element to click: "${clickTarget}"`);
          return false;
        }
        break;
        
      case 'type':
        // Extract what to type and where
        const typeMatch = command.match(/(?:type|enter|input|put)\s+(?:the\s+)?(?:text\s+)?['"]([^'"]+)['"]\s+(?:in(?:to)?|on)\s+(?:the\s+)?(.+?)(?:\s|$)/i);
        
        if (typeMatch) {
          const textToType = typeMatch[1];
          const typeTarget = typeMatch[2].trim();
          
          console.log(`  ⌨️ Typing "${textToType}" into "${typeTarget}"`);
          
          // Try to find the input by various attributes
          const inputSelectors = [
            `[placeholder*="${typeTarget}" i]`,
            `[aria-label*="${typeTarget}" i]`,
            `[name*="${typeTarget}" i]`,
            `input[id*="${typeTarget}" i]`,
            `textarea[id*="${typeTarget}" i]`,
            `label:has-text("${typeTarget}") + input`,
            `label:has-text("${typeTarget}") input`
          ];
          
          let typed = false;
          for (const selector of inputSelectors) {
            try {
              const element = await page.$(selector);
              if (element) {
                await element.fill(textToType);
                typed = true;
                console.log(`  ✅ Typed using selector: ${selector}`);
                break;
              }
            } catch (e) {
              // Continue to next selector
            }
          }
          
          // If selector approach failed, try to find any input field
          if (!typed) {
            const inputs = await page.$$('input:not([type="hidden"]), textarea');
            if (inputs.length > 0) {
              await inputs[0].fill(textToType);
              typed = true;
              console.log(`  ✅ Typed into first available input field`);
            }
          }
          
          if (!typed) {
            console.error(`  ❌ Could not find input field for: "${typeTarget}"`);
            return false;
          }
        } else {
          console.error('  ❌ Could not parse type command');
          return false;
        }
        break;
        
      case 'verify':
        // Extract what to verify
        const verifyMatch = command.match(/(?:verify|check|confirm)(?:\s+(?:that|if))?\s+(.+?)(?:\s|$)/i);
        
        if (verifyMatch) {
          const verifyTarget = verifyMatch[1].trim();
          console.log(`  🔍 Verifying: "${verifyTarget}"`);
          
          // Get page content
          const content = await page.content();
          const bodyText = await page.$eval('body', el => el.innerText).catch(() => '');
          
          // Use LLM to verify if the target is present
          const verificationPrompt = `
            Task: Verify if "${verifyTarget}" is present on the page.
            
            Page URL: ${page.url()}
            Page title: ${await page.title()}
            Page text content: ${bodyText.substring(0, 1500)}
            
            Is the verification successful? Respond with a JSON object:
            {
              "success": boolean,
              "explanation": "detailed explanation of why the verification succeeded or failed"
            }
          `;
          
          const verification = await askLocalLLM(verificationPrompt);
          console.log(`  ${verification.success ? '✅' : '❌'} Verification: ${verification.explanation}`);
          
          return verification.success;
        } else {
          console.error('  ❌ Could not parse verify command');
          return false;
        }
        
      default:
        console.log(`  ⚠️ Using generic approach for command: "${command}"`);
        // For other types of commands, use a best-effort approach
        // This is where the EA MCP Server would normally help interpret commands
        
        // Take screenshot for reference
        await page.screenshot({ path: `command-${Date.now()}.png` });
        return true;
    }
    
    // Wait for any navigation or DOM changes to complete
    await page.waitForTimeout(1000);
    
    return true;
  } catch (error) {
    console.error(`  ❌ Command execution error: ${error.message}`);
    await page.screenshot({ path: `error-${Date.now()}.png` });
    return false;
  }
}

/**
 * Main function to run the automation using EA MCP Server approach
 * @param {string} mainTask - Overall task description
 * @returns {Promise<void>}
 */
async function runEAMCPAutomation(mainTask) {
  console.log("\n🚀 Starting EA MCP Automation");
  console.log(`Task: ${mainTask}`);
  
  let browser, page;
  
  try {
    // Create browser
    ({ browser, page } = await createBrowser());
    
    let currentState = {
      task: mainTask,
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
        const bodyText = await page.$eval('body', el => el.innerText);
        content = bodyText.substring(0, 1000).replace(/\s+/g, ' ');
        await page.screenshot({ path: `step-${currentState.attempts}.png` });
      } catch (e) {
        content = 'Error capturing page content';
      }
      
      // Ask LLM for next step
      const prompt = `
        Task: ${currentState.task}
        Current URL: ${url || 'No URL yet (browser just launched)'}
        Page title: ${title || 'No title yet'}
        Current step: ${currentState.currentStep}
        Attempt: ${currentState.attempts} of 10
        
        Page content snippet: ${content}
        
        What should be the next step to complete the task? 
        I need a specific browser automation command that describes exactly what to do.
        Focus on one step at a time.

        Respond with a JSON object containing:
        {
          "command": "natural language command describing what to do next",
          "completed": boolean,
          "nextStep": "description of what should happen after this step"
        }
        
        Examples:
        {"command":"navigate to amazon.com","completed":false,"nextStep":"search for iPhone"}
        {"command":"click on the search box","completed":false,"nextStep":"type iPhone in search"}
        {"command":"type 'iPhone' in the search box","completed":false,"nextStep":"submit search"}
        {"command":"press Enter","completed":false,"nextStep":"verify results"}
        {"command":"verify that iPhone products appear in search results","completed":true,"nextStep":"task complete"}
      `;
      
      const nextAction = await askLocalLLM(prompt);
      
      if (!nextAction || !nextAction.command) {
        console.error("❌ Invalid action from LLM, trying again");
        continue;
      }
      
      console.log(`\n📋 LLM Step ${currentState.attempts}: ${nextAction.command}`);
      
      // Execute the command
      const success = await executeCommand(page, nextAction.command);
      
      // Update state based on command execution result
      if (success) {
        // For verification commands, we can trust the verification result
        if (nextAction.command.toLowerCase().includes('verify') || 
            nextAction.command.toLowerCase().includes('check') ||
            nextAction.command.toLowerCase().includes('confirm')) {
          currentState.completed = nextAction.completed || success;
        } else {
          // For other commands, use the LLM's completion flag
          currentState.completed = nextAction.completed || false;
        }
        
        // Update current step
        currentState.currentStep = nextAction.nextStep || "continue task";
      } else {
        console.log("⚠️ Step failed, trying next step");
      }
      
      // Brief pause to allow page to update
      await page.waitForTimeout(1500);
    }
    
    if (currentState.completed) {
      console.log("\n✅ Task completed successfully!");
    } else {
      console.log("\n⚠️ Maximum attempts reached without completing the task");
    }
    
  } catch (error) {
    console.error("\n❌ Error during automation:", error.message);
  } finally {
    if (page) await page.screenshot({ path: 'final-state.png' });
    if (browser) {
      console.log("\n🔚 Closing browser");
      await browser.close();
    }
  }
}

module.exports = {
  createBrowser,
  executeCommand,
  runEAMCPAutomation
};