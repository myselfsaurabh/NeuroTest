// tests/mcp-amazon-search.test.js
const { runMCPAutomation } = require('../src/mcp-controller');
require('dotenv').config();

/**
 * This test demonstrates how to use MCP (Machine Comprehension of Programs) 
 * with a local LLM to execute browser automation tasks.
 * 
 * MCP handles the complex task of understanding and interacting with web elements,
 * while the LLM provides high-level decision making and task planning.
 */
async function runMCPAmazonSearchTest() {
  console.log("\n📱 RUNNING TEST: Amazon iPhone Search with MCP + Local LLM");
  console.log("===========================================================");
  
  const taskDescription = "Open a browser, navigate to amazon.com, search for 'iPhone', and verify that iPhone products appear in the search results.";
  
  try {
    await runMCPAutomation(taskDescription);
    console.log("\n🎉 Test execution complete!");
  } catch (error) {
    console.error("\n💥 Test failed:", error.message);
    process.exit(1);
  }
}

// Execute the test
runMCPAmazonSearchTest();