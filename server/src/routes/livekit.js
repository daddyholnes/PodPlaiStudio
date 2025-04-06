const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
const axios = require('axios');
const router = express.Router();

// LiveKit server details - these should be set in your environment variables
const livekitHost = process.env.LIVEKIT_HOST || 'wss://your-livekit-server.example.com';
const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';

// Create a new room
router.post('/room', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    console.log(`Creating room: ${name}`);

    // Since we're using a simulated environment, we'll just return success
    // In a real implementation, you would create a room via LiveKit API
    // Example with real LiveKit API:
    /*
    const response = await axios.post(`https://${livekitHost}/twirp/livekit.RoomService/CreateRoom`, {
      name,
      empty_timeout: 60, // Room will be deleted after 60 seconds with no participants
    }, {
      headers: {
        'Authorization': `Bearer ${generateAPIKey()}`
      }
    });
    */

    return res.status(200).json({ name });
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({ error: 'Failed to create room' });
  }
});

// Generate a token for a participant to join a room
router.post('/token', (req, res) => {
  try {
    const { room, identity } = req.body;

    if (!room || !identity) {
      return res.status(400).json({ error: 'Room name and identity are required' });
    }

    console.log(`Generating token for ${identity} in room ${room}`);

    // Create a new access token
    const token = new AccessToken(apiKey, apiSecret, {
      identity: identity,
    });

    // Grant permissions for the room
    token.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
    });

    // Generate the JWT token
    const jwt = token.toJwt();
    console.log(`Generated LiveKit token for ${identity} in room ${room}`);

    return res.status(200).json({ token: jwt });
  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router;