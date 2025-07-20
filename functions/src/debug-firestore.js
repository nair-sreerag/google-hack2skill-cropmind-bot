// Create a new file: functions/debug-firestore.js
const admin = require("firebase-admin");

// Function to debug Firestore connection
const debugFirestore = async () => {
  try {
    console.log("🔍 Debugging Firestore connection...");

    // Check if admin is initialized
    console.log("Admin apps count:", admin.apps.length);

    // Initialize if needed
    if (!admin.apps.length) {
      const app = admin.initializeApp({
        projectId: "hack2skill-hackathon-85db2",
      });
      console.log("✅ Firebase Admin initialized");
      console.log("Project ID:", app.options.projectId);
    }

    const db = admin.firestore("database2");
    console.log("✅ Firestore instance created");

    // Test basic connection
    console.log("🧪 Testing Firestore connection...");

    // Try to get app info
    const appRef = db.doc("_internal/app-info");
    const appDoc = await appRef.get();
    console.log("Connection test result:", appDoc ? "Success" : "Failed");

    // Try to write a simple document
    console.log("🧪 Testing write operation...");
    const testRef = db.collection("debug").doc("test");
    await testRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      test: true,
    });
    console.log("✅ Write test successful");

    // Try to read it back
    const testDoc = await testRef.get();
    if (testDoc.exists) {
      console.log("✅ Read test successful");
      console.log("Test data:", testDoc.data());
    }

    // Clean up
    await testRef.delete();
    console.log("✅ Cleanup successful");

    return {success: true, message: "All tests passed"};
  } catch (error) {
    console.error("❌ Firestore debug failed:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
    };
  }
};

module.exports = {debugFirestore};
