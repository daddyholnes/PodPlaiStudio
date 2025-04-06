
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

// Webhook endpoint to receive LiveKit events
router.post('/webhook', express.json(), (req, res) => {
  try {
    console.log('Received webhook from LiveKit:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Validate webhook request using API key and secret
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    
    // Get LiveKit signature from headers
    const signature = req.headers['livekit-signature'];
    
    if (!signature) {
      console.warn('Missing LiveKit signature header');
      // For testing purposes, continue processing even without signature
      console.log('Continuing without signature validation for testing purposes');
    }
    
    // Accepting all webhooks for development/testing
    console.log('Webhook validation bypassed for development');
    
    // Process webhook event based on type
    const event = req.body;
    switch (event.event) {
      case 'room_started':
        console.log(`Room started: ${event.room?.name || 'unknown'}`);
        console.log(`Room SID: ${event.room?.sid || 'unknown'}`);
        console.log(`Creation time: ${new Date(parseInt(event.room?.creationTime || '0') * 1000).toISOString()}`);
        break;
      case 'room_finished':
        console.log(`Room finished: ${event.room?.name || 'unknown'}`);
        break;
      case 'participant_joined':
        console.log(`Participant joined: ${event.participant?.identity || 'unknown'} in room ${event.room?.name || 'unknown'}`);
        break;
      case 'participant_left':
        console.log(`Participant left: ${event.participant?.identity || 'unknown'} from room ${event.room?.name || 'unknown'}`);
        break;
      default:
        console.log(`Received event: ${event.event}`);
    }
    
    return res.status(200).json({ success: true, message: 'Webhook received and processed' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router;
