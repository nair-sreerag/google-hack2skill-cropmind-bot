const { DialogflowCXService } = require('./dialogflowCXService');

/**
 * HTTP Cloud Function for sending messages to Dialogflow CX
 * 
 * Expected request body:
 * {
 *   "message": "Hello, how are you?",
 *   "sessionId": "user123_session", // optional
 *   "languageCode": "en" // optional
 * }
 */
async function sendMessageToAgent(req, res) {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST.'
      });
    }

    // Extract parameters from request body
    const { message, sessionId, languageCode } = req.body;

    // Validate required parameters
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Initialize Dialogflow CX service
    const dialogflowService = new DialogflowCXService();
    
    // Generate session ID if not provided
    const finalSessionId = sessionId || dialogflowService.generateSessionId();
    
    console.log(`Processing message: "${message}" for session: ${finalSessionId}`);

    // Send message to Dialogflow CX
    const response = await dialogflowService.sendMessage(
      message, 
      finalSessionId, 
      languageCode || 'en'
    );

    // Return successful response
    res.status(200).json({
      success: true,
      data: response,
      sessionId: finalSessionId
    });

  } catch (error) {
    console.error('Error in sendMessageToAgent:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to process message with Dialogflow CX'
    });
  }
}

/**
 * Simple GET endpoint for health check
 */
async function healthCheck(req, res) {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const dialogflowService = new DialogflowCXService();
    
    res.status(200).json({
      success: true,
      message: 'Dialogflow CX service is ready',
      projectId: dialogflowService.projectId,
      location: dialogflowService.location,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Service health check failed'
    });
  }
}

module.exports = {
  sendMessageToAgent,
  healthCheck
}; 