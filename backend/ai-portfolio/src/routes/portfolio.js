const express = require('express');
const router = express.Router();
const { getFeedback } = require('../controllers/portfolioController');
const dbService = require('../services/dbService');

// Root endpoint - 서비스 상태 확인
router.get('/', (req, res) => {
  res.json({ 
    message: 'AI Portfolio API is running!',
    endpoints: {
      feedback: 'POST /',
      recent: 'GET /feedbacks',
      search: 'GET /search',
      stats: 'GET /stats'
    },
    timestamp: new Date().toISOString()
  });
});

// Main feedback endpoint (기존 호환성 유지)
router.post('/', getFeedback);

// Alternative feedback endpoint (새로운 구조)
router.post('/feedback', getFeedback);

// Get recent feedbacks
router.get('/feedbacks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const feedbacks = await dbService.getRecentFeedbacks(limit);
    res.json({ success: true, data: feedbacks });
  } catch (error) {
    console.error('Error getting recent feedbacks:', error);
    res.status(500).json({ error: 'Failed to get feedbacks' });
  }
});

// Get feedback by ID
router.get('/feedbacks/:id', async (req, res) => {
  try {
    const feedback = await dbService.getFeedbackById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error getting feedback by ID:', error);
    res.status(500).json({ error: 'Failed to get feedback' });
  }
});

// Search feedbacks
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const results = await dbService.searchFeedbacks(query);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error searching feedbacks:', error);
    res.status(500).json({ error: 'Failed to search feedbacks' });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = dbService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Clear all data (for testing)
router.delete('/clear', async (req, res) => {
  try {
    dbService.clearData();
    res.json({ success: true, message: 'All data cleared successfully' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

module.exports = router;
