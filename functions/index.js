/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const {sendWhatsappMessage, sendMessage, accountSid, authToken, bufferedToken, sendSMS} = require("./src/response");
const { VertexAI } = require('@google-cloud/vertexai');

// Import Dialogflow CX services
const { sendMessageToAgent, healthCheck } = require("./src/chatEndpoint");
const { DialogflowCXService } = require("./src/dialogflowCXService");
const { default: axios } = require("axios");
const speech = require('@google-cloud/speech').v1p1beta1;
const gtts = new speech.SpeechClient();


const vision = require('@google-cloud/vision');
const annotatorClient = new vision.ImageAnnotatorClient();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// Import services


// Create Express app
const app = express();

// Enable CORS for all routes
app.use(cors({origin: true}));

// Parse JSON bodies
app.use(express.json());

// Configure Multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/flac',
      'audio/x-wav',
      'audio/vnd.wave'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
  }
});

// RELEVANT ENDPOINTS

/**
 * Ping endpoint - returns a simple pong response with status information
 */
app.get("/ping", (req, res) => {
  logger.info("Ping API called", {structuredData: true});

  const pingResponse = {
    status: "success",
    message: "Pong! Firebase Functions is working.",
    timestamp: new Date().toISOString(),
    method: req.method,
    userAgent: req.get("User-Agent") || "Unknown",
  };

  res.status(200).json(pingResponse);
});

/**
 * Dialogflow CX Chat endpoint - sends messages to Google Conversational Agent
 * POST /chat
 * Body: { "message": "Hello", "sessionId": "optional", "languageCode": "en" }
 */
app.post("/chat", sendMessageToAgent);

/**
 * Health check endpoint for Dialogflow CX service
 * GET /health
 */
app.get("/health", healthCheck);

app.post("/whatsapp-callback", async (req, res) => {
  try {
    console.log("WhatsApp callback =>>> ", req.body);

    // const {WaId, Body, To, From} = req.body;
    
    const { WaId,  To, From, sessionId, languageCode, MediaContentType0, MediaUrl0 } = req.body;

    let { Body: message, } = req.body;

    const dialogflowService = new DialogflowCXService();


    switch(MediaContentType0) {

      case 'audio/ogg' : { 
        
        console.log("Got audio file from webhook", MediaUrl0, bufferedToken);

        let audioResponse = await axios.get(MediaUrl0, {
          responseType: 'arraybuffer',
          maxRedirects: 5,
          headers: {
            Authorization: 'Basic ' + bufferedToken
          }
        });


        // audioResponse = await axios.get('https://storage.googleapis.com/cloud-samples-tests/speech/brooklyn.flac',{
        //   responseType: 'arraybuffer',
        // })

        const audioBuffer = Buffer.from(audioResponse.data, 'binary');


        console.log("audioBuffer => ", audioBuffer);

        // const [ response ] = await gtts.recognize({
        //   audio: {
        //     content: audioBuffer.toString('base64')
        //   },
        //   config: {
        //     encoding: 'OGG_OPUS',
        //     sampleRateHertz: 16000,
        //     languageCode: 'en-US',
        //     // enableAutomaticPunctuation: true,
        //     // enableSeparateRecognitionPerChannel: true,
        //   },
        // });


        const request = {
          contents: [{
            role: 'user',
            parts: [{
              inline_data: {
                mime_type: 'audio/ogg',
                data: audioBuffer.toString('base64')
              }
            }, {
              text: 'Please transcribe this audio file and return only the spoken text.'
            }]
          }]
        };

        const vertexAI = new VertexAI({
          project: 'cropmind-89afe',
          location: 'asia-south1'
        });

        const model = vertexAI.getGenerativeModel({
          model: 'gemini-2.5-flash' // Use appropriate model for audio
        });

      const vertexResponse = await model.generateContent(request);
      const transcripts = vertexResponse.response.candidates[0].content.parts[0].text;


        console.log("response => ", transcripts);


        // const transcripts = response.results.map(r => {
        //   console.log("got this transcript =>> ", r.alternatives[0].transcript);
        //   return r.alternatives[0].transcript;
        // }).join('\n');

        message = transcripts;
        
        break; 
      }
      
      case 'image/jpeg' : { 
      

        console.log("Got image from webhook", MediaUrl0);

        let imageResponse = await axios.get(MediaUrl0, {
          responseType: 'arraybuffer',
          maxRedirects: 5,
          headers: {
            Authorization: 'Basic ' + bufferedToken
          }
        });

        console.log("imageResponse => ", imageResponse);
        
        const openUrl = imageResponse.request.res.responseUrl;

        console.log("openUrl => ", openUrl);

        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        const base64Image = imageBuffer.toString('base64');
        
        const [result] = await annotatorClient.annotateImage({
          image: { content: base64Image, },
          features: [
            { type: 'OBJECT_LOCALIZATION' },  // Precise object detection with locations
            { type: 'LABEL_DETECTION' },      // General categories
            { type: 'TEXT_DETECTION' },       // Text extraction
            { type: 'LOGO_DETECTION' },       // Brand logos
          ],
        });

        console.log("image annotation result => ", result);

        const labels = result.labelAnnotations.map(l => l.description);
        const detectedText = result.textAnnotations?.[0]?.description || '';

        console.log("labels => ", labels);
        console.log("detectedText => ", detectedText);

        message = detectedText;


        break;
      }
      
      default : {
        console.log("Got text message from webhook", req.body.Body);
        message = req.body.Body;
        break;
      }

    }

    
    // Generate session ID if not provided
    const finalSessionId = `whatsapp-${WaId}` || dialogflowService.generateSessionId();
    
    console.log(`Processing message: "${message}" for session: ${finalSessionId}`);

    // Send message to Dialogflow CX
    const response = await dialogflowService.sendMessage(
      message, 
      finalSessionId, 
      languageCode || 'en'
    );

    console.log("response ->> ", JSON.stringify(response));

    await sendWhatsappMessage(response.messages[0], To, From, );

    return res.json({
      success: true
    })

  } catch (error) {
    logger.error("WhatsApp callback error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process WhatsApp message",
    });
  }
});

app.post('/send-whatsapp-message', async (req, res) => {
  const { message, to } = req.body;
  console.log("message and to ", message, to);
  const response = await sendWhatsappMessage(message, "whatsapp:+14155238886", `whatsapp:${to}`, );
  
  console.log("response >>> ", response);
  
  return res.json({success: true});
});

app.post('/send-sms', async (req, res) => {

  console.log("send sms => ", req.body);

  const { to, message } = req.body;

  const response = await sendSMS(to, message);
  
  console.log("response =>> ", response);

  return res.json({
    success: true
  })

});

app.post('/get-audio-response', (req, res) => {
  // Handle multer upload with error handling
  upload.single('audio')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      return res.status(400).json({
        success: false,
        error: `File upload error: ${err.message}`
      });
    } else if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

  try {
    console.log("Get audio response called", req.file);
    // Handle both form-data and JSON payload
    let audioBuffer;
    let mimeType = 'audio/ogg'; // default
    
    // Check if request contains form-data (multipart) with uploaded file
    if (req.file) {
      // Handle file upload via form-data using multer
      audioBuffer = req.file.buffer; // Binary data from multer
      mimeType = req.file.mimetype || 'audio/ogg';
      console.log("Received audio file via form-data:", {
        filename: req.file.originalname,
        mimetype: mimeType,
        size: audioBuffer.length
      });
    } else if (req.body.audio) {
      // Handle base64 audio from JSON payload (fallback for non-multipart requests)
      const audioData = req.body.audio;
      mimeType = req.body.mimeType || 'audio/ogg';
      console.log("Received audio data via JSON payload");
      
      try {
        audioBuffer = Buffer.from(audioData, 'base64');
        console.log("Converted base64 audio to buffer, size:", audioBuffer.length);
      } catch (error) {
        console.error("Error decoding base64 audio:", error);
        return res.status(400).json({
          success: false,
          error: "Invalid base64 audio data"
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: "Audio file is required (either via form-data 'audio' field or JSON 'audio' property)"
      });
    }
    
    // Validate audio buffer
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Audio buffer is empty or invalid"
      });
    }
    
    console.log("Audio buffer prepared successfully:", {
      size: audioBuffer.length,
      mimeType: mimeType
    });


    // return res.json({
    //   success: true,
    //   audioBuffer: audioBuffer,
    //   mimeType: mimeType
    // });

    // Use Vertex AI for audio transcription instead of Speech-to-Text
    
    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: 'cropmind-89afe',
      location: 'asia-south1'
    });
    
    // Get the generative model for audio processing
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash' // Use appropriate model for audio
    });
    
    // Convert audio buffer to base64 for Vertex AI
    const audioBase64 = audioBuffer.toString('base64');
    
    // Create request for Vertex AI
    const request = {
      contents: [{
        role: 'user',
        parts: [{
          inline_data: {
            mime_type: 'audio/ogg',
            data: audioBase64
          }
        }, {
          text: 'Please transcribe this audio file and return only the spoken text.'
        }]
      }]
    };
    
    // Generate content using Vertex AI
    const vertexResponse = await model.generateContent(request);
    const transcripts = vertexResponse.response.candidates[0].content.parts[0].text;
    
    console.log("Vertex AI transcription:", transcripts);
    
    // Skip the Google Speech-to-Text processing below and use Vertex AI result
    if (!transcripts) {
      return res.status(400).json({
        success: false,
        error: "Could not transcribe audio using Vertex AI"
      });
    }
    
    console.log("Final transcript from Vertex AI:", transcripts);

    // Send transcribed text to Dialogflow CX
    const dialogflowService = new DialogflowCXService();
    const sessionId = `audio_session_${Date.now()}`;
    
    const dialogflowResponse = await dialogflowService.sendMessage(
      transcripts,
      sessionId,
      'en'
    );

    console.log("Dialogflow response:", JSON.stringify(dialogflowResponse));

    return res.json({
      success: true,
      transcript: transcripts,
      response: dialogflowResponse.messages[0] || "No response from agent",
      sessionId: sessionId
    });

  } catch (error) {
    console.error("Audio processing error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process audio with Vertex AI: " + error.message
    });
  }
});
});


  
  // The following Speech-to-Text code is now bypassed
  /*
    // Transcribe audio using Google Speech-to-Text
    const [response] = await gtts.recognize({
      audio: {
        content: audioBuffer.toString('base64')
      },
      config: {
        encoding: 'OGG_OPUS',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
      },
    });

    console.log("Speech recognition response:", response);

    const transcripts = response.results.map(r => {
      console.log("Transcript:", r.alternatives[0].transcript);
      return r.alternatives[0].transcript;
    }).join('\n');

    if (!transcripts) {
      return res.status(400).json({
        success: false,
        error: "Could not transcribe audio"
      });
    }

    console.log("Final transcript:", transcripts);

    // Send transcribed text to Dialogflow CX
    const dialogflowService = new DialogflowCXService();
    const sessionId = `audio_session_${Date.now()}`;
    
    const dialogflowResponse = await dialogflowService.sendMessage(
      transcripts,
      sessionId,
      'en'
    );

    console.log("Dialogflow response:", JSON.stringify(dialogflowResponse));

    return res.json({
      success: true,
      transcript: transcripts,
      response: dialogflowResponse.messages[0] || "No response from agent",
      sessionId: sessionId
    });

  } catch (error) {
    console.error("Audio processing error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process audio: " + error.message
    });
  }
  
})
  */

// Export the Express app as a single Cloud Function
// exports.api = onRequest({
//   memory: '512MiB',
//   invoker: "public",
// }, app);


app.listen(5050, () => {
  console.log("Server listening on port 5050");
});