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
const {sessionExists} = require("./src/session");
const {sendWhatsappMessage} = require("./src/response");
const {listLevels, startingMessage} = require("./src/messages");
// const {createOrUpdateSession} = require("./src/session");

// const {debugFirestore} = require("./src/debug-firestore");


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

// const START = "hi";

const INITIAL_MESSAGES = [
  "hi",
  "/start",
];

// Create Express app
const app = express();

// Enable CORS for all routes
app.use(cors({origin: true}));

// Parse JSON bodies
app.use(express.json());

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


app.post("/whatsapp-callback", async (req, res) => {
  console.log("post body =>>> ", req.body);

  //   const response = await createOrUpdateSession("+919356099515", {
  //     surname: "kumar",
  //   });

  //   console.log("response =>> ", JSON.stringify(response));


  // switch() {

  // }


  const doesSessionExist = await sessionExists(req.body.WaId);

  console.log("doesSessionExist => ", doesSessionExist);

  if (doesSessionExist) {
    console.log("session exists");
  } else {
    if (INITIAL_MESSAGES.includes(req.body.Body.toLowerCase())) {
      // return the list of languages wala flow
      const response = await sendWhatsappMessage(listLevels(),
          req.body.To, req.body.From);

      console.log("if response => ", response);

      return res.status(200).json({
        message: "success",
      });
    } else {
      const response = await sendWhatsappMessage(startingMessage(),
          req.body.To, req.body.From);

      console.log("else response => ", response);

      return res.status(200).json({
        message: "success",
      });
    }
  }


  return res.status(200).json({
    message: "Whatsapp callback received",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Root endpoint - API info
 */
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Firebase Functions API",
    version: "1.0.0",
    endpoints: ["/ping", "/hello"],
    timestamp: new Date().toISOString(),
  });
});


// Export the Express app as a single Cloud Function
exports.api = onRequest({
  invoker: "public",
}, app);


