// This is a reference for the verify-extension edge function
// The actual function already exists at: supabase/functions/verify-extension/index.ts
// 
// This file documents what the function does:
// 
// 1. Verifies the user's auth token
// 2. Creates a new stream session when monitoring starts
// 3. Tracks extension usage
// 4. Returns the stream_session_id to the extension
//
// The extension calls this endpoint when "Start Monitoring" is clicked
// to create a session that all captured sales will be linked to.

export {};
