
import express from 'express';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config();

const API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';
const LIVEKIT_URL = process.env.LIVEKIT_SERVER_URL || 'wss://demo.livekit.cloud';

/**
 * Set up LiveKit routes for token generation and room management
 * @param {express.Express} app - Express application
 */
export function setupLiveKitRoutes(app) {
  console.log("Setting up LiveKit routes with environment variables:");
  console.log(`- API_KEY: ${API_KEY}`);
  console.log(`- LIVEKIT_URL: ${LIVEKIT_URL}`);
  
  // Route to create a room
  app.post('/api/livekit/create-room', (req, res) => {
    const { roomName } = req.body;
    
    if (!roomName) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    console.log(`Creating room: ${roomName}`);
    
    // In a real implementation, you would use the LiveKit server API to create a room
    // For now, we'll simulate a successful room creation
    const roomInfo = {
      name: roomName,
      created: new Date().toISOString()
    };
    console.log('Room created successfully:', roomInfo);
    res.status(201).json(roomInfo);
  });

  // Route to generate a token for a participant to join a room
  app.post('/api/livekit/token', (req, res) => {
    const { roomName, participantName } = req.body;
    
    if (!roomName || !participantName) {
      console.error('Missing required fields:', { roomName, participantName });
      return res.status(400).json({ error: 'Room name and participant name are required' });
    }

    console.log(`Generating token for ${participantName} to join room ${roomName}`);
    
    try {
      // Create a new access token
      const token = new AccessToken(API_KEY, API_SECRET, {
        identity: participantName,
      });
      
      // Grant permissions to the room
      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
      });

      const jwt = token.toJwt();
      console.log('Token generated successfully');
      console.log('LiveKit connection URL:', LIVEKIT_URL);
      
      // Return the token
      res.json({ token: jwt });
    } catch (error) {
      console.error('Error generating token:', error);
      res.status(500).json({ error: `Failed to generate token: ${error.message}` });
    }
  });
}

export default { setupLiveKitRoutes };
