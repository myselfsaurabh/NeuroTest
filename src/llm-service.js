// src/llm-service.js
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// Configure OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Communicates with the LLM to determine the next action based on current page state
 * @param {string} prompt - The prompt describing the current state and task
 * @returns {Object} - JSON response with action details
 */
async function askLLM(prompt) {
  try {
    console.log("\n🤖 Asking LLM for next action...");
    
    const response = await openai.createChatCompletion({
      model: "gpt-4", // You can use "gpt-3.5-turbo" for faster, less expensive responses
      messages: [
        { 
          role: "system", 
          content: "You are a browser automation assistant. Given the current state of a webpage, determine the next step to complete the user's task. Respond in JSON format with action and parameters."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.2, // Lower temperature for more deterministic responses
    });
    
    const result = JSON.parse(response.data.choices[0].message.content);
    console.log("✅ LLM suggested action:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("❌ Error communicating with LLM:", error.message);
    if (error.response) {
      console.error(error.response.data);
    }
    throw error;
  }
}

module.exports = {
  askLLM
};