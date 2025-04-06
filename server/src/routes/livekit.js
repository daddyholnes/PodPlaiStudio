const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
const express = require('express');
const router = express.Router();

/**
 * Sets up LiveKit related routes
 * @param {Express} app - Express application
 */
const setupLiveKitRoutes = (app) => {
  const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'devsecret';
  const livekitHost = process.env.LIVEKIT_SERVER_URL || 'http://0.0.0.0:7880';

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_SERVER_URL) {
    console.warn('LiveKit environment variables not set properly, using default values for development');
  }

  const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

  router.post('/create-room', async (req, res) => {
    try {
      const { roomName } = req.body;
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 10 * 60, // 10 minutes
        maxParticipants: 20,
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/join-room', (req, res) => {
    try {
      const { roomName, participantName } = req.body;

      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
      });
      at.addGrant({ roomJoin: true, room: roomName });

      const token = at.toJwt();
      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.use('/api/livekit', router);
};

module.exports = { setupLiveKitRoutes };