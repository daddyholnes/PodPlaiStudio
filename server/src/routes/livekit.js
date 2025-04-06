
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
  const livekitHost = process.env.LIVEKIT_SERVER_URL || 'http://localhost:7880';

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_SERVER_URL) {
    console.warn('LiveKit environment variables not set properly, using default values for development');
  }

  const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

  // Create a new room or ensure it exists
  router.post('/rooms', async (req, res) => {
    try {
      const { roomName, maxParticipants = 20, emptyTimeout = 10 * 60, metadata } = req.body;
      
      if (!roomName) {
        return res.status(400).json({ error: 'Room name is required' });
      }
      
      const room = await roomService.createRoom({
        name: roomName,
        emptyTimeout,
        maxParticipants,
        ...(metadata && { metadata })
      });
      
      res.json({ success: true, room });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get a token for a room
  router.post('/token', async (req, res) => {
    try {
      const { roomName = 'default-room', participantName = `user-${Date.now()}` } = req.body;
      
      // Create room if it doesn't exist
      try {
        await roomService.createRoom({
          name: roomName,
          emptyTimeout: 10 * 60,
          maxParticipants: 20,
        });
      } catch (err) {
        // Ignore error if room already exists
        console.log('Room may already exist or could not be created:', err.message);
      }
      
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

  // List rooms
  router.get('/rooms', async (req, res) => {
    try {
      const { names } = req.query;
      const roomNames = names ? names.split(',') : undefined;
      
      const rooms = await roomService.listRooms({ names: roomNames });
      res.json({ rooms });
    } catch (error) {
      console.error('Error listing rooms:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a room
  router.delete('/rooms/:roomName', async (req, res) => {
    try {
      const { roomName } = req.params;
      await roomService.deleteRoom(roomName);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // List participants in a room
  router.get('/rooms/:roomName/participants', async (req, res) => {
    try {
      const { roomName } = req.params;
      const participants = await roomService.listParticipants(roomName);
      res.json({ participants });
    } catch (error) {
      console.error('Error listing participants:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Remove a participant from a room
  router.delete('/rooms/:roomName/participants/:identity', async (req, res) => {
    try {
      const { roomName, identity } = req.params;
      await roomService.removeParticipant(roomName, identity);
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing participant:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.use('/api/livekit', router);
  console.log('LiveKit routes initialized');
};

module.exports = { setupLiveKitRoutes };
