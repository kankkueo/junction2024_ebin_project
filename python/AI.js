const { OpenAI } = require('openai');

// Load the .env file and path to the file
require('dotenv').config();



// Create an instance of the OpenAI API Client
const client = new OpenAI(process.env["OPENAI_API_KEY"]);
//console.log(process.env["OPENAI_API_KEY"]);

async function processPrompt() {
  const chatCompletion = await client.chat.completions.create({
    messages: [
        { role: "system", content: "You are a sauna expert, but you don't have any knowledge about anything else" },
        { role: "user", content: "Tell me about rooftop sauna and why they are the best saunas." }
    ],
    max_tokens: 500,  // Limit the length of the response
    model: 'gpt-3.5-turbo',
  });
}

