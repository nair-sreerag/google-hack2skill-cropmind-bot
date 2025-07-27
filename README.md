# WhatsApp AI Bot with Firebase Functions

A sophisticated WhatsApp conversational AI bot built with Firebase Functions that integrates with Google Cloud services for intelligent multi-modal conversations. This server handles Twilio WhatsApp webhooks and provides seamless text, audio, and image processing capabilities.

## Features

### Core Functionality

- **WhatsApp Integration**: Handles incoming WhatsApp messages via Twilio webhooks
- **Conversational AI**: Powered by Google Dialogflow CX for intelligent responses
- **Multi-Modal Support**:
  - Text messaging
  - Audio transcription and voice responses
  - Image analysis and text extraction
- **SMS Support**: Send SMS messages via Twilio
- **Real-time Processing**: Instant message processing and responses

### Advanced Capabilities

- **Audio Processing**:
  - Voice message transcription using Google Vertex AI
  - Text-to-speech responses with customizable voices
  - Support for multiple audio formats (OGG, MP3, WAV, etc.)
- **Image Analysis**:
  - Object detection and labeling
  - Text extraction from images
  - Logo and brand recognition
- **Session Management**: Persistent conversation sessions across interactions
- **Health Monitoring**: Built-in health check endpoints

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Twilio        │    │  Firebase        │    │  Google Cloud       │
│   WhatsApp      │───▶│  Functions       │───▶│  Services           │
│   Webhooks      │    │  (Express API)   │    │  - Dialogflow CX    │
└─────────────────┘    └──────────────────┘    │  - Vertex AI        │
                                                │  - Vision API       │
                                                │  - Text-to-Speech   │
                                                │  - Cloud Storage    │
                                                └─────────────────────┘
```

## API Endpoints

### Core Endpoints

- `GET /ping` - Health check endpoint
- `GET /health` - Dialogflow service health check
- `POST /chat` - Direct chat with the AI agent
- `POST /whatsapp-callback` - Twilio WhatsApp webhook handler
- `POST /send-whatsapp-message` - Send WhatsApp messages
- `POST /send-sms` - Send SMS messages
- `POST /get-audio-response` - Process audio files and get AI responses

### Supported Media Types

- **Text Messages**: Direct text processing and responses
- **Audio Messages**: Automatic transcription and voice responses
- **Image Messages**: Object detection, text extraction, and analysis
- **Voice Notes**: Real-time voice-to-text conversion

## Technology Stack

### Backend Services

- **Firebase Functions**: Serverless hosting platform
- **Express.js**: Web application framework
- **Node.js 22**: Runtime environment

### Google Cloud Integration

- **Dialogflow CX**: Conversational AI platform
- **Vertex AI**: Advanced AI and ML services for audio processing
- **Vision API**: Image analysis and text extraction
- **Text-to-Speech**: Voice synthesis
- **Cloud Storage**: File storage and management

### Communication Services

- **Twilio**: WhatsApp and SMS messaging
- **CORS**: Cross-origin resource sharing
- **Multer**: File upload handling

## Installation & Setup

### Prerequisites

- Node.js 22 or higher
- Firebase CLI
- Google Cloud Project with enabled APIs
- Twilio Account with WhatsApp Business API

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd hackathon

# Switch to the latest branch
git checkout ss_project_config

# Install dependencies
cd functions
npm install

# Start local development server
npm run serve
```

### Environment Configuration

Configure the following in your Google Cloud and Twilio accounts:

1. **Google Cloud Services**: Enable the following APIs

   - Dialogflow CX API
   - Vertex AI API
   - Vision API
   - Text-to-Speech API
   - Cloud Storage API

2. **Twilio Configuration**: Set up your Twilio credentials in `functions/src/response.js`

## Deployment

### Deploy to Firebase

```bash
# Deploy functions only
npx firebase deploy --only functions

# Deploy all services (functions + hosting + storage)
npx firebase deploy
```

### Branch Information

- **Main Branch**: `ss_project_config` contains the latest stable code
- **Development**: Make changes in feature branches and merge to `ss_project_config`

## Twilio WhatsApp Setup

### Webhook Configuration

After deployment, configure your Twilio WhatsApp webhook URL:

1. **Login to Twilio Console**
2. **Navigate to**: Programmable Messaging → WhatsApp → Sandbox Settings
3. **Set Webhook URL**: `https://<your-firebase-domain>/api/whatsapp-callback`
4. **Enable Webhook for**:
   - Incoming messages
   - Message status updates
   - Media messages (images, audio)

### Supported Message Types

Configure webhooks for these message types:

- Text messages
- Image messages (`image/jpeg`)
- Audio messages (`audio/ogg`)
- Voice messages

## Usage Examples

### Send a WhatsApp Message

```javascript
POST /api/send-whatsapp-message
{
  "message": "Hello from AI Bot!",
  "to": "+1234567890"
}
```

### Chat with AI Agent

```javascript
POST /api/chat
{
  "message": "How can you help me?",
  "sessionId": "user-session-123",
  "languageCode": "en"
}
```

### Process Audio File

```javascript
POST /api/get-audio-response
Content-Type: multipart/form-data

audio: [audio file]
```

## Security Features

- **CORS Protection**: Configured for secure cross-origin requests
- **File Validation**: Strict file type and size validation
- **Session Management**: Secure session handling for conversations
- **Rate Limiting**: Built-in Firebase Functions scaling and limits

## Monitoring & Health Checks

### Health Endpoints

- `/ping` - Basic service health
- `/health` - Dialogflow CX connectivity check

### Logging

All requests and responses are logged using Firebase Functions logger for debugging and monitoring.

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make changes and test locally**
4. **Commit changes**: `git commit -m 'Add your feature'`
5. **Push to branch**: `git push origin feature/your-feature`
6. **Submit a Pull Request** to `ss_project_config` branch

## Configuration Files

- `firebase.json` - Firebase project configuration
- `functions/package.json` - Node.js dependencies
- `functions/index.js` - Main application entry point
- `.firebaserc` - Firebase project aliases

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**: Verify Twilio webhook URL configuration
2. **Audio transcription failing**: Check Vertex AI API permissions
3. **Image processing errors**: Verify Vision API is enabled
4. **Deployment failures**: Ensure Firebase CLI is logged in and project is selected

### Debug Commands

```bash
# View function logs
firebase functions:log

# Test locally
npm run serve

# Check linting
npm run lint
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review Firebase Functions documentation

---

**Last Updated**: December 2024  
**Branch**: ss_project_config  
**Node Version**: 22
