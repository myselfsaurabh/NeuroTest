// tests/gemma-amazon-search.test.js
const { runAutomation } = require('../src/gemma-browser-controller');
require('dotenv').config();

// Verify the model server URL is set
if (!process.env.LOCAL_MODEL_URL) {
  console.log("⚠️ LOCAL_MODEL_URL not set in .env file. Using default http://localhost:8000/v1/chat/completions");
}

/**
 * This test demonstrates how to use a locally running Gemma 3 model
 * to automate a browser task of searching on Amazon.
 */
async function runGemmaAmazonSearchTest() {
  console.log("\n📱 RUNNING TEST: Amazon iPhone Search with Local Gemma 3");
  console.log("=======================================================");
  
  const taskDescription = "Open a browser, navigate to amazon.com, search for 'iPhone', and verify that the search results contain iPhones.";
  
  try {
    await runAutomation(taskDescription);
    console.log("\n🎉 Test execution complete!");
  } catch (error) {
    console.error("\n💥 Test failed:", error.message);
    process.exit(1);
  }
}

// Execute the test
runGemmaAmazonSearchTest();