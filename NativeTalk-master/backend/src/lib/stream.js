import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET;

console.log('🔗 Stream Client Init:', {
  hasKey: !!apiKey,
  hasSecret: !!apiSecret,
  keyPrefix: apiKey ? apiKey.substring(0, 4) : 'none'
});

if (!apiKey || !apiSecret) {
  console.error("❌ Stream API key or Secret is missing!");
}

export const streamClient = StreamChat.getInstance(apiKey, apiSecret);
console.log('✅ Stream Client Instance created');

export const upsertStreamUser = async (userData) => {
  try {
    await streamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    if (error.message?.includes("deleted")) {
      console.log(`♻️ User ${userData.id} was previously deleted. Attempting resurrection...`);
      try {
        // Force hard delete to clear the 'deleted' state
        await streamClient.deleteUser(userData.id, { hard: true });
        // Try creating again
        await streamClient.upsertUsers([userData]);
        console.log("♻️ User resurrection successful!");
        return userData;
      } catch (restoreError) {
        console.error("Critical: Failed to restore deleted user:", restoreError);
      }
    }
    console.error("Error upserting Stream user:", error);
  }
};

export const generateStreamToken = (userId) => {
  try {
    if (!userId) throw new Error("userId is required for token generation");
    const userIdStr = userId.toString();
    console.log(`🎫 Generating token for user: ${userIdStr}`);
    const token = streamClient.createToken(userIdStr);
    console.log(`✅ Token generated successfully`);
    return token;
  } catch (error) {
    console.error("❌ Error generating Stream token:", error.message);
    throw error; // Rethrow so controller handles it
  }
};
