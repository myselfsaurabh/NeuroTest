// tests/amazon-search.test.js
const { runTask } = require('../src/index');
require('dotenv').config();

// Verify API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OpenAI API key is not set. Please set OPENAI_API_KEY in .env file");
  process.exit(1);
}

/**
 * This test demonstrates how to use the LLM-powered automation
 * to perform a search on Amazon and verify the results.
 */
async function runAmazonSearchTest() {
  console.log("\n📱 RUNNING TEST: Amazon iPhone Search");
  console.log("=====================================");
  
  const taskDescription = "Open a browser, navigate to https://www.ebay.ca/ then search for 'iPhone'.then validate current iphone price";
  
  try {
    await runTask(taskDescription);
    console.log("\n🎉 Test execution complete!");
  } catch (error) {
    console.error("\n💥 Test failed:", error.message);
    process.exit(1);
  }
}

// Execute the test
runAmazonSearchTest();