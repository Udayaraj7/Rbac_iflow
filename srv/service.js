// const cds = require('@sap/cds');

// module.exports = cds.service.impl(async function () {

//   const { Products } = this.entities;

//   this.before('CREATE', Products.drafts, async (req) => {
//     try {
//       console.log('=== Creating Product Draft ===');

//       const user = req.user;
//       if (!user) {
//         return req.error(401, 'Not authenticated');
//       }



//       // Connect to destination
//       let numberTrigger;
//       try {
//         numberTrigger = await cds.connect.to('numberTrigger');
//       } catch (err) {
//         console.error('Cannot connect:', err.message);
//         return req.error(502, 'Number service unavailable');
//       }

//       // Call iFlow
//       let response;
//       try {
//         response = await numberTrigger.send('GET', '/');
//         if (!response) throw new Error('Empty response');
//       } catch (err) {
//         console.error('Failed:', err.message);
//         return req.error(502, `Failed to generate ID: ${err.message}`);
//       }

//       req.data.id = `PRD--${response}`;
//       console.log('Generated ID:', req.data.id);

//     } catch (error) {
//       console.error('Unexpected error:', error.message);
//       return req.error(500, error.message);
//     }
//   });



// });

const cds   = require('@sap/cds');
const axios = require('axios');

module.exports = cds.service.impl(async function () {

  const { Products } = this.entities;

  this.before('CREATE', Products.drafts, async (req) => {

 try {
      const userId = req.user.id

      // Get JWT token from request headers
      const authHeader = req.headers?.authorization || ''
      const jwtToken = authHeader.replace('Bearer ', '')
      console.log('Received JWT token:', jwtToken);

      if (!jwtToken) {
        console.log('No JWT token found')
        return
      }

      // Decode JWT payload
      const base64Payload = jwtToken.split('.')[1]
      const payload = JSON.parse(
        Buffer.from(base64Payload, 'base64').toString('utf8')
      )

      // Get role collections from token
      const roleCollections = payload['xs.system.attributes']?.['xs.rolecollections'] || []

      // Get scopes from token
      const scopes = payload.scope || []

      console.log('===========================================')
      console.log('User ID       :', userId)
      console.log('Role Collections:', JSON.stringify(roleCollections, null, 2))
      console.log('Scopes        :', JSON.stringify(scopes, null, 2))
      console.log('===========================================')

      // Check specific role collection
      if (roleCollections.includes('iflow-numberRange')) {
        console.log('User include iflow-numberRange')

         try {
      const user = req.user;
      if (!user) return req.error(401, 'Not authenticated');



// Debug — print all env vars on startup
console.log('==== ENV CHECK ====');
console.log('OAUTH_TOKEN_URL:',     process.env.OAUTH_TOKEN_URL);
console.log('OAUTH_CLIENT_ID:',     process.env.OAUTH_CLIENT_ID);
console.log('OAUTH_CLIENT_SECRET:', process.env.OAUTH_CLIENT_SECRET);
console.log('IFLOW_URL:',           process.env.IFLOW_URL);
console.log('===================');

    
    

      let iFlowToken;
      try {
        const tokenResponse = await axios.post(
          "https://c0db9fedtrial.authentication.us10.hana.ondemand.com/oauth/token",
          new URLSearchParams({
            grant_type:    'client_credentials',
            client_id:   "sb-f154d22b-39de-4b5f-98a4-25fc6c066a73!b627562|it-rt-c0db9fedtrial!b55215"  ,
            client_secret: "b466a1d0-5a82-47b6-98e3-88c1f90c14a5$_J9y0zyd63Nkia0YXp8S4fA6Ez0eS9UJCgU2lgeIhTk="
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        iFlowToken = tokenResponse.data.access_token;
        console.log('✅ Token generated');
      } catch (err) {
        console.error('Token generation failed:', err.message);
        return req.error(502, 'Failed to get iFlow token');
      }

      let response;
      try {
        const iFlowResponse = await axios.get("https://c0db9fedtrial.it-cpitrial06-rt.cfapps.us10-001.hana.ondemand.com/http/number", {
          headers: {
            Authorization:  `Bearer ${iFlowToken}`,
            'Content-Type': 'application/json',
          },
        });
        response = iFlowResponse.data;
        console.log('✅ iFlow response:', response);
      } catch (err) {
        return req.error(502, `Failed to trigger iFlow: ${err.message}`);
      }

      req.data.id = `PRD--${response}`;
      console.log('Generated ID:', req.data.id);

    } catch (error) {
      console.error('Unexpected error:', error.message);
      return req.error(500, error.message);
    }



      } else {
        return req.error(403, 'Access denied to iFlow.------')
      }

    } catch (err) {
      console.error('Error reading token:', err.message)
    }
  


   
  });
});