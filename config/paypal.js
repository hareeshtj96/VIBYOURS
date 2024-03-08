const paypal = require('paypal-rest-sdk');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'Aew_9QXs6uIPPZ-D93id84JgWaJ0BUnd1bIRBQTtHZQDvLSyqvU8iFVHhbK5iCNkHm8XLerOl9JtLd5t',
    'client_secret': 'EAUvWy32LWlEIFHoXb_0foMEc95pFauvu4CyBhVUri2274xtmwBgrl-Wg7q8wVFnyuFkHBwVHh8VSCCd'
  });


  module.exports= {
    paypal,
  }