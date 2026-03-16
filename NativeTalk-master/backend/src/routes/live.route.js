import express from "express";
import crypto from "crypto";
import { StreamChat } from "stream-chat";

const router = express.Router();

// Generate unique 8-char session code (ABC-1234)
function generateSessionCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < 3; i++) code += letters[Math.floor(Math.random() * letters.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += digits[Math.floor(Math.random() * digits.length)];
  return code;
}

// POST /api/live/create — Create a new live session
router.post('/create', async (req, res) => {
  try {
    const { creator_name, language_1, language_2, created_by } = req.body;
    const sessionCode = generateSessionCode();

    console.log(`[Live] Creating session: ${sessionCode} | ${language_1} ↔ ${language_2}`);

    // Insert into DB via direct fetch to InsForge
    const baseUrl = process.env.INSFORGE_BASE_URL || 'https://7qi47s5n.us-west.insforge.app';
    const apiKey = process.env.INSFORGE_API_KEY || process.env.INSFORGE_ANON_KEY;

    const dbRes = await fetch(`${baseUrl}/api/database/records/live_sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify([{
        session_code: sessionCode,
        created_by: created_by || null,
        creator_name: creator_name || 'Anfitrião',
        language_1: language_1 || 'pt',
        language_2: language_2 || 'en',
        status: 'waiting'
      }])
    });

    if (!dbRes.ok) {
      const errText = await dbRes.text();
      console.error('[Live] DB insert error:', errText);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    const data = await dbRes.json();
    console.log(`[Live] Session created: ${sessionCode}`);

    res.json({
      session_code: sessionCode,
      session: data[0] || { session_code: sessionCode, status: 'waiting', language_1, language_2 }
    });
  } catch (error) {
    console.error('[Live] Create error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/live/:code — Get session details
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const baseUrl = process.env.INSFORGE_BASE_URL || 'https://7qi47s5n.us-west.insforge.app';
    const apiKey = process.env.INSFORGE_API_KEY || process.env.INSFORGE_ANON_KEY;

    const dbRes = await fetch(`${baseUrl}/api/database/records/live_sessions?session_code=eq.${code}&select=*`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!dbRes.ok) {
      return res.status(500).json({ error: 'DB query failed' });
    }

    const sessions = await dbRes.json();
    if (!sessions.length) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(sessions[0]);
  } catch (error) {
    console.error('[Live] Get error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/live/:code/join — Guest joins session
router.post('/:code/join', async (req, res) => {
  try {
    const { code } = req.params;
    const { guest_name, language_2 } = req.body;
    const baseUrl = process.env.INSFORGE_BASE_URL || 'https://7qi47s5n.us-west.insforge.app';
    const apiKey = process.env.INSFORGE_API_KEY || process.env.INSFORGE_ANON_KEY;

    // Update session status to active
    const dbRes = await fetch(`${baseUrl}/api/database/records/live_sessions?session_code=eq.${code}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: 'active',
        guest_name: guest_name || 'Convidado',
        ...(language_2 ? { language_2 } : {})
      })
    });

    if (!dbRes.ok) {
      return res.status(500).json({ error: 'Failed to join session' });
    }

    const data = await dbRes.json();
    console.log(`[Live] Guest joined session: ${code}`);
    res.json(data[0] || { status: 'active' });
  } catch (error) {
    console.error('[Live] Join error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/live/:code — End session
router.delete('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const baseUrl = process.env.INSFORGE_BASE_URL || 'https://7qi47s5n.us-west.insforge.app';
    const apiKey = process.env.INSFORGE_API_KEY || process.env.INSFORGE_ANON_KEY;

    const dbRes = await fetch(`${baseUrl}/api/database/records/live_sessions?session_code=eq.${code}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ status: 'ended' })
    });

    console.log(`[Live] Session ended: ${code}`);
    res.json({ status: 'ended' });
  } catch (error) {
    console.error('[Live] End error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/live/:code/stream-token — Generate guest Stream token
router.post('/:code/stream-token', async (req, res) => {
  try {
    const { guest_id, guest_name } = req.body;
    const serverClient = StreamChat.getInstance(
      process.env.STREAM_API_KEY,
      process.env.STREAM_API_SECRET
    );

    const guestUserId = guest_id || `guest-${Date.now()}`;
    
    // Upsert guest user in Stream
    await serverClient.upsertUser({
      id: guestUserId,
      name: guest_name || 'Convidado',
      role: 'user'
    });

    // Get session info from DB to find the creator
    const baseUrl = process.env.INSFORGE_BASE_URL || 'https://7qi47s5n.us-west.insforge.app';
    const apiKey = process.env.INSFORGE_API_KEY || process.env.INSFORGE_ANON_KEY;
    const dbRes = await fetch(`${baseUrl}/api/database/records/live_sessions?session_code=eq.${req.params.code}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    let creatorId = null;
    if (dbRes.ok) {
      const sessions = await dbRes.json();
      creatorId = sessions[0]?.created_by;
    }

    // Admin adds guest directly to channel members (create if missing)
    const cleanCode = req.params.code.replace('-', '').toLowerCase();
    const channelConfig = creatorId ? { created_by_id: creatorId } : {};
    const channel = serverClient.channel('livestream', cleanCode, channelConfig);
    
    await channel.create();
    await channel.addMembers([guestUserId]);

    const token = serverClient.createToken(guestUserId);
    res.json({ token, userId: guestUserId });
  } catch (error) {
    console.error('[Live] Stream token error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
