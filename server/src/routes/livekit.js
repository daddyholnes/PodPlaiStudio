
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

/**
 * Sets up LiveKit related routes
 * @param {Express} app - Express application
 */
const setupLiveKitRoutes = (app) => {
  const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'devsecret';
  const livekitUrl = process.env.LIVEKIT_SERVER_URL || 'http://0.0.0.0:7880';
  
  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_SERVER_URL) {
    console.warn('LiveKit environment variables not set properly, using default values for development');
  }
  
  let roomService;
  try {
    roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
  } catch (error) {
    console.error('Failed to initialize LiveKit Room Service:', error);
    roomService = null;
  }

  // Generate token for a participant
  app.post('/api/livekit/token', (req, res) => {
    try {
      const { roomName, participantName } = req.body;
      
      if (!roomName || !participantName) {
        return res.status(400).json({ error: 'Room name and participant name are required' });
      }
      
      const token = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
      });
      
      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
      });
      
      res.json({ token: token.toJwt() });
    } catch (error) {
      console.error('Error generating token:', error);
      res.status(500).json({ error: 'Failed to generate token' });
    }
  });

  // Create a new room with additional configuration
  app.post('/api/livekit/rooms', async (req, res) => {
    try {
      const { 
        roomName,
        maxParticipants = 10,
        emptyTimeout = 300,
        metadata = ''
      } = req.body;
      
      if (!roomName) {
        return res.status(400).json({ error: 'Room name is required' });
      }

      if (!roomService) {
        return res.status(503).json({ error: 'LiveKit service unavailable' });
      }
      
      let room;
      try {
        room = await roomService.createRoom({
          name: roomName,
          emptyTimeout,
          maxParticipants,
          metadata
        });
      } catch (error) {
        // If room already exists, try to fetch it instead
        if (error.message.includes('already exists')) {
          const rooms = await roomService.listRooms([roomName]);
          room = rooms[0];
        } else {
          throw error;
        }
      }
      
      if (!room) {
        throw new Error('Failed to create or find room');
      }
      
      res.json({ room });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: 'Failed to create room' });
    }
  });

  // List all rooms or specific rooms
  app.get('/api/livekit/rooms', async (req, res) => {
    try {
      if (!roomService) {
        return res.status(503).json({ error: 'LiveKit service unavailable' });
      }

      const { names } = req.query;
      const roomNames = names ? names.split(',') : null;
      
      const rooms = await roomService.listRooms(roomNames);
      res.json({ rooms });
    } catch (error) {
      console.error('Error listing rooms:', error);
      res.status(500).json({ error: 'Failed to list rooms' });
    }
  });

  // Delete a room
  app.delete('/api/livekit/rooms/:roomName', async (req, res) => {
    try {
      if (!roomService) {
        return res.status(503).json({ error: 'LiveKit service unavailable' });
      }
      
      const { roomName } = req.params;
      await roomService.deleteRoom(roomName);

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ error: 'Failed to delete room' });
    }
  });

  // List participants in a room
  app.get('/api/livekit/rooms/:roomName/participants', async (req, res) => {
    try {
      if (!roomService) {
        return res.status(503).json({ error: 'LiveKit service unavailable' });
      }

      const { roomName } = req.params;
      const participants = await roomService.listParticipants(roomName);
      res.json({ participants });
    } catch (error) {
      console.error('Error listing participants:', error);
      res.status(500).json({ error: 'Failed to list participants' });
    }
  });

  // Remove participant from a room
  app.delete('/api/livekit/rooms/:roomName/participants/:identity', async (req, res) => {
    try {
      if (!roomService) {
        return res.status(503).json({ error: 'LiveKit service unavailable' });
      }

      const { roomName, identity } = req.params;
      await roomService.removeParticipant(roomName, identity);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing participant:', error);
      res.status(500).json({ error: 'Failed to remove participant' });
    }
  });
};

module.exports = { setupLiveKitRoutes };
