
const axios = require("axios");
const twilio = require("twilio");
const accountSid = "AC5eb00789706e66f99a5845f749a0e6bb";
const authToken = "b27bb9337b344a797aed211243b178d9";

const credentials = [
  {
    // hackathon1
    accountSid : "AC5eb00789706e66f99a5845f749a0e6bb",
    authToken : "b27bb9337b344a797aed211243b178d9",
    fromNo: '+17855092245',
  },
  {
    // hackathon2
    accountSid : "AC867be7e77308eab28de571ac7174ef57",
    authToken : "6ee1e482c2616f39ea8d760a576b7e5a",
    fromNo: '+12185598990',
  },
  {
    // hackathon3
    accountSid : "AC104abcf4745e008240038559998ca8e3",
    authToken : "769b618e194792a2c4d098245117e95d",
    fromNo: '+13022404371',
  },

].map((creds) => ({
  ...creds,
  client : twilio(creds.accountSid, creds.authToken)
}));


// const client = twilio(accountSid, authToken);


// console.log("bufferedToken => ", Buffer.from(`${accountSid}:${authToken}`),  module.exports.bufferedToken);


module.exports = {

  bufferedToken : Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
  
  sendMessage: async (method, url, headers, data, meta) => {
    console.log("Sending message", url, headers, data, meta);
    return await axios(
        {
          method,
          url,
          data,
          headers,
          ...meta
        },
    );
  },


  sendWhatsappMessage: async (body, from, to, meta = {}) => {
    return await credentials[0].client.messages.create({
      body, // Message text
      from, // Your Twilio WhatsApp number
      to, // Recipient's WhatsApp number,
      ...meta,
    });
  },

  sendSMS : async(to, message) => {
    return await credentials[0].client.messages.create({
      to,
      from: '+17855092245',
      body: message
    })
  }

};


// (async () => {
//   console.log("Sending message");
//   const response = await module.exports.sendWhatsappMessage(
// "Hello", "whatsapp:+14155238886", "whatsapp:+919356099515", );
//   console.log("response => ", response);
// })();
