// DealFlow - Simple File-Based Storage (MVP)
// Later: Migrate to Supabase

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const STREAMS_FILE = path.join(DATA_DIR, 'streams.json');
const INTENTS_FILE = path.join(DATA_DIR, 'buyer_intents.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// Read JSON file
async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

// Write JSON file
async function writeJSON(filePath, data) {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Create a new stream session
async function createStream(streamUrl, sellerEmail = null) {
  const streams = await readJSON(STREAMS_FILE);
  
  const stream = {
    id: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sellerEmail,
    url: streamUrl,
    startedAt: new Date().toISOString(),
    endedAt: null,
    totalIntents: 0,
    totalMessages: 0,
    estimatedValue: 0,
    status: 'active'
  };
  
  streams.push(stream);
  await writeJSON(STREAMS_FILE, streams);
  
  console.log('✅ Created stream session:', stream.id);
  return stream;
}

// End a stream session
async function endStream(streamId) {
  const streams = await readJSON(STREAMS_FILE);
  const stream = streams.find(s => s.id === streamId);
  
  if (stream) {
    stream.endedAt = new Date().toISOString();
    stream.status = 'ended';
    await writeJSON(STREAMS_FILE, streams);
    console.log('✅ Ended stream session:', streamId);
  }
  
  return stream;
}

// Save buyer intent
async function saveBuyerIntent(streamId, buyerData) {
  const intents = await readJSON(INTENTS_FILE);
  
  const intent = {
    id: `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    streamId,
    username: buyerData.username,
    message: buyerData.message,
    timestamp: buyerData.timestamp || new Date().toISOString(),
    itemWanted: extractItemWanted(buyerData.message),
    status: 'alerted',
    estimatedValue: 50
  };
  
  intents.push(intent);
  await writeJSON(INTENTS_FILE, intents);
  
  // Update stream stats
  await updateStreamStats(streamId);
  
  console.log('✅ Saved buyer intent:', intent.id);
  return intent;
}

// Update stream statistics
async function updateStreamStats(streamId) {
  const streams = await readJSON(STREAMS_FILE);
  const intents = await readJSON(INTENTS_FILE);
  
  const stream = streams.find(s => s.id === streamId);
  if (!stream) return;
  
  const streamIntents = intents.filter(i => i.streamId === streamId);
  stream.totalIntents = streamIntents.length;
  stream.estimatedValue = streamIntents.reduce((sum, i) => sum + (i.estimatedValue || 50), 0);
  
  await writeJSON(STREAMS_FILE, streams);
}

// Get stream by ID
async function getStream(streamId) {
  const streams = await readJSON(STREAMS_FILE);
  return streams.find(s => s.id === streamId);
}

// Get all streams (for dashboard)
async function getAllStreams(limit = 50) {
  const streams = await readJSON(STREAMS_FILE);
  return streams
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, limit);
}

// Get buyer intents for a stream
async function getStreamIntents(streamId) {
  const intents = await readJSON(INTENTS_FILE);
  return intents
    .filter(i => i.streamId === streamId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// Get stream summary (for post-stream email)
async function getStreamSummary(streamId) {
  const stream = await getStream(streamId);
  if (!stream) return null;
  
  const intents = await getStreamIntents(streamId);
  
  const summary = {
    ...stream,
    intents,
    totalBuyers: intents.length,
    totalValue: intents.reduce((sum, i) => sum + (i.estimatedValue || 50), 0),
    alertedButNotResponded: intents.filter(i => i.status === 'alerted').length,
    duration: stream.endedAt 
      ? Math.round((new Date(stream.endedAt) - new Date(stream.startedAt)) / 1000 / 60) 
      : null
  };
  
  return summary;
}

// Simple item extraction (basic NLP)
function extractItemWanted(message) {
  const lowerMsg = message.toLowerCase();
  
  // Look for product mentions
  const productWords = ['jacket', 'sweater', 'shirt', 'pants', 'shoes', 'hat', 'watch', 'card', 'jersey'];
  for (const word of productWords) {
    if (lowerMsg.includes(word)) {
      return word;
    }
  }
  
  // Look for "the X" pattern
  const theMatch = lowerMsg.match(/the\s+(\w+)/);
  if (theMatch) {
    return theMatch[1];
  }
  
  // Look for "that X" pattern
  const thatMatch = lowerMsg.match(/that\s+(\w+)/);
  if (thatMatch) {
    return thatMatch[1];
  }
  
  return 'item';
}

module.exports = {
  createStream,
  endStream,
  saveBuyerIntent,
  getStream,
  getAllStreams,
  getStreamIntents,
  getStreamSummary,
  updateStreamStats
};

