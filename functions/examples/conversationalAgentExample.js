/**
 * Examples demonstrating how to send and get data from Google Conversational Agent
 * This file shows various ways to interact with the Dialogflow CX agent
 */

const { ConversationManager } = require('../src/conversationManager');
const { DialogflowCXService } = require('../src/dialogflowCXService');

class ConversationalAgentExamples {
  constructor() {
    this.conversationManager = new ConversationManager();
    this.cxService = new DialogflowCXService();
  }

  /**
   * Example 1: Basic message sending to conversational agent
   */
  async basicMessageExample() {
    console.log("=== Example 1: Basic Message Sending ===");
    
    try {
      const userId = "example_user_1";
      const message = "set my language to kannada and Get me mandi prices for wheat?";
      
      console.log(`Sending message: "${message}"`);
      
      const response = await this.conversationManager.sendToAgent(
        message, 
        userId, 
        { source: "example" }
      );
      
      console.log("Agent Response:", JSON.stringify(response, null, 2));
      
      return response;
    } catch (error) {
      console.error("Error in basic message example:", error);
    }
  }

  /**
   * Example 2: Getting data with specific intent
   */
  async intentBasedDataExample() {
    console.log("\n=== Example 2: Intent-based Data Retrieval ===");
    
    try {
      const userId = "example_user_2";
      
      // Weather intent example
      console.log("Getting weather data...");
      const weatherResponse = await this.conversationManager.getDataFromAgent(
        "weather.check",
        { location: "Delhi" },
        userId
      );
      console.log("Weather Response:", JSON.stringify(weatherResponse, null, 2));
      
      // Crop advisory intent example
      console.log("\nGetting crop advisory data...");
      const cropResponse = await this.conversationManager.getDataFromAgent(
        "crop.advisory",
        { crop_name: "rice", location: "Punjab" },
        userId
      );
      console.log("Crop Advisory Response:", JSON.stringify(cropResponse, null, 2));
      
      // Market prices intent example
      console.log("\nGetting market prices data...");
      const priceResponse = await this.conversationManager.getDataFromAgent(
        "market.prices",
        { commodity: "wheat" },
        userId
      );
      console.log("Market Prices Response:", JSON.stringify(priceResponse, null, 2));
      
      return { weatherResponse, cropResponse, priceResponse };
    } catch (error) {
      console.error("Error in intent-based data example:", error);
    }
  }

  /**
   * Example 3: Sending structured data to agent
   */
  async structuredDataExample() {
    console.log("\n=== Example 3: Structured Data Sending ===");
    
    try {
      const userId = "example_user_3";
      
      // Weather request with structured data
      const weatherData = {
        location: "Bangalore",
        parameters: ["temperature", "humidity", "wind_speed", "conditions"],
        timeframe: "current",
        units: "metric"
      };
      
      console.log("Sending weather request data:", weatherData);
      const weatherResponse = await this.conversationManager.sendStructuredData(
        weatherData,
        userId,
        "weather_request"
      );
      console.log("Weather Response:", JSON.stringify(weatherResponse, null, 2));
      
      // Crop inquiry with structured data
      const cropData = {
        crop: "tomato",
        region: "Maharashtra",
        aspects: ["growing_season", "soil_requirements", "irrigation", "pest_management"],
        farm_size: "5 acres",
        experience_level: "beginner"
      };
      
      console.log("\nSending crop inquiry data:", cropData);
      const cropResponse = await this.conversationManager.sendStructuredData(
        cropData,
        userId,
        "crop_inquiry"
      );
      console.log("Crop Response:", JSON.stringify(cropResponse, null, 2));
      
      // Market data request
      const marketData = {
        commodities: ["rice", "wheat", "onion", "potato"],
        market: "APMC Mumbai",
        date_range: "last_week",
        price_type: "wholesale"
      };
      
      console.log("\nSending market data request:", marketData);
      const marketResponse = await this.conversationManager.sendStructuredData(
        marketData,
        userId,
        "market_data"
      );
      console.log("Market Response:", JSON.stringify(marketResponse, null, 2));
      
      return { weatherResponse, cropResponse, marketResponse };
    } catch (error) {
      console.error("Error in structured data example:", error);
    }
  }

  /**
   * Example 4: Batch processing multiple messages
   */
  async batchProcessingExample() {
    console.log("\n=== Example 4: Batch Message Processing ===");
    
    try {
      const userId = "example_user_4";
      
      const messages = [
        { index: 0, text: "Hello, I need help with farming" },
        { index: 1, text: "What's the weather in Chennai today?" },
        { index: 2, text: "How to grow rice in Tamil Nadu?" },
        { index: 3, text: "What are the current prices of rice?" },
        { index: 4, text: "Best fertilizer for wheat crop?" }
      ];
      
      console.log("Processing batch of messages:", messages.map(m => m.text));
      
      const batchResponse = await this.conversationManager.processBatch(messages, userId);
      console.log("Batch Processing Results:", JSON.stringify(batchResponse, null, 2));
      
      return batchResponse;
    } catch (error) {
      console.error("Error in batch processing example:", error);
    }
  }

  /**
   * Example 5: Conversation flow with follow-up questions
   */
  async conversationFlowExample() {
    console.log("\n=== Example 5: Conversation Flow ===");
    
    try {
      const userId = "example_user_5";
      
      // Initial query
      console.log("1. Initial query...");
      const response1 = await this.conversationManager.sendToAgent(
        "I want to start farming",
        userId,
        { source: "conversation_flow" }
      );
      console.log("Response 1:", response1.message);
      
      // Follow-up based on response
      console.log("\n2. Follow-up query...");
      const response2 = await this.conversationManager.sendToAgent(
        "I have 10 acres of land in Karnataka",
        userId,
        { source: "conversation_flow" }
      );
      console.log("Response 2:", response2.message);
      
      // Specific crop inquiry
      console.log("\n3. Specific crop inquiry...");
      const response3 = await this.conversationManager.sendToAgent(
        "What crops are best for my region during monsoon season?",
        userId,
        { source: "conversation_flow" }
      );
      console.log("Response 3:", response3.message);
      
      // Get conversation history
      console.log("\n4. Getting conversation history...");
      const history = this.conversationManager.getConversationHistory(userId);
      console.log("Conversation History Length:", history.length);
      console.log("Last conversation:", history[history.length - 1]);
      
      return { response1, response2, response3, history };
    } catch (error) {
      console.error("Error in conversation flow example:", error);
    }
  }

  /**
   * Example 6: Direct Dialogflow CX service usage
   */
  async directCXServiceExample() {
    console.log("\n=== Example 6: Direct CX Service Usage ===");
    
    try {
      const userId = "example_user_6";
      const userInput = "Check soil conditions for wheat farming";
      
      console.log(`Direct CX Service call: "${userInput}"`);
      
      const response = await this.cxService.sendToConversationalAgent(
        userInput,
        userId,
        "direct_api"
      );
      
      console.log("Direct CX Response:", JSON.stringify(response, null, 2));
      
      return response;
    } catch (error) {
      console.error("Error in direct CX service example:", error);
    }
  }

  /**
   * Example 7: Error handling and fallback scenarios
   */
  async errorHandlingExample() {
    console.log("\n=== Example 7: Error Handling ===");
    
    try {
      const userId = "example_user_7";
      
      // Test with unclear intent
      console.log("1. Testing unclear intent...");
      const unclearResponse = await this.conversationManager.sendToAgent(
        "Something something random text xyz",
        userId,
        { source: "error_test" }
      );
      console.log("Unclear Intent Response:", unclearResponse.message);
      
      // Test with missing parameters
      console.log("\n2. Testing missing parameters...");
      const missingParamsResponse = await this.conversationManager.getDataFromAgent(
        "weather.check",
        {}, // No location provided
        userId
      );
      console.log("Missing Parameters Response:", JSON.stringify(missingParamsResponse, null, 2));
      
      // Test with invalid intent
      console.log("\n3. Testing invalid intent...");
      const invalidIntentResponse = await this.conversationManager.getDataFromAgent(
        "invalid.intent",
        { test: "data" },
        userId
      );
      console.log("Invalid Intent Response:", JSON.stringify(invalidIntentResponse, null, 2));
      
      return { unclearResponse, missingParamsResponse, invalidIntentResponse };
    } catch (error) {
      console.error("Error in error handling example:", error);
    }
  }

  /**
   * Example 8: Agent testing and statistics
   */
  async agentTestingExample() {
    console.log("\n=== Example 8: Agent Testing ===");
    
    try {
      // Test agent connectivity
      console.log("Testing agent connectivity...");
      const testResults = await this.conversationManager.testAgentConnection("test_user");
      console.log("Test Results:", JSON.stringify(testResults, null, 2));
      
      // Get agent statistics
      console.log("\nGetting agent statistics...");
      const stats = this.conversationManager.getAgentStats();
      console.log("Agent Statistics:", JSON.stringify(stats, null, 2));
      
      return { testResults, stats };
    } catch (error) {
      console.error("Error in agent testing example:", error);
    }
  }

  /**
   * Run all examples
   */
  async runAllExamples() {
    console.log("🤖 Google Conversational Agent Examples");
    console.log("=========================================");
    
    try {
      const results = {};
      
      results.basic = await this.basicMessageExample();
      // results.intentBased = await this.intentBasedDataExample();
      // results.structuredData = await this.structuredDataExample();
      // results.batchProcessing = await this.batchProcessingExample();
      // results.conversationFlow = await this.conversationFlowExample();
      // results.directCX = await this.directCXServiceExample();
      // results.errorHandling = await this.errorHandlingExample();
      // results.testing = await this.agentTestingExample();
      
      console.log("\n🎉 All examples completed!");
      console.log("Check the individual results above for detailed responses.");
      
      return results;
    } catch (error) {
      console.error("Error running examples:", error);
    }
  }
}

// HTTP API Usage Examples
class HTTPAPIExamples {
  constructor(baseUrl = 'http://localhost:5001/hack2skill-hackathon-85db2/us-central1/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Example using fetch to send message to agent
   */
  async httpSendMessageExample() {
    console.log("\n=== HTTP API: Send Message Example ===");
    
    try {
      const response = await fetch(`${this.baseUrl}/send-to-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "What's the weather in Mumbai?",
          userId: "http_user_1",
          source: "web"
        })
      });
      
      const data = await response.json();
      console.log("HTTP Response:", JSON.stringify(data, null, 2));
      
      return data;
    } catch (error) {
      console.error("Error in HTTP send message example:", error);
    }
  }

  /**
   * Example using fetch to get data with specific intent
   */
  async httpGetDataExample() {
    console.log("\n=== HTTP API: Get Data Example ===");
    
    try {
      const response = await fetch(`${this.baseUrl}/get-data-from-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: "weather.check",
          parameters: { location: "Delhi" },
          userId: "http_user_2"
        })
      });
      
      const data = await response.json();
      console.log("HTTP Get Data Response:", JSON.stringify(data, null, 2));
      
      return data;
    } catch (error) {
      console.error("Error in HTTP get data example:", error);
    }
  }

  /**
   * Example using axios to send structured data
   */
  async httpStructuredDataExample() {
    console.log("\n=== HTTP API: Structured Data Example ===");
    
    try {
      const axios = require('axios');
      
      const response = await axios.post(`${this.baseUrl}/send-structured-data`, {
        data: {
          location: "Bangalore",
          parameters: ["temperature", "humidity", "conditions"]
        },
        userId: "http_user_3",
        context: "weather_request"
      });
      
      console.log("HTTP Structured Data Response:", JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error("Error in HTTP structured data example:", error);
    }
  }

  /**
   * Example batch processing via HTTP
   */
  async httpBatchProcessingExample() {
    console.log("\n=== HTTP API: Batch Processing Example ===");
    
    try {
      const response = await fetch(`${this.baseUrl}/batch-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { index: 0, text: "Hello" },
            { index: 1, text: "Weather in Chennai?" },
            { index: 2, text: "Rice farming tips?" }
          ],
          userId: "http_user_4"
        })
      });
      
      const data = await response.json();
      console.log("HTTP Batch Processing Response:", JSON.stringify(data, null, 2));
      
      return data;
    } catch (error) {
      console.error("Error in HTTP batch processing example:", error);
    }
  }

  /**
   * Run all HTTP examples
   */
  async runAllHTTPExamples() {
    console.log("\n🌐 HTTP API Examples");
    console.log("====================");
    
    const results = {};
    
    results.sendMessage = await this.httpSendMessageExample();
    results.getData = await this.httpGetDataExample();
    results.structuredData = await this.httpStructuredDataExample();
    results.batchProcessing = await this.httpBatchProcessingExample();
    
    console.log("\n🎉 All HTTP examples completed!");
    
    return results;
  }
}

// Export classes for use
module.exports = {
  ConversationalAgentExamples,
  HTTPAPIExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  async function runExamples() {
    const examples = new ConversationalAgentExamples();
    await examples.runAllExamples();
    
    // Uncomment to run HTTP examples (requires running server)
    // const httpExamples = new HTTPAPIExamples();
    // await httpExamples.runAllHTTPExamples();
  }
  
  runExamples().catch(console.error);
} 