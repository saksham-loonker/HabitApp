import Cerebras from '@cerebras/cerebras_cloud_sdk';

// Initialize the client
// Note: In Vite, env vars usually need VITE_ prefix. 
// We will check for VITE_CEREBRAS_API_KEY first, then fall back to process.env if available.
const apiKey = import.meta.env.VITE_CEREBRAS_API_KEY || '';

export const cerebrasClient = new Cerebras({
  apiKey: apiKey, 
});

export const runCerebrasInference = async (messages) => {
  if (!apiKey) {
    console.warn("Cerebras API Key is missing. Please set VITE_CEREBRAS_API_KEY in your .env file.");
    // Return a mock response if no key to prevent crash during demo
    return "I'm ready to help, but I need my Neural Link (API Key) connected first. Please check your .env file."; 
  }

  try {
    const completion = await cerebrasClient.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b',
      max_completion_tokens: 2048,
      temperature: 0.2,
      top_p: 1,
      stream: false
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Cerebras Inference Error:", error);
    return "Connection interrupted. My neural pathways are currently unavailable.";
  }
};
