
import express from 'express';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config();

const API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';
const LIVEKIT_URL = process.env.LIVEKIT_SERVER_URL || 'ws://localhost:7880';

/**
 * Set up LiveKit routes for token generation and room management
 * @param {express.Express} app - Express application
 */
export function setupLiveKitRoutes(app) {
  // Route to create a room
  app.post('/api/livekit/create-room', (req, res) => {
    const { roomName } = req.body;
    
    if (!roomName) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    console.log(`Creating room: ${roomName}`);
    
    // In a real implementation, you would use the LiveKit server API to create a room
    // For now, we'll simulate a successful room creation
    res.status(201).json({
      name: roomName,
      created: new Date().toISOString()
    });
  });

  // Route to generate a token for a participant to join a room
  app.post('/api/livekit/token', (req, res) => {
    const { roomName, participantName } = req.body;
    
    if (!roomName || !participantName) {
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

      // Return the token
      res.json({ token: token.toJwt() });
    } catch (error) {
      console.error('Error generating token:', error);
      res.status(500).json({ error: 'Failed to generate token' });
    }
  });
}

export default { setupLiveKitRoutes };
