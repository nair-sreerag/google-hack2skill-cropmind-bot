# Google Conversational Agent Integration

This project provides a comprehensive solution for sending and getting data from Google's Conversational Agent using **Dialogflow CX**. It includes multiple ways to interact with the agent: direct service calls, HTTP APIs, and batch processing.

## 🚀 Features

- **Dialogflow CX Integration**: Modern conversational AI using Google's latest platform
- **Bidirectional Communication**: Send messages to and receive structured data from the agent
- **Multiple Interface Options**: Direct service calls, HTTP APIs, and batch processing
- **Intent-based Data Retrieval**: Get specific data using predefined intents
- **Structured Data Processing**: Send complex data structures to the agent
- **Conversation History**: Track and manage conversation flows
- **Error Handling**: Robust fallback mechanisms and error management
- **Testing Suite**: Built-in connectivity testing and performance monitoring

## 📋 Prerequisites

1. **Google Cloud Project** with Dialogflow CX enabled
2. **Service Account** with appropriate permissions
3. **Node.js** (v18+ recommended)
4. **Firebase Functions** (for deployment)

## 🛠️ Setup

### 1. Update Dependencies

The project uses Dialogflow CX instead of the legacy Dialogflow ES:

```json
{
  "dependencies": {
    "@google-cloud/dialogflow-cx": "^4.0.0",
    "@google-cloud/aiplatform": "^4.4.0",
    "axios": "^1.10.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "firebase-admin": "^12.6.0",
    "firebase-functions": "^6.0.1"
  }
}
```

### 2. Configure Dialogflow CX

Update the configuration in `src/dialogflowCXService.js`:

```javascript
constructor() {
  this.projectId = "your-project-id";
  this.location = "global"; // or your specific location
  this.agentId = "your-agent-id"; // Replace with your Dialogflow CX agent ID
  this.languageCode = "en";
}
```

### 3. Authentication

Ensure your Google Cloud authentication is properly configured:

- **Local Development**: Use `gcloud auth application-default login`
- **Production**: Use service account keys or workload identity

## 🎯 Usage Examples

### 1. Basic Message Sending

```javascript
const { ConversationManager } = require("./src/conversationManager");

const conversationManager = new ConversationManager();

// Send a message to the conversational agent
const response = await conversationManager.sendToAgent(
  "What's the weather in Mumbai?",
  "user123",
  { source: "web" }
);

console.log("Agent Response:", response.message);
```

### 2. Intent-based Data Retrieval

```javascript
// Get specific data using predefined intents
const weatherData = await conversationManager.getDataFromAgent(
  "weather.check",
  { location: "Delhi" },
  "user123"
);

console.log("Weather Data:", weatherData.extractedData);
```

### 3. Structured Data Sending

```javascript
// Send complex data structures to the agent
const structuredData = {
  location: "Bangalore",
  parameters: ["temperature", "humidity", "conditions"],
  timeframe: "current",
};

const response = await conversationManager.sendStructuredData(
  structuredData,
  "user123",
  "weather_request"
);
```

### 4. HTTP API Usage

```bash
# Send message to agent
curl -X POST http://localhost:5001/your-project/us-central1/api/send-to-agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What'\''s the weather in Mumbai?",
    "userId": "user123",
    "source": "api"
  }'

# Get data with specific intent
curl -X POST http://localhost:5001/your-project/us-central1/api/get-data-from-agent \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "weather.check",
    "parameters": {"location": "Delhi"},
    "userId": "user123"
  }'

# Send structured data
curl -X POST http://localhost:5001/your-project/us-central1/api/send-structured-data \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "location": "Bangalore",
      "parameters": ["temperature", "humidity"]
    },
    "userId": "user123",
    "context": "weather_request"
  }'
```

## 📡 Available Endpoints

### Conversational Agent Endpoints

- **POST** `/send-to-agent` - Send message to Google Conversational Agent
- **POST** `/get-data-from-agent` - Get data with specific intent
- **POST** `/send-structured-data` - Send structured data to agent
- **POST** `/batch-process` - Process multiple messages
- **GET** `/conversation-history/:userId` - Get conversation history
- **POST** `/test-agent` - Test agent connectivity
- **GET** `/agent-stats` - Get agent statistics

### Legacy Endpoints

- **POST** `/bot` - Main Dialogflow ES bot interface
- **POST** `/vertex-bot` - Vertex AI bot interface
- **POST** `/ask-bot` - Web/mobile bot interface

## 🔧 Service Classes

### DialogflowCXService

Main service for interacting with Dialogflow CX:

```javascript
const { DialogflowCXService } = require("./src/dialogflowCXService");

const cxService = new DialogflowCXService();

// Send message directly to CX
const response = await cxService.sendToConversationalAgent(
  "User message",
  "user123",
  "api"
);
```

### ConversationManager

High-level manager for conversation flows:

```javascript
const { ConversationManager } = require("./src/conversationManager");

const manager = new ConversationManager();

// Multiple methods available:
await manager.sendToAgent(message, userId, options);
await manager.getDataFromAgent(intent, parameters, userId);
await manager.sendStructuredData(data, userId, context);
await manager.processBatch(messages, userId);
```

## 🎪 Running Examples

The project includes comprehensive examples in `examples/conversationalAgentExample.js`:

```bash
# Run all examples
node examples/conversationalAgentExample.js

# Or run specific examples programmatically
const { ConversationalAgentExamples } = require('./examples/conversationalAgentExample');
const examples = new ConversationalAgentExamples();
await examples.basicMessageExample();
```

## 📊 Available Intents

The system supports these predefined intents:

- **weather.check** - Get weather information

  - Required: `location`
  - Optional: `units`, `lang`

- **crop.advisory** - Get farming advice

  - Required: `crop_name`, `location`
  - Optional: `season`, `soil_type`, `area_size`

- **market.prices** - Get market prices
  - Required: `commodity`
  - Optional: `market`, `state`, `date`

## 🔄 Data Flow

```
User Input → ConversationManager → DialogflowCXService → Dialogflow CX → API Execution → Formatted Response → User
```

## 🚨 Error Handling

The system includes robust error handling:

```javascript
try {
  const response = await conversationManager.sendToAgent(message, userId);
  if (response.success) {
    console.log("Success:", response.message);
  } else {
    console.log("Error:", response.error);
  }
} catch (error) {
  console.error("Exception:", error);
}
```

## 🧪 Testing

Test the conversational agent connectivity:

```javascript
// Test agent connectivity
const testResults = await conversationManager.testAgentConnection();
console.log("Test Results:", testResults);

// Get statistics
const stats = conversationManager.getAgentStats();
console.log("Agent Stats:", stats);
```

## 📈 Performance Monitoring

The system provides built-in performance monitoring:

- Response time tracking
- Success rate monitoring
- Conversation history analysis
- Error rate tracking

## 🔐 Security Considerations

1. **Authentication**: Ensure proper Google Cloud authentication
2. **Input Validation**: All inputs are validated before processing
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Session Management**: Secure session handling for user data

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**

   - Verify Google Cloud credentials
   - Check service account permissions
   - Ensure Dialogflow CX API is enabled

2. **Agent Not Responding**

   - Verify agent ID and project configuration
   - Check network connectivity
   - Review Dialogflow CX console for errors

3. **Intent Not Recognized**
   - Train your Dialogflow CX agent with more examples
   - Check intent confidence thresholds
   - Review parameter extraction settings

### Debug Mode

Enable debug logging:

```javascript
// Set environment variable
process.env.DEBUG = "true";

// Or use logger
const logger = require("firebase-functions/logger");
logger.setLogLevel("DEBUG");
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. Check the examples in `examples/conversationalAgentExample.js`
2. Review the troubleshooting section
3. Check Google Cloud Dialogflow CX documentation
4. Open an issue on the repository

---

**Note**: Make sure to replace placeholder values like `your-project-id` and `your-agent-id` with your actual Google Cloud project configuration before deploying to production.
