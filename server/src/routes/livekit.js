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

  // Get a token for a room
  router.post('/token', async (req, res) => {
    try {
      const { roomName = 'default-room', participantName = `user-${Date.now()}` } = req.body;

      // Create token with permissions
      const token = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
      });

      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      });

      res.json({ token: token.toJwt() });
    } catch (error) {
      console.error('Error generating token:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.use('/api/livekit', router);
  console.log('LiveKit routes initialized');
};

module.exports = { setupLiveKitRoutes };