const { SessionsClient } = require('@google-cloud/dialogflow');
const logger = require("firebase-functions/logger");

class DialogflowService {
  constructor() {
    this.projectId = 'hack2skill-hackathon-85db2'; // Your Firebase project ID
    this.sessionClient = new SessionsClient();
    
    // Define your available APIs and their contracts
    this.availableAPIs = {
      weather: {
        endpoint: '/api/weather',
        method: 'GET',
        requiredParams: ['location'],
        optionalParams: ['units'],
        description: 'Get weather information for a location',
        useCases: ['weather forecast', 'current weather', 'temperature check']
      },
      crop_info: {
        endpoint: '/api/crop',
        method: 'GET', 
        requiredParams: ['crop_name'],
        optionalParams: ['language', 'region'],
        description: 'Get information about crops',
        useCases: ['crop details', 'farming information', 'agricultural data']
      },
      market_prices: {
        endpoint: '/api/market-prices',
        method: 'GET',
        requiredParams: ['commodity'],
        optionalParams: ['market', 'date'],
        description: 'Get market prices for commodities',
        useCases: ['price check', 'market rates', 'commodity prices']
      },
      pest_control: {
        endpoint: '/api/pest-control',
        method: 'POST',
        requiredParams: ['pest_type', 'crop'],
        optionalParams: ['severity', 'organic_only'],
        description: 'Get pest control recommendations',
        useCases: ['pest management', 'disease control', 'crop protection']
      }
    };

    // System prompt for Dialogflow
    this.systemPrompt = this.generateSystemPrompt();
  }

  generateSystemPrompt() {
    const apiDescriptions = Object.entries(this.availableAPIs)
      .map(([key, api]) => {
        return `${key}: ${api.description}
        - Endpoint: ${api.endpoint}
        - Required: ${api.requiredParams.join(', ')}
        - Optional: ${api.optionalParams.join(', ')}
        - Use cases: ${api.useCases.join(', ')}`;
      }).join('\n\n');

    return `You are an AI assistant that helps users access various APIs. Here are the available APIs:

${apiDescriptions}

Your job is to:
1. Understand user queries and map them to appropriate APIs
2. Extract required parameters from user input
3. Identify missing parameters and ask for them
4. Execute API calls when all required data is available
5. Format responses based on user's language preference

Always respond in a helpful and conversational manner.`;
  }

  async detectIntent(sessionId, queryText, languageCode = 'en') {
    try {
      const sessionPath = this.sessionClient.projectAgentSessionPath(
        this.projectId,
        sessionId
      );

      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: queryText,
            languageCode: languageCode,
          },
        },
      };

      const [response] = await this.sessionClient.detectIntent(request);
      return response;
    } catch (error) {
      logger.error('Error detecting intent:', error);
      throw error;
    }
  }

  async processUserQuery(sessionId, userMessage, userLanguage = 'en') {
    try {
      // First, try to detect intent using Dialogflow
      const dialogflowResponse = await this.detectIntent(sessionId, userMessage, userLanguage);
      
      // Extract intent and parameters
      const intent = dialogflowResponse.queryResult.intent.displayName;
      const parameters = dialogflowResponse.queryResult.parameters;
      const confidence = dialogflowResponse.queryResult.intentDetectionConfidence;

      logger.info('Dialogflow response:', {
        intent,
        parameters,
        confidence,
        fulfillmentText: dialogflowResponse.queryResult.fulfillmentText
      });

      // If confidence is low, use fallback processing
      if (confidence < 0.6) {
        return await this.fallbackProcessing(userMessage, userLanguage);
      }

      // Process based on detected intent
      return await this.handleIntent(intent, parameters, userMessage, userLanguage, sessionId);

    } catch (error) {
      logger.error('Error processing user query:', error);
      return await this.fallbackProcessing(userMessage, userLanguage);
    }
  }

  async handleIntent(intent, parameters, originalMessage, userLanguage, sessionId) {
    switch (intent) {
      case 'api.weather':
        return await this.handleWeatherIntent(parameters, userLanguage, sessionId);
      
      case 'api.crop_info':
        return await this.handleCropInfoIntent(parameters, userLanguage, sessionId);
      
      case 'api.market_prices':
        return await this.handleMarketPricesIntent(parameters, userLanguage, sessionId);
      
      case 'api.pest_control':
        return await this.handlePestControlIntent(parameters, userLanguage, sessionId);
      
      default:
        return await this.fallbackProcessing(originalMessage, userLanguage);
    }
  }

  async handleWeatherIntent(parameters, userLanguage, sessionId) {
    const api = this.availableAPIs.weather;
    const location = parameters.fields?.location?.stringValue;

    if (!location) {
      return {
        needsMoreInfo: true,
        message: this.translateMessage("Please specify the location for weather information.", userLanguage),
        missingParams: ['location'],
        apiType: 'weather'
      };
    }

    return {
      readyToExecute: true,
      apiCall: {
        endpoint: api.endpoint,
        method: api.method,
        params: { location },
        apiType: 'weather'
      }
    };
  }

  async handleCropInfoIntent(parameters, userLanguage, sessionId) {
    const api = this.availableAPIs.crop_info;
    const cropName = parameters.fields?.crop_name?.stringValue;

    if (!cropName) {
      return {
        needsMoreInfo: true,
        message: this.translateMessage("Please specify the crop you want information about.", userLanguage),
        missingParams: ['crop_name'],
        apiType: 'crop_info'
      };
    }

    return {
      readyToExecute: true,
      apiCall: {
        endpoint: api.endpoint,
        method: api.method,
        params: { crop_name: cropName, language: userLanguage },
        apiType: 'crop_info'
      }
    };
  }

  async handleMarketPricesIntent(parameters, userLanguage, sessionId) {
    const api = this.availableAPIs.market_prices;
    const commodity = parameters.fields?.commodity?.stringValue;

    if (!commodity) {
      return {
        needsMoreInfo: true,
        message: this.translateMessage("Please specify the commodity for price information.", userLanguage),
        missingParams: ['commodity'],
        apiType: 'market_prices'
      };
    }

    return {
      readyToExecute: true,
      apiCall: {
        endpoint: api.endpoint,
        method: api.method,
        params: { commodity },
        apiType: 'market_prices'
      }
    };
  }

  async handlePestControlIntent(parameters, userLanguage, sessionId) {
    const api = this.availableAPIs.pest_control;
    const pestType = parameters.fields?.pest_type?.stringValue;
    const crop = parameters.fields?.crop?.stringValue;

    const missingParams = [];
    if (!pestType) missingParams.push('pest_type');
    if (!crop) missingParams.push('crop');

    if (missingParams.length > 0) {
      const message = missingParams.length === 2 
        ? this.translateMessage("Please specify the pest type and crop for pest control recommendations.", userLanguage)
        : missingParams[0] === 'pest_type'
          ? this.translateMessage("Please specify the type of pest you're dealing with.", userLanguage)
          : this.translateMessage("Please specify the crop that's affected.", userLanguage);

      return {
        needsMoreInfo: true,
        message,
        missingParams,
        apiType: 'pest_control'
      };
    }

    return {
      readyToExecute: true,
      apiCall: {
        endpoint: api.endpoint,
        method: api.method,
        params: { pest_type: pestType, crop },
        apiType: 'pest_control'
      }
    };
  }

  async fallbackProcessing(userMessage, userLanguage) {
    // Use simple keyword matching as fallback
    const message = userMessage.toLowerCase();
    
    if (message.includes('weather') || message.includes('temperature') || message.includes('forecast')) {
      return {
        needsMoreInfo: true,
        message: this.translateMessage("I can help you with weather information. Please specify the location.", userLanguage),
        suggestedApiType: 'weather',
        missingParams: ['location']
      };
    }
    
    if (message.includes('crop') || message.includes('farming') || message.includes('agriculture')) {
      return {
        needsMoreInfo: true,
        message: this.translateMessage("I can provide crop information. Please specify the crop name.", userLanguage),
        suggestedApiType: 'crop_info',
        missingParams: ['crop_name']
      };
    }
    
    if (message.includes('price') || message.includes('market') || message.includes('cost')) {
      return {
        needsMoreInfo: true,
        message: this.translateMessage("I can check market prices. Please specify the commodity.", userLanguage),
        suggestedApiType: 'market_prices',
        missingParams: ['commodity']
      };
    }
    
    if (message.includes('pest') || message.includes('disease') || message.includes('insect')) {
      return {
        needsMoreInfo: true,
        message: this.translateMessage("I can help with pest control. Please specify the pest type and crop.", userLanguage),
        suggestedApiType: 'pest_control',
        missingParams: ['pest_type', 'crop']
      };
    }

    // If no API matches, show available options
    return {
      needsMoreInfo: true,
      message: this.translateMessage(
        "I can help you with:\n1. Weather information\n2. Crop details\n3. Market prices\n4. Pest control\n\nWhat would you like to know about?", 
        userLanguage
      ),
      showMenu: true
    };
  }

  translateMessage(message, language) {
    // Basic translation logic - you can enhance this with a proper translation service
    const translations = {
      'hi': {
        'Please specify the location for weather information.': 'कृपया मौसम की जानकारी के लिए स्थान बताएं।',
        'Please specify the crop you want information about.': 'कृपया उस फसल का नाम बताएं जिसके बारे में आप जानकारी चाहते हैं।',
        'Please specify the commodity for price information.': 'कृपया मूल्य जानकारी के लिए वस्तु का नाम बताएं।',
        'Please specify the pest type and crop for pest control recommendations.': 'कीट नियंत्रण सुझावों के लिए कृपया कीट का प्रकार और फसल बताएं।',
        'Please specify the type of pest you\'re dealing with.': 'कृपया बताएं कि आप किस प्रकार के कीट से निपट रहे हैं।',
        'Please specify the crop that\'s affected.': 'कृपया बताएं कि कौन सी फसल प्रभावित है।'
      },
      'kn': {
        'Please specify the location for weather information.': 'ಹವಾಮಾನ ಮಾಹಿತಿಗಾಗಿ ದಯವಿಟ್ಟು ಸ್ಥಳವನ್ನು ನಿರ್ದಿಷ್ಟಪಡಿಸಿ।',
        'Please specify the crop you want information about.': 'ದಯವಿಟ್ಟು ನೀವು ಮಾಹಿತಿ ಬಯಸುವ ಬೆಳೆಯನ್ನು ನಿರ್ದಿಷ್ಟಪಡಿಸಿ।',
        'Please specify the commodity for price information.': 'ಬೆಲೆ ಮಾಹಿತಿಗಾಗಿ ದಯವಿಟ್ಟು ಸರಕುಗಳನ್ನು ನಿರ್ದಿಷ್ಟಪಡಿಸಿ।'
      }
    };

    return translations[language]?.[message] || message;
  }

  getAvailableAPIs() {
    return this.availableAPIs;
  }
}

module.exports = { DialogflowService }; 