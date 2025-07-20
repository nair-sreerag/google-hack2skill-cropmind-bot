// Authentication is handled automatically through Firebase Admin SDK
// When running in Firebase Functions environment, it uses the service account
// associated with the project. No explicit authentication is needed.
// The Firebase Admin SDK automatically authenticates using:
// 1. Service account key (if GOOGLE_APPLICATION_CREDENTIALS is set)
// 2. Default service account when running on Google Cloud/Firebase
// 3. Application Default Credentials (ADC) flow


const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

module.exports = {
  // Create or update a user session
  createOrUpdateSession: async (userId, sessionData) => {
    try {
      const sessionRef = db.collection("sessions").doc(userId);
      const sessionDoc = {
        ...sessionData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await sessionRef.set(sessionDoc, {merge: true});
      return {success: true, sessionId: userId};
    } catch (error) {
      console.error("Error creating/updating session:", error);
      throw new Error("Failed to create or update session");
    }
  },

  // Get a user session by userId
  getSession: async (userId) => {
    try {
      const sessionRef = db.collection("sessions").doc(userId);
      const sessionDoc = await sessionRef.get();

      if (sessionDoc.exists) {
        return sessionDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error getting session:", error);
      throw new Error("Failed to get session");
    }
  },

  // Update specific fields in a user session
  updateSession: async (userId, updateData) => {
    try {
      const sessionRef = db.collection("sessions").doc(userId);
      const updateDoc = {
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await sessionRef.update(updateDoc);
      return {success: true, sessionId: userId};
    } catch (error) {
      console.error("Error updating session:", error);
      throw new Error("Failed to update session");
    }
  },

  // Delete a user session
  deleteSession: async (userId) => {
    try {
      const sessionRef = db.collection("sessions").doc(userId);
      await sessionRef.delete();
      return {success: true, sessionId: userId};
    } catch (error) {
      console.error("Error deleting session:", error);
      throw new Error("Failed to delete session");
    }
  },

  // Check if a session exists
  sessionExists: async (userId) => {
    try {
      const sessionRef = db.collection("sessions").doc(userId);
      const sessionDoc = await sessionRef.get();
      return sessionDoc.exists;
    } catch (error) {
      console.error("Error checking session existence:", error);
      throw new Error("Failed to check session existence");
    }
  },

  // Get all active sessions (with optional limit)
  getAllSessions: async (limit = 100) => {
    try {
      const sessionsRef = db.collection("sessions").limit(limit);
      const snapshot = await sessionsRef.get();

      const sessions = [];
      snapshot.forEach((doc) => {
        sessions.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return sessions;
    } catch (error) {
      console.error("Error getting all sessions:", error);
      throw new Error("Failed to get all sessions");
    }
  },

  // Increment error count for a session
  incrementErrorCount: async (userId) => {
    try {
      const sessionRef = db.collection("sessions").doc(userId);
      await sessionRef.update({
        errorCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return {success: true, sessionId: userId};
    } catch (error) {
      console.error("Error incrementing error count:", error);
      throw new Error("Failed to increment error count");
    }
  },

  // Reset error count for a session
  resetErrorCount: async (userId) => {
    try {
      const sessionRef = db.collection("sessions").doc(userId);
      await sessionRef.update({
        errorCount: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return {success: true, sessionId: userId};
    } catch (error) {
      console.error("Error resetting error count:", error);
      throw new Error("Failed to reset error count");
    }
  },
};
