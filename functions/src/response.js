
const axios = require("axios");
const twilio = require("twilio");
const accountSid = "AC5eb00789706e66f99a5845f749a0e6bb";
const authToken = "b27bb9337b344a797aed211243b178d9";
const client = twilio(accountSid, authToken);


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


  sendWhatsappMessage: async (body, from, to) => {
    return await client.messages.create({
      body, // Message text
      from, // Your Twilio WhatsApp number
      to, // Recipient's WhatsApp number
    });
  },


};


// (async () => {
//   console.log("Sending message");
//   const response = await module.exports.sendWhatsappMessage(
// "Hello", "whatsapp:+14155238886", "whatsapp:+919356099515", );
//   console.log("response => ", response);
// })();
