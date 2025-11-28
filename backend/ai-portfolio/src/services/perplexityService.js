const axios = require('axios');

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_ENDPOINT = process.env.PERPLEXITY_API_ENDPOINT;
const PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL;

const getPerplexityFeedback = async (prompt) => {
  if (!PERPLEXITY_API_KEY || !PERPLEXITY_API_ENDPOINT || !PERPLEXITY_MODEL) {
    console.error("Perplexity API credentials are not fully set.");
    throw new Error("Perplexity API credentials are not fully set.");
  }

  console.log("Getting AI feedback from Perplexity...");
  try {
    const response = await axios.post(PERPLEXITY_API_ENDPOINT, {
      model: PERPLEXITY_MODEL,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000, // Adjust as needed
    }, {
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const textResponse = response.data.choices[0].message.content;

    // Attempt to extract JSON from markdown code block if present
    const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);
    const stringToParse = jsonMatch ? jsonMatch[1] : textResponse;

    try {
      // Attempt to parse the string as JSON
      return JSON.parse(stringToParse);
    } catch (e) {
      // If parsing fails, it's likely not a JSON response.
      console.error("Failed to parse Perplexity response as JSON. Raw text:", textResponse);
      return {}; // Return empty object for consistency with Gemini service
    }
  } catch (error) {
    console.error("Error getting feedback from Perplexity:", error.response ? error.response.data : error.message);
    throw error; // Re-throw to be caught by the fallback logic
  }
};

module.exports = { getPerplexityFeedback };
