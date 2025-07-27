#!/usr/bin/env node

const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

// Configuration
const BUCKET_CONFIG = {
  projectId: 'hack2skill-hackathon-85db2',
  defaultBucket: 'hack2skill-vertex-audio',
  location: 'US'
};

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: BUCKET_CONFIG.projectId
});

async function uploadTextFileToBucket(filePath, bucketName, destinationPath = null, makePublic = true) {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file info
    const fileName = path.basename(filePath);
    const fileStats = fs.statSync(filePath);
    const finalDestination = destinationPath || `text-files/${Date.now()}_${fileName}`;

    console.log(`📁 Uploading file: ${filePath}`);
    console.log(`📦 Target bucket: ${bucketName}`);
    console.log(`🎯 Destination: ${finalDestination}`);

    // Check if bucket exists, create if not
    const bucket = storage.bucket(bucketName);
    const [bucketExists] = await bucket.exists();
    
    if (!bucketExists) {
      console.log(`🔨 Creating bucket: ${bucketName}`);
      await storage.createBucket(bucketName, {
        location: BUCKET_CONFIG.location,
        storageClass: 'STANDARD',
      });
      console.log(`✅ Bucket created: ${bucketName}`);
    }

    // Upload the file
    const file = bucket.file(finalDestination);
    
    await file.save(fs.readFileSync(filePath), {
      metadata: {
        contentType: 'text/plain',
        metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
          fileSize: fileStats.size.toString(),
          source: 'upload-script'
        }
      },
      public: makePublic,
    });

    // Make file public if requested
    if (makePublic) {
      await file.makePublic();
    }

    // Generate URLs
    const publicUrl = makePublic ? 
      `https://storage.googleapis.com/${bucketName}/${finalDestination}` : 
      null;

    const result = {
      success: true,
      fileName: fileName,
      bucketName: bucketName,
      destinationPath: finalDestination,
      publicUrl: publicUrl,
      fileSize: fileStats.size,
      isPublic: makePublic,
      uploadedAt: new Date().toISOString()
    };

    console.log(`✅ Upload successful!`);
    console.log(`📄 File: ${fileName}`);
    console.log(`📦 Bucket: ${bucketName}`);
    console.log(`🔗 Public URL: ${publicUrl || 'Private file'}`);
    console.log(`📊 Size: ${fileStats.size} bytes`);

    return result;

  } catch (error) {
    console.error(`❌ Upload failed:`, error.message);
    throw error;
  }
}

async function uploadMultipleTextFiles(filePaths, bucketName, folderPrefix = 'text-files') {
  try {
    console.log(`📚 Uploading ${filePaths.length} files to bucket: ${bucketName}`);
    
    const results = [];
    
    for (const filePath of filePaths) {
      const fileName = path.basename(filePath);
      const destinationPath = `${folderPrefix}/${Date.now()}_${fileName}`;
      
      try {
        const result = await uploadTextFileToBucket(filePath, bucketName, destinationPath);
        results.push(result);
        console.log(`✅ ${fileName} uploaded successfully`);
      } catch (error) {
        console.error(`❌ Failed to upload ${fileName}:`, error.message);
        results.push({
          success: false,
          fileName: fileName,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n📊 Upload Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${results.length - successCount}`);

    return results;

  } catch (error) {
    console.error(`❌ Batch upload failed:`, error.message);
    throw error;
  }
}

async function createTextFileAndUpload(content, fileName, bucketName, makePublic = true) {
  try {
    // Create temporary file
    const tempDir = './temp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, fileName);
    fs.writeFileSync(tempFilePath, content, 'utf8');

    console.log(`📝 Created temporary file: ${tempFilePath}`);

    // Upload the file
    const result = await uploadTextFileToBucket(tempFilePath, bucketName, null, makePublic);

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);
    console.log(`🗑️ Cleaned up temporary file`);

    return result;

  } catch (error) {
    console.error(`❌ Create and upload failed:`, error.message);
    throw error;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📁 Text File to Bucket Upload Script

Usage:
  node upload-text-to-bucket.js <file-path> [bucket-name] [destination-path] [--private]
  
Examples:
  # Upload to default bucket
  node upload-text-to-bucket.js ./my-file.txt
  
  # Upload to specific bucket
  node upload-text-to-bucket.js ./my-file.txt my-custom-bucket
  
  # Upload with custom destination path
  node upload-text-to-bucket.js ./my-file.txt my-bucket documents/my-file.txt
  
  # Upload as private file
  node upload-text-to-bucket.js ./my-file.txt my-bucket null --private

Environment Variables:
  GOOGLE_CLOUD_PROJECT: Project ID (default: ${BUCKET_CONFIG.projectId})
  DEFAULT_BUCKET: Default bucket name (default: ${BUCKET_CONFIG.defaultBucket})
`);
    process.exit(1);
  }

  const filePath = args[0];
  const bucketName = args[1] || process.env.DEFAULT_BUCKET || BUCKET_CONFIG.defaultBucket;
  const destinationPath = args[2] === 'null' ? null : args[2];
  const makePublic = !args.includes('--private');

  try {
    const result = await uploadTextFileToBucket(filePath, bucketName, destinationPath, makePublic);
    
    console.log('\n🎉 Upload completed successfully!');
    console.log('📋 Result:', JSON.stringify(result, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use as module
module.exports = {
  uploadTextFileToBucket,
  uploadMultipleTextFiles,
  createTextFileAndUpload,
  BUCKET_CONFIG
};

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
} 