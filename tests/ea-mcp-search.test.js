// tests/ea-mcp-search.test.js
const { runEAMCPAutomation } = require('../src/ea-mcp-controller');
require('dotenv').config();

/**
 * This test demonstrates an approach inspired by ExecuteAutomation MCP Server
 * to perform browser automation tasks using natural language commands.
 */
async function runEAMCPSearchTest() {
  console.log("\n📱 RUNNING TEST: Amazon iPhone Search with EA MCP Approach");
  console.log("=======================================================");
  
  const taskDescription = "Open a browser, navigate to amazon.com, search for 'iPhone' and click on go button , and verify that iPhone products appear in the search results.";
  
  try {
    await runEAMCPAutomation(taskDescription);
    console.log("\n🎉 Test execution complete!");
  } catch (error) {
    console.error("\n💥 Test failed:", error.message);
    process.exit(1);
  }
}

// Execute the test
runEAMCPSearchTest();