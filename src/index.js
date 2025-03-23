// src/index.js
const { runAutomation } = require('./browser-controller');

/**
 * Main entry point for running automation tasks
 * @param {string} taskDescription - Human-readable description of the task
 * @returns {Promise<void>}
 */
async function runTask(taskDescription) {
  try {
    await runAutomation(taskDescription);
  } catch (error) {
    console.error("Failed to run automation task:", error);
    process.exit(1);
  }
}

module.exports = {
  runTask
};