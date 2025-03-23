// src/gemma-llm-service.js
const axios = require('axios');
require('dotenv').config();

// Configuration for local Gemma 3 server
const LOCAL_MODEL_URL = process.env.LOCAL_MODEL_URL || 'http://localhost:8000/v1/chat/completions';

/**
 * Communicates with a locally running Gemma 3 model to determine the next browser action
 * @param {string} prompt - The prompt describing the current state and task
 * @returns {Object} - JSON response with action details
 */
async function askLocalLLM(prompt) {
  try {
    console.log("\n🤖 Asking local Gemma 3 model for next action...");
    
    // Construct the payload for the local model server
    // This format works with LM Studio, Ollama, and similar local inference servers
    const payload = {
      model: "gemma3:12b", // Model identifier used by your local server
      messages: [
        { 
          role: "system", 
          content: "You are a browser automation assistant. Given the current state of a webpage, determine the next step to complete the user's task. Respond in JSON format with action and parameters."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1024
    };

    // Make a request to the local model server
    const response = await axios.post(LOCAL_MODEL_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout for local inference
    });

    // Extract the model's response - adapt this based on your local server's response format
    let modelResponse;
    
    if (response.data.choices && response.data.choices[0].message) {
      // Standard format similar to OpenAI API
      modelResponse = response.data.choices[0].message.content;
    } else if (response.data.response) {
      // Alternative format used by some local servers
      modelResponse = response.data.response;
    } else {
      throw new Error("Unexpected response format from local model server");
    }

    // Ensure we have a valid JSON response
    let result;
    try {
      // Extract JSON from the response (handling cases where the model might add extra text)
      const jsonMatch = modelResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse JSON from model response:", modelResponse);
      throw parseError;
    }

    console.log("✅ Gemma 3 suggested action:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("❌ Error communicating with local Gemma 3 model:", error.message);
    if (error.response) {
      console.error("Server response:", error.response.data);
    }
    
    // Fallback action in case of error
    console.log("⚠️ Using fallback action due to model error");
    return {
      type: "navigate",
      url: "https://www.amazon.com",
      completed: false,
      nextStep: "fallback navigation due to model error"
    };
  }
}

module.exports = {
  askLocalLLM
};