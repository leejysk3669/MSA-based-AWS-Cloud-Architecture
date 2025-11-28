// In-memory storage for portfolio metadata and feedback history
let portfolioMetadata = [];
let feedbackHistory = [];

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const saveMetadata = async (metadata) => {
  try {
    console.log('Saving metadata to in-memory storage...', metadata);
    const newMetadata = {
      id: generateId(),
      ...metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    portfolioMetadata.push(newMetadata);
    
    // Keep only last 1000 records to prevent memory overflow
    if (portfolioMetadata.length > 1000) {
      portfolioMetadata = portfolioMetadata.slice(-1000);
    }
    
    return { success: true, id: newMetadata.id };
  } catch (error) {
    console.error('Error saving metadata:', error);
    throw new Error('Failed to save metadata');
  }
};

const saveFeedback = async (userId, inputContent, feedbackContent) => {
  try {
    console.log('Saving feedback to in-memory storage...', { userId, inputContent: inputContent.substring(0, 100) + '...' });
    const newFeedback = {
      id: generateId(),
      user_id: userId,
      input_content: inputContent,
      feedback_content: feedbackContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    feedbackHistory.push(newFeedback);
    
    // Keep only last 1000 records to prevent memory overflow
    if (feedbackHistory.length > 1000) {
      feedbackHistory = feedbackHistory.slice(-1000);
    }
    
    return { success: true, id: newFeedback.id };
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw new Error('Failed to save feedback');
  }
};

// Get metadata by ID
const getMetadataById = async (id) => {
  return portfolioMetadata.find(item => item.id === id) || null;
};

// Get feedback by ID
const getFeedbackById = async (id) => {
  return feedbackHistory.find(item => item.id === id) || null;
};

// Get recent feedbacks (last N items)
const getRecentFeedbacks = async (limit = 10) => {
  return feedbackHistory.slice(-limit).reverse();
};

// Get recent metadata (last N items)
const getRecentMetadata = async (limit = 10) => {
  return portfolioMetadata.slice(-limit).reverse();
};

// Search feedbacks by company or job
const searchFeedbacks = async (query) => {
  const searchTerm = query.toLowerCase();
  return feedbackHistory.filter(item => {
    const feedbackStr = JSON.stringify(item.feedback_content).toLowerCase();
    return feedbackStr.includes(searchTerm);
  });
};

// Helper functions for debugging
const getMetadata = () => portfolioMetadata;
const getFeedbackHistory = () => feedbackHistory;
const getStats = () => ({
  metadataCount: portfolioMetadata.length,
  feedbackCount: feedbackHistory.length,
  memoryUsage: process.memoryUsage()
});

const clearData = () => {
  portfolioMetadata = [];
  feedbackHistory = [];
  console.log('In-memory data cleared successfully');
};

module.exports = { 
  saveMetadata, 
  saveFeedback, 
  getMetadataById,
  getFeedbackById,
  getRecentFeedbacks,
  getRecentMetadata,
  searchFeedbacks,
  getMetadata, 
  getFeedbackHistory, 
  getStats,
  clearData 
};