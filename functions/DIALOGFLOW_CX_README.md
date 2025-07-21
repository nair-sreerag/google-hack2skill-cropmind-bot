# Dialogflow CX Integration

This module provides a simple interface to send text messages to Google Conversational Agent using Dialogflow CX API and receive responses.

## 🚀 Quick Start

### 1. Authentication Setup

You need to set up Google Cloud authentication. Choose one of these options:

#### Option A: Service Account Key (Recommended for local development)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `hack2skill-hackathon-85db2`
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Create a service account with these roles:
   - Dialogflow API Admin
   - Firebase Admin SDK Administrator Service Agent
5. Download the JSON key file
6. Set environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

#### Option B: Application Default Credentials

```bash
gcloud auth application-default login
```

### 2. Test the Setup

Run the simple example:

```bash
cd functions
node examples/simple-chat-example.js
```

For interactive chat:

```bash
node examples/simple-chat-example.js --interactive
```

## 📋 Usage Examples

### Basic Usage

```javascript
const { DialogflowCXService } = require("./src/dialogflowCXService");

async function sendMessage() {
  const service = new DialogflowCXService();
  const sessionId = service.generateSessionId("user123");

  const response = await service.sendMessage("Hello", sessionId);

  console.log("Agent Response:", response.messages.join(" "));
  console.log("Detected Intent:", response.intent?.displayName);
}
```

### HTTP API Usage

#### Send Message

```bash
curl -X POST http://localhost:5001/hack2skill-hackathon-85db2/us-central1/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "sessionId": "user123_session"
  }'
```

#### Health Check

```bash
curl http://localhost:5001/hack2skill-hackathon-85db2/us-central1/api/health
```

### Response Format

```javascript
{
  "success": true,
  "sessionId": "response-id",
  "messages": ["Hello! How can I help you today?"],
  "intent": {
    "name": "projects/.../intents/...",
    "displayName": "Default Welcome Intent",
    "confidence": 0.95
  },
  "parameters": {},
  "currentPage": {
    "name": "projects/.../pages/...",
    "displayName": "Start Page"
  },
  "languageCode": "en",
  "raw": {
    "queryText": "Hello",
    "confidence": 0.95
  }
}
```

## 🛠️ Configuration

Update the configuration in `src/dialogflowCXService.js`:

```javascript
constructor() {
  this.projectId = "hack2skill-hackathon-85db2";
  this.location = "us-central1"; // Change if your agent is in a different location
  this.agentId = "d2c9e580-7ede-409c-8371-139ee8980a1c"; // Your actual agent ID
  this.languageCode = "en";
}
```

## 🌐 Deployment

### Local Development

```bash
firebase emulators:start --only functions
```

### Deploy to Firebase

```bash
firebase deploy --only functions
```

### Production URLs

After deployment, your endpoints will be available at:

- `https://us-central1-hack2skill-hackathon-85db2.cloudfunctions.net/api/chat`
- `https://us-central1-hack2skill-hackathon-85db2.cloudfunctions.net/api/health`

## 🔧 Troubleshooting

### Authentication Errors

```
Error: Could not load the default credentials
```

**Solution:** Set up authentication using one of the methods above.

### Agent Not Found

```
Error: Agent not found
```

**Solution:** Check your `agentId` and `location` in the configuration.

### Permission Denied

```
Error: Permission denied
```

**Solution:** Ensure your service account has the correct roles (Dialogflow API Admin).

## 📁 File Structure

```
functions/
├── src/
│   ├── dialogflowCXService.js    # Main service class
│   └── chatEndpoint.js           # HTTP endpoints
├── examples/
│   └── simple-chat-example.js    # Usage examples
└── index.js                      # Express app with endpoints
```

## 🎯 Features

- ✅ Simple text message sending
- ✅ Session management
- ✅ Intent detection
- ✅ Parameter extraction
- ✅ HTTP API endpoints
- ✅ Interactive chat mode
- ✅ Comprehensive error handling
- ✅ CORS support
- ✅ Health check endpoint

## 📞 API Reference

### `DialogflowCXService.sendMessage(message, sessionId, languageCode)`

**Parameters:**

- `message` (string): The text message to send
- `sessionId` (string): Unique session identifier
- `languageCode` (string, optional): Language code (default: 'en')

**Returns:** Promise resolving to formatted response object

### `DialogflowCXService.generateSessionId(userId)`

**Parameters:**

- `userId` (string, optional): User identifier

**Returns:** Unique session ID string

## 🤝 Support

For issues or questions, check:

1. Authentication is properly set up
2. Project ID and agent ID are correct
3. Required IAM roles are assigned
4. Dialogflow CX agent is published and active
