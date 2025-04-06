
const { AccessToken } = require('livekit-server-sdk');

/**
 * Sets up LiveKit related routes
 * @param {Express} app - Express application
 */
const setupLiveKitRoutes = (app) => {
  const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
  const livekitHost = process.env.LIVEKIT_SERVER_URL || 'wss://dartopia-gvu1e64v.livekit.cloud';

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_SERVER_URL) {
    console.warn('LiveKit environment variables not set properly, using default values for development');
  }

  // LiveKit token generation route
  app.get('/livekit/token', (req, res) => {
    try {
      const { identity, room } = req.query;

      if (!identity || !room) {
        return res.status(400).json({ error: 'Missing required parameters: identity and room' });
      }

      console.log(`Generating token for ${identity} in room ${room}`);

      // Create a new access token with the API key and secret
      const token = new AccessToken(apiKey, apiSecret, {
        identity: identity,
        name: identity // Use identity as the participant name
      });

      // Grant permissions to the room
      token.addGrant({ 
        roomJoin: true, 
        room,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      });

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
  
  // Add room creation endpoint
  app.post('/livekit/rooms', async (req, res) => {
    try {
      const { roomName } = req.body;
      
      if (!roomName) {
        return res.status(400).json({ error: 'Room name is required' });
      }
      
      console.log(`Room creation requested: ${roomName}`);
      
      // For this demo, we'll return a success message without actually creating a room via the LiveKit API
      // In a production environment, you would use the RoomService from livekit-server-sdk
      const room = {
        name: roomName,
        emptyTimeout: 10 * 60, // 10 minutes
        maxParticipants: 20,
        creationTime: new Date().toISOString()
      };
      
      res.json({ 
        success: true, 
        room
      });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: 'Failed to create room: ' + error.message });
    }
  });

  // List rooms endpoint
  app.get('/livekit/rooms', async (req, res) => {
    try {
      // In a production environment, you would fetch the rooms from LiveKit
      // For now, return a mock response
      res.json({
        rooms: [
          {
            name: 'default-room',
            emptyTimeout: 10 * 60,
            maxParticipants: 20,
            creationTime: new Date().toISOString(),
            numParticipants: 0
          }
        ]
      });
    } catch (error) {
      console.error('Error listing rooms:', error);
      res.status(500).json({ error: 'Failed to list rooms: ' + error.message });
    }
  });

  console.log('LiveKit routes initialized');
};

module.exports = { setupLiveKitRoutes };
