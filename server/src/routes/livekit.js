const { AccessToken } = require('livekit-server-sdk');
const express = require('express');
const router = express.Router();

/**
 * Sets up LiveKit related routes
 * @param {Express} app - Express application
 */
const setupLiveKitRoutes = (app) => {
  const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'devsecret';
  const livekitHost = process.env.LIVEKIT_SERVER_URL || 'wss://dartopia-gvu1e64v.livekit.cloud';

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_SERVER_URL) {
    console.warn('LiveKit environment variables not set properly, using default values for development');
  }

  //LiveKit routes implementation
  app.get('/livekit/token', (req, res) => {
    try {
      const { identity, room } = req.query;

      if (!identity || !room) {
        return res.status(400).json({ error: 'Missing required parameters: identity and room' });
      }

      // Get credentials from environment variables
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;

      if (!apiKey || !apiSecret) {
        console.error('LiveKit API credentials not configured');
        return res.status(500).json({ error: 'LiveKit API credentials not configured' });
      }

      // Create a new access token
      const token = new AccessToken(apiKey, apiSecret, {
        identity: identity,
        name: identity // Use identity as the participant name
      });

      // Grant permissions to the room
      token.addGrant({ roomJoin: true, room });

      // Generate the JWT token
      const jwt = token.toJwt();
      console.log(`Generated LiveKit token for ${identity} in room ${room}`);

      // Return the token
      res.json({ token: jwt });
    } catch (error) {
      console.error('Error generating LiveKit token:', error);
      res.status(500).json({ error: 'Failed to generate token: ' + error.message });
    }
  });


  app.use('/api/livekit', router);
  console.log('LiveKit routes initialized');
};

module.exports = { setupLiveKitRoutes };