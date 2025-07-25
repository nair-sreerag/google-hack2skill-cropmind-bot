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
const {sendWhatsappMessage, sendMessage, accountSid, authToken, bufferedToken, sendSMS} = require("./src/response");

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

    // Commented out for now - can be enabled as needed
    // if (!Body || !WaId) {
    //   return res.status(400).json({
    //     success: false,
    //     error: "Missing required WhatsApp fields (WaId, Body)",
    //   });
    // }

    // // Check if session exists to get language preference
    // const doesSessionExist = await sessionExists(WaId);
    // console.log("doesSessionExist => ", doesSessionExist);

    // if (doesSessionExist) {
    //   // Process through Dialogflow for existing users
    //   const result = await dialogflowBot
    //       .processUserIntent(Body, WaId, "whatsapp");

    //   if (result.success && result.response.message) {
    //     const response = await sendWhatsappMessage(
    //         result.response.message,
    //         To,
    //         From,
    //     );
    //     console.log("Dialogflow response sent:", response);
    //   }

    //   return res.status(200).json({
    //     success: true,
    //     message: "Message processed through Dialogflow",
    //     result,
    //   });
    // } else {
    //   // Handle initial messages for new users
    //   if (INITIAL_MESSAGES.includes(Body.toLowerCase())) {
    //     const response = await sendWhatsappMessage(listLevels(), To, From);
    //     console.log("Initial menu response => ", response);

    //     return res.status(200).json({
    //       message: "success",
    //     });
    //   } else {
    //     const response = await sendWhatsappMessage(startingMessage(), To, From);
    //     console.log("Starting message response => ", response);

    //     return res.status(200).json({
    //       message: "success",
    //     });
    //   }
    // }


    // const response = await sendMessageToAgent(); 


    // extract details from body
    // send this to the aiFunction
    // get response
    // send it back using twilio
    
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

        const [ response ] = await gtts.recognize({
          audio: {
            content: audioBuffer.toString('base64')
          },
          config: {
            encoding: 'OGG_OPUS',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
            // enableAutomaticPunctuation: true,
            // enableSeparateRecognitionPerChannel: true,
          },
        });

        console.log("response => ", response);


        const transcripts = response.results.map(r => {
          console.log("got this transcript =>> ", r.alternatives[0].transcript);
          return r.alternatives[0].transcript;
        }).join('\n');

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

    await sendWhatsappMessage(response.messages[0], To, From);

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

// Export the Express app as a single Cloud Function
exports.api = onRequest({
  invoker: "public",
}, app);


// app.listen(5050, () => {
//   console.log("Server listening on port 5050")
// })