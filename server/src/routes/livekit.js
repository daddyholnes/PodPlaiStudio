
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
const livekitUrl = process.env.LIVEKIT_SERVER_URL || 'wss://demo.livekit.cloud';

console.log('Setting up LiveKit routes with environment variables:');
console.log(`- API_KEY: ${apiKey}`);
console.log(`- LIVEKIT_URL: ${livekitUrl}`);

// Create a new room
router.post('/create-room', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }
    
    // You would normally use the LiveKit RoomService for this,
    // but for demo purposes, we'll just return success
    // In a production environment, you would verify the room exists or create it
    
    return res.status(200).json({ room: name });
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({ error: 'Failed to create room' });
  }
});

// Generate token to join a room
router.post('/join-room', (req, res) => {
  try {
    const { room, identity } = req.body;
    
    if (!room || !identity) {
      return res.status(400).json({ error: 'Room and identity are required' });
    }
    
    // Create a new token
    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: 60 * 60 // 1 hour
    });
    
    // Grant permissions to the room
    token.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });
    
    const jwt = token.toJwt();
    return res.status(200).json({ token: jwt });
    
  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

export default router;
