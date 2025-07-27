const { Storage } = require('@google-cloud/storage');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();
const storage = new Storage({
  projectId: 'cropmind-89afe'
});

const ttsClient = new TextToSpeechClient({
  projectId: 'cropmind-89afe'
});

// Default configuration
const DEFAULT_CONFIG = {
  bucketName: 'cropmind-89afe-vertex-audio',
  voice: {
    languageCode: 'en-US',
    name: 'en-US-Standard-A',
    ssmlGender: 'NEUTRAL'
  },
  audioConfig: {
    audioEncoding: 'MP3',
    speakingRate: 1.0,
    pitch: 0.0,
    volumeGainDb: 0.0
  }
};

async function convertTextToAudio(text, voiceConfig = {}) {
  try {
    console.log(`Converting text to audio: ${text.substring(0, 100)}...`);

    // Merge with default voice config
    const finalVoiceConfig = {
      ...DEFAULT_CONFIG.voice,
      ...voiceConfig
    };

    const finalAudioConfig = {
      ...DEFAULT_CONFIG.audioConfig,
      ...(voiceConfig.audioConfig || {})
    };

    // Create TTS request
    const request = {
      input: { text: text },
      voice: finalVoiceConfig,
      audioConfig: finalAudioConfig,
    };

    console.log(`Generating audio with voice: ${finalVoiceConfig.name}`);
    const [response] = await ttsClient.synthesizeSpeech(request);
    
    console.log(`Audio generated successfully: ${response.audioContent.length} bytes`);
    
    return {
      audioBuffer: response.audioContent,
      voiceUsed: finalVoiceConfig,
      audioConfig: finalAudioConfig,
      textLength: text.length,
      audioSize: response.audioContent.length
    };

  } catch (error) {
    console.error('Text-to-Speech error:', error);
    throw new Error(`Failed to convert text to audio: ${error.message}`);
  }
}

async function uploadAudioToBucket(audioBuffer, bucketName, filePath, metadata = {}) {
  try {
    console.log(`Uploading audio to gs://${bucketName}/${filePath}`);

    // Ensure bucket exists
    const bucket = storage.bucket(bucketName);
    const [bucketExists] = await bucket.exists();
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      await storage.createBucket(bucketName, {
        location: 'US',
        storageClass: 'STANDARD',
        uniformBucketLevelAccess: true
      });

      // Configure bucket for public access
      await bucket.iam.setPolicy({
        bindings: [
          {
            role: 'roles/storage.objectViewer',
            members: ['allUsers'],
          }
        ],
      });
    }

    // Upload file
    const file = bucket.file(filePath);
    
    await file.save(audioBuffer, {
      metadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=3600',
        metadata: {
          uploadedAt: new Date().toISOString(),
          audioSize: audioBuffer.length.toString(),
          source: 'text-to-speech-service',
          ...metadata
        }
      },
      public: true,
    });

    // Ensure file is public
    await file.makePublic();

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

    console.log(`Audio uploaded successfully: ${publicUrl}`);

    return {
      bucketName: bucketName,
      filePath: filePath,
      publicUrl: publicUrl,
      fileSize: audioBuffer.length
    };

  } catch (error) {
    console.error('Error uploading audio to bucket:', error);
    throw new Error(`Failed to upload audio: ${error.message}`);
  }
}

async function saveAudioMetadataToFirestore(audioData, textData, uploadData) {
  try {
    const audioId = `audio_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const audioDoc = {
      audioId: audioId,
      fileName: uploadData.filePath.split('/').pop(),
      filePath: uploadData.filePath,
      publicUrl: uploadData.publicUrl,
      bucketName: uploadData.bucketName,
      
      // Text information
      originalText: textData.text,
      textLength: textData.textLength,
      
      // Audio information
      audioSize: audioData.audioSize,
      mimeType: 'audio/mpeg',
      
      // Voice configuration
      voice: audioData.voiceUsed,
      audioConfig: audioData.audioConfig,
      
      // Metadata
      source: 'text-to-speech-service',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isPublic: true,
      downloadCount: 0,
      playCount: 0,
      status: 'active',
      
      // Additional metadata
      metadata: textData.metadata || {}
    };

    await db.collection('audioFiles').doc(audioId).set(audioDoc);
    
    console.log(`Audio metadata saved to Firestore: ${audioId}`);

    return {
      audioId: audioId,
      firestoreDoc: audioDoc
    };

  } catch (error) {
    console.error('Error saving audio metadata:', error);
    throw new Error(`Failed to save metadata: ${error.message}`);
  }
}

async function textToAudioComplete(text, options = {}) {
  try {
    const {
      bucketName = DEFAULT_CONFIG.bucketName,
      voice = {},
      fileName = null,
      saveToFirestore = true,
      metadata = {}
    } = options;

    console.log(`Starting complete text-to-audio process...`);
    console.log(`Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    console.log(`Bucket: ${bucketName}`);

    // Step 1: Convert text to audio
    const audioData = await convertTextToAudio(text, voice);

    // Step 2: Generate file path
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const finalFileName = fileName || `tts_${timestamp}_${randomId}.mp3`;
    const filePath = `audio/${finalFileName}`;

    // Step 3: Upload to bucket
    const uploadData = await uploadAudioToBucket(
      audioData.audioBuffer, 
      bucketName, 
      filePath, 
      {
        originalText: text.substring(0, 200),
        textLength: text.length.toString(),
        voice: audioData.voiceUsed.name,
        ...metadata
      }
    );

    // Step 4: Save metadata to Firestore (optional)
    let firestoreData = null;
    if (saveToFirestore) {
      firestoreData = await saveAudioMetadataToFirestore(
        audioData,
        { text, textLength: text.length, metadata },
        uploadData
      );
    }

    // Step 5: Return complete result
    const result = {
      success: true,
      publicUrl: uploadData.publicUrl,
      audioId: firestoreData?.audioId || null,
      fileName: finalFileName,
      filePath: filePath,
      bucketName: bucketName,
      
      // Audio details
      audioSize: audioData.audioSize,
      textLength: text.length,
      voice: audioData.voiceUsed,
      
      // Timestamps
      generatedAt: new Date().toISOString(),
      
      // Optional Firestore info
      savedToFirestore: saveToFirestore,
      firestoreDocId: firestoreData?.audioId || null
    };

    console.log(`✅ Text-to-audio process completed successfully!`);
    console.log(`🔗 Public URL: ${result.publicUrl}`);

    return result;

  } catch (error) {
    console.error('Complete text-to-audio process failed:', error);
    throw new Error(`Text-to-audio process failed: ${error.message}`);
  }
}

// Voice presets for easy use
const VOICE_PRESETS = {
  'female-us': { 
    languageCode: 'en-US', 
    name: 'en-US-Wavenet-F', 
    ssmlGender: 'FEMALE' 
  },
  'male-us': { 
    languageCode: 'en-US', 
    name: 'en-US-Wavenet-D', 
    ssmlGender: 'MALE' 
  },
  'female-uk': { 
    languageCode: 'en-GB', 
    name: 'en-GB-Wavenet-A', 
    ssmlGender: 'FEMALE' 
  },
  'male-uk': { 
    languageCode: 'en-GB', 
    name: 'en-GB-Wavenet-B', 
    ssmlGender: 'MALE' 
  },
  'neural-us': { 
    languageCode: 'en-US', 
    name: 'en-US-Neural2-A', 
    ssmlGender: 'NEUTRAL' 
  },
  'standard-us': { 
    languageCode: 'en-US', 
    name: 'en-US-Standard-A', 
    ssmlGender: 'NEUTRAL' 
  }
};

// Helper function to get voice by preset name
function getVoicePreset(presetName) {
  return VOICE_PRESETS[presetName] || VOICE_PRESETS['standard-us'];
}

module.exports = {
  textToAudioComplete,
  convertTextToAudio,
  uploadAudioToBucket,
  saveAudioMetadataToFirestore,
  getVoicePreset,
  VOICE_PRESETS,
  DEFAULT_CONFIG
}; 