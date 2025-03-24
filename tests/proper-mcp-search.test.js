// tests/proper-mcp-search.test.js
const { runMCPAutomation } = require('../src/proper-mcp-controller');
require('dotenv').config();

/**
 * This test demonstrates how to use MCP following the GitHub README
 * to execute browser automation tasks.
 */
async function runProperMCPSearchTest() {
  console.log("\n📱 RUNNING TEST: Amazon iPhone Search with MCP (GitHub README Implementation)");
  console.log("===========================================================================");
  
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
runProperMCPSearchTest();