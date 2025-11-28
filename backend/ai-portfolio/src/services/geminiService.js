const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPerplexityFeedback } = require('./perplexityService');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getGeminiFeedback = async (prompt) => {
  console.log(`Getting AI feedback from Gemini...`);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const textResponse = response.text();

  // Attempt to extract JSON from markdown code block if present
  const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);
  const stringToParse = jsonMatch ? jsonMatch[1] : textResponse;

  try {
    // Attempt to parse the string as JSON
    return JSON.parse(stringToParse);
  } catch (e) {
    // If parsing fails, try to extract JSON from the text using regex
    console.error("Failed to parse Gemini response as JSON. Raw text:", textResponse);
    
    // Try to find JSON-like structure in the text
    const jsonRegex = /\{[\s\S]*?\}/;
    const jsonMatch = textResponse.match(jsonRegex);
    
    if (jsonMatch) {
      try {
        console.log("Found potential JSON:", jsonMatch[0]);
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        console.error("Failed to parse extracted JSON:", jsonMatch[0]);
      }
    }
    
    // Last resort: try to extract company and job manually from text
    const companyMatch = textResponse.match(/회사[명]?[:\s]*([^\n,]+)/i) || 
                        textResponse.match(/company[:\s]*['"]*([^'"\n,]+)/i);
    const jobMatch = textResponse.match(/직무[명]?[:\s]*([^\n,]+)/i) || 
                    textResponse.match(/job[:\s]*['"]*([^'"\n,]+)/i);
    
    if (companyMatch || jobMatch) {
      return {
        company: companyMatch ? companyMatch[1].trim() : '',
        job: jobMatch ? jobMatch[1].trim() : ''
      };
    }
    
    return {};
  }
};

const getAIFeedback = async (prompt) => {
  try {
    return await getGeminiFeedback(prompt);
  } catch (error) {
    // Check if the error is a 429 (Too Many Requests) from Gemini
    if (error.message && error.message.includes('429 Too Many Requests')) {
      console.warn("Gemini API quota exceeded. Falling back to Perplexity API...");
      try {
        return await getPerplexityFeedback(prompt);
      } catch (perplexityError) {
        console.error("Perplexity API also failed:", perplexityError.message);
        throw new Error("Both Gemini and Perplexity APIs failed to generate feedback.");
      }
    } else {
      // Re-throw other types of errors
      throw error;
    }
  }
};

module.exports = { getAIFeedback };