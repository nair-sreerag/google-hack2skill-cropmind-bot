const { SessionsClient } = require("@google-cloud/dialogflow-cx");

class DialogflowCXService {
  constructor() {

    // TODO: CHANGE THESE VALUES - these works for the hackathon

    // Google Cloud Project configuration
    // this.projectId = "hack2skill-hackathon-85db2";
    // this.location = "us-central1"; // Adjust based on your agent location
    // this.agentId = "d2c9e580-7ede-409c-8371-139ee8980a1c"; // Your actual agent ID
    // this.languageCode = "en";
    // this.apiEndpoint = 'us-central1-dialogflow.googleapis.com';



    this.projectId = 'cropmind-89afe';
    this.location = 'asia-south1';
    this.agentId = '244195e6-3766-4120-885b-54716cf417db'
    this.languageCode = 'en'
    this.apiEndpoint = 'asia-south1-dialogflow.googleapis.com'



    
    // Initialize the Dialogflow CX Sessions client
    this.sessionClient = new SessionsClient({
      projectId: this.projectId,
      apiEndpoint: this.apiEndpoint
    });
    
    console.log("✅ DialogflowCX Service initialized");
  }

  /**
   * Send text message to Dialogflow CX and get response
   * @param {string} message - The text message to send
   * @param {string} sessionId - Unique session identifier 
   * @param {string} languageCode - Language code (optional, defaults to 'en')
   * @returns {Object} Response from Dialogflow CX
   */
  async sendMessage(message, sessionId, languageCode = this.languageCode) {
    try {
      console.log(`📤 Sending message to Dialogflow CX: "${message}"`);
      
      // Construct the session path
      const sessionPath = this.sessionClient.projectLocationAgentSessionPath(
        this.projectId,
        this.location,
        this.agentId,
        sessionId
      );

      // Create the request
      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: message,
          },
          languageCode: languageCode,
        },
      };

      console.log(`🔗 Session Path: ${sessionPath}`);

      // Send the request to Dialogflow CX
      const [response] = await this.sessionClient.detectIntent(request);
      
      // Extract and format the response
      const result = this.formatResponse(response);
      
      console.log("📥 Received response from Dialogflow CX");
      return result;

    } catch (error) {
      console.error("❌ Error sending message to Dialogflow CX:", error.message);
      
      // Provide helpful error messages for common issues
      if (error.message.includes('Could not load the default credentials')) {
        console.error(`
🔧 Authentication Setup Required:
1. Download service account key from Google Cloud Console
2. Set environment variable: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
3. Or run: gcloud auth application-default login
        `);
      }
      
      throw new Error(`Failed to send message to Dialogflow CX: ${error.message}`);
    }
  }

  /**
   * Format the Dialogflow CX response into a clean structure
   * @param {Object} response - Raw Dialogflow CX response
   * @returns {Object} Formatted response
   */
  formatResponse(response) {
    const queryResult = response.queryResult;
    
    // Extract response messages
    const messages = [];
    if (queryResult.responseMessages) {
      queryResult.responseMessages.forEach(message => {
        if (message.text && message.text.text) {
          messages.push(...message.text.text);
        }
      });
    }

    // Extract intent information
    const intent = queryResult.intent ? {
      name: queryResult.intent.name,
      displayName: queryResult.intent.displayName,
      confidence: queryResult.intentDetectionConfidence || 0
    } : null;

    // Extract parameters
    const parameters = queryResult.parameters || {};

    // Extract current page information
    const currentPage = queryResult.currentPage ? {
      name: queryResult.currentPage.name,
      displayName: queryResult.currentPage.displayName
    } : null;

    return {
      success: true,
      sessionId: response.responseId,
      messages: messages,
      intent: intent,
      parameters: parameters,
      currentPage: currentPage,
      languageCode: queryResult.languageCode,
      raw: {
        queryText: queryResult.text,
        confidence: queryResult.intentDetectionConfidence
      }
    };
  }

  /**
   * Create a unique session ID
   * @param {string} userId - User identifier (optional)
   * @returns {string} Unique session ID
   */
  generateSessionId(userId = null) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return userId ? `${userId}_${timestamp}` : `session_${timestamp}_${random}`;
  }
}

module.exports = { DialogflowCXService }; 