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
const {sendWhatsappMessage} = require("./src/response");

// Import Dialogflow CX services
const { sendMessageToAgent, healthCheck } = require("./src/chatEndpoint");

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

    const {WaId, Body, To, From} = req.body;

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

  } catch (error) {
    logger.error("WhatsApp callback error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process WhatsApp message",
    });
  }
});

// Export the Express app as a single Cloud Function
exports.api = onRequest({
  invoker: "public",
}, app);
