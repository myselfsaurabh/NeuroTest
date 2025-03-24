// src/mcp-controller.js
const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const { askLocalLLM } = require('./gemma-llm-service');
require('dotenv').config();

/**
 * Loads the MCP library from node_modules or specified path
 * @returns {Promise<Object>} The loaded MCP module
 */
async function loadMCP() {
  try {
    // First try to load from node_modules
    return require('@microsoft/playwright-mcp');
  } catch (error) {
    console.log("MCP not found in node_modules, attempting to load from specified path...");
    
    const mcpPath = process.env.MCP_PATH || './external/playwright-mcp';
    const absoluteMcpPath = path.resolve(process.cwd(), mcpPath);
    
    try {
      // Check if the directory exists
      await fs.access(absoluteMcpPath);
      
      // Check if the built files exist
      const libPath = path.join(absoluteMcpPath, 'lib');
      await fs.access(libPath);
      
      // Add the path to require.paths
      require.paths.unshift(absoluteMcpPath);
      
      return require('@microsoft/playwright-mcp');
    } catch (pathError) {
      throw new Error(`MCP not found or not built properly at ${absoluteMcpPath}. Please ensure it's installed and built correctly.`);
    }
  }
}

/**
 * Creates a browser instance with MCP enabled
 * @returns {Promise<{browser: Browser, page: Page, mcp: Object}>}
 */
async function createMCPBrowser() {
  console.log("\n🚀 Creating MCP-enabled browser...");
  
  try {
    const mcp = await loadMCP();
    const browser = await chromium.launch({
      headless: process.env.HEADLESS === 'true',
      slowMo: parseInt(process.env.SLOW_MO || '50')
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await mcp.initialize(page);
    
    return { browser, page, mcp };
  } catch (error) {
    console.error("❌ Error creating MCP browser:", error.message);
    throw error;
  }
}

/**
 * Runs browser automation using MCP and LLM
 * @param {string} taskDescription - The task to perform
 */
async function runMCPAutomation(taskDescription) {
  console.log("\n🚀 Starting MCP+LLM Automation");
  console.log("Main Task:", taskDescription);
  
  let browser, page;
  
  try {
    ({ browser, page } = await createMCPBrowser());
    
    // Your existing automation logic here
    
  } catch (error) {
    console.error("\n❌ Error during MCP automation:", error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log("\n🎉 Test execution complete!");
  }
}

module.exports = {
  runMCPAutomation
};
