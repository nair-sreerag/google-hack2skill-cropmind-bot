/**
 * Simple example demonstrating how to send text messages to Dialogflow CX
 * and receive responses from the Google Conversational Agent
 */

const { DialogflowCXService } = require('../src/dialogflowCXService');

async function main() {
  console.log("🤖 Simple Dialogflow CX Chat Example");
  console.log("====================================\n");

  // Initialize the service
  const dialogflowService = new DialogflowCXService();
  
  // Generate a unique session ID
  const sessionId = dialogflowService.generateSessionId("demo_user");
  console.log(`📋 Session ID: ${sessionId}\n`);

  // Example messages to send
  const messages = [
    "Hello",
    "Tell me about the soil quality in hampi in kannada?",
    "Tell me about crop prices",
    "Thank you"
  ];

  // Send each message and display the response
  for (const message of messages) {
    try {
      console.log(`👤 User: ${message}`);
      
      const response = await dialogflowService.sendMessage(message, sessionId);
      
      if (response.success) {
        console.log(`🤖 Agent: ${response.messages.join(' ')}`);
        
        if (response.intent) {
          console.log(`💡 Detected Intent: ${response.intent.displayName} (${(response.intent.confidence * 100).toFixed(1)}%)`);
        }
        
        if (Object.keys(response.parameters).length > 0) {
          console.log(`📋 Parameters:`, response.parameters);
        }
      } else {
        console.log("❌ Failed to get response");
      }
      
      console.log("─".repeat(50));
      
      // Wait a bit between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error with message "${message}":`, error.message);
      break;
    }
  }
  
  console.log("\n✅ Example completed!");
}

// Helper function for interactive chat
async function interactiveChat() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const dialogflowService = new DialogflowCXService();
  const sessionId = dialogflowService.generateSessionId("interactive_user");
  
  console.log("🗣️  Interactive Chat Mode (type 'quit' to exit)");
  console.log("=" .repeat(50));

  const askQuestion = () => {
    rl.question('\n👤 You: ', async (message) => {
      if (message.toLowerCase() === 'quit') {
        console.log("\n👋 Goodbye!");
        rl.close();
        return;
      }

      try {
        const response = await dialogflowService.sendMessage(message, sessionId);
        
        if (response.success && response.messages.length > 0) {
          console.log(`🤖 Agent: ${response.messages.join(' ')}`);
        } else {
          console.log("🤖 Agent: (No response)");
        }
      } catch (error) {
        console.error("❌ Error:", error.message);
      }

      askQuestion();
    });
  };

  askQuestion();
}

// Run the example
if (require.main === module) {
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i')) {
    interactiveChat().catch(console.error);
  } else {
    main().catch(console.error);
  }
}

module.exports = { main, interactiveChat }; 