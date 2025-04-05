const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

/**
 * Sets up LiveKit related routes
 * @param {Express} app - Express application
 */
const setupLiveKitRoutes = (app) => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_SERVER_URL;
  
  if (!apiKey || !apiSecret || !livekitUrl) {
    console.error('LiveKit environment variables not set properly');
  }
  
  const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

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

  // Create a new room
  app.post('/api/livekit/rooms', async (req, res) => {
    try {
      const { roomName } = req.body;
      
      if (!roomName) {
        return res.status(400).json({ error: 'Room name is required' });
      }
      
      const room = await roomService.createRoom({
        name: roomName,
        emptyTimeout: 60, // Delete room after 60 seconds of inactivity
        maxParticipants: 10,
      });
      
      res.json({ room });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: 'Failed to create room' });
    }
  });

  // List all rooms
  app.get('/api/livekit/rooms', async (req, res) => {
    try {
      const rooms = await roomService.listRooms();
      res.json({ rooms });
    } catch (error) {
      console.error('Error listing rooms:', error);
      res.status(500).json({ error: 'Failed to list rooms' });
    }
  });

  // Delete a room
  app.delete('/api/livekit/rooms/:roomName', async (req, res) => {
    try {
      const { roomName } = req.params;
      await roomService.deleteRoom(roomName);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ error: 'Failed to delete room' });
    }
  });
};

module.exports = { setupLiveKitRoutes };
