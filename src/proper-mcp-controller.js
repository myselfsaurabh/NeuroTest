// src/proper-mcp-controller.js
const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const { askLocalLLM } = require('./gemma-llm-service');
require('dotenv').config();

/**
 * Loads the MCP library following the GitHub README approach
 * @returns {Promise<Object>} The loaded MCP module
 */
async function loadMCP() {
  try {
    // First try to load directly if installed via npm
    return require('@microsoft/playwright-mcp');
  } catch (error) {
    console.log("MCP not found in node_modules, attempting to load from local build...");
    
    // Try several possible locations for local build
    const possiblePaths = [
      // If cloned and built as directed in README
      path.resolve(process.cwd(), 'playwright-mcp'),
      
      // If placed in external/ directory
      path.resolve(process.cwd(), 'external/playwright-mcp'),
      
      // If path specified in .env
      process.env.MCP_PATH ? path.resolve(process.cwd(), process.env.MCP_PATH) : null,
      
      // Absolute path if specified in .env
      process.env.MCP_PATH && process.env.MCP_PATH.startsWith('/') ? process.env.MCP_PATH : null
    ].filter(Boolean); // Remove null entries
    
    // Try each path
    for (const mcpPath of possiblePaths) {
      try {
        // Check if directory exists
        await fs.access(mcpPath);
        console.log(`Found potential MCP at: ${mcpPath}`);
        
        // Try to load as a module
        const mcp = require(mcpPath);
        if (typeof mcp.initialize === 'function' && typeof mcp.exec === 'function') {
          console.log(`Successfully loaded MCP from: ${mcpPath}`);
          return mcp;
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    throw new Error(`MCP not found. Please install it via npm or clone the repository as described in the GitHub README.`);
  }
}

/**
 * Creates a browser instance with MCP enabled following GitHub README
 * @returns {Promise<{browser: Browser, page: Page, mcp: Object}>} Browser, page and MCP instance
 */
async function createMCPBrowser() {
  console.log("\n🚀 Creating MCP-enabled browser...");
  
  try {
    // Load the MCP module
    const mcp = await loadMCP();
    console.log("✅ MCP library loaded successfully");
    
    // Launch browser - no special configuration needed per README
    const browser = await chromium.launch({ 
      headless: process.env.HEADLESS === 'true',
      slowMo: parseInt(process.env.SLOW_MO || '0')
    });
    
    // Create context - no special configuration needed per README
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    // Create page
    const page = await context.newPage();
    
    // Initialize MCP on the page - exactly as shown in README
    await mcp.initialize(page);
    
    console.log("✅ MCP browser created and initialized");
    return { browser, page, mcp };
  } catch (error) {
    console.error("❌ Error creating MCP browser:", error.message);
    throw error;
  }
}

/**
 * Execute an MCP command following the GitHub README example
 * @param {Object} page - Playwright page object
 * @param {Object} mcp - MCP instance
 * @param {string} command - Natural language command to execute
 * @returns {Promise<boolean>} Success or failure
 */
async function executeMCPCommand(page, mcp, command) {
  console.log(`\n🔄 Executing MCP command: "${command}"`);
  
  try {
    // Execute the command exactly as shown in README
    await mcp.exec(page, command);
    
    // Add a small wait for stability
    await page.waitForTimeout(1000);
    
    return true;
  } catch (error) {
    console.error(`❌ MCP command failed: ${error.message}`);
    return false;
  }
}

/**
 * Main function to run the automation with MCP
 * @param {string} mainTask - Overall task description
 * @returns {Promise<void>}
 */
async function runMCPAutomation(mainTask) {
  console.log("\n🚀 Starting MCP Automation");
  console.log(`Task: ${mainTask}`);
  
  let browser, page, mcp;
  
  try {
    // Create MCP browser following GitHub README
    ({ browser, page, mcp } = await createMCPBrowser());
    
    // Break down the task based on typical automation patterns
    const taskParts = [];
    
    // Extract navigation
    if (mainTask.includes('navigate to') || mainTask.includes('go to')) {
      const urlMatch = mainTask.match(/(?:navigate to|go to)\s+(?:the\s+)?(?:website\s+)?(?:at\s+)?(?:https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i);
      if (urlMatch) {
        const url = urlMatch[1].startsWith('http') ? urlMatch[1] : `https://${urlMatch[1]}`;
        taskParts.push(`navigate to ${url}`);
      }
    }
    
    // Extract search
    if (mainTask.includes('search for')) {
      const searchMatch = mainTask.match(/search for ['"]([^'"]+)['"]/i);
      if (searchMatch) {
        taskParts.push(`search for "${searchMatch[1]}"`);
      }
    }
    
    // Extract verification
    if (mainTask.includes('verify')) {
      const verifyMatch = mainTask.match(/verify (?:that|if) (.+?)(?:\.|\s*$)/i);
      if (verifyMatch) {
        taskParts.push(`check if ${verifyMatch[1]}`);
      }
    }
    
    // If no parts extracted, use the whole task
    if (taskParts.length === 0) {
      taskParts.push(mainTask);
    }
    
    // Execute each part of the task
    for (let i = 0; i < taskParts.length; i++) {
      const part = taskParts[i];
      console.log(`\n📋 Step ${i+1}/${taskParts.length}: ${part}`);
      
      // Special case for navigation
      if (part.startsWith('navigate to')) {
        const url = part.replace('navigate to ', '').trim();
        console.log(`  📄 Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => {});
      } else {
        // Use MCP for all other tasks
        await executeMCPCommand(page, mcp, part);
      }
      
      // Take a screenshot after each step
      await page.screenshot({ path: `step-${i+1}.png` });
    }
    
    // Final verification step
    const finalUrl = page.url();
    const pageTitle = await page.title();
    const pageContent = await page.$eval('body', el => el.innerText).catch(() => '');
    
    // Ask LLM to verify if the task was completed
    const verificationPrompt = `
      Task: ${mainTask}
      Current URL: ${finalUrl}
      Page title: ${pageTitle}
      Page content snippet: ${pageContent.substring(0, 1500)}
      
      Was the task completed successfully? Respond with a JSON object:
      {
        "success": boolean,
        "explanation": "detailed explanation of why you think the task succeeded or failed"
      }
    `;
    
    const verification = await askLocalLLM(verificationPrompt);
    console.log(`\n${verification.success ? '✅' : '❌'} Task verification: ${verification.explanation}`);
    
    if (verification.success) {
      console.log("\n✅ Task completed successfully!");
    } else {
      console.log("\n⚠️ Task may not have completed successfully");
    }
    
  } catch (error) {
    console.error("\n❌ Error during MCP automation:", error.message);
  } finally {
    if (page) await page.screenshot({ path: 'final-state.png' });
    if (browser) {
      console.log("\n🔚 Closing browser");
      await browser.close();
    }
  }
}

module.exports = {
  loadMCP,
  createMCPBrowser,
  executeMCPCommand,
  runMCPAutomation
};