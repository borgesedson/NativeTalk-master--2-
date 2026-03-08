import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("Stream API key or Secret is missing");
}

export const streamClient = StreamChat.getInstance(apiKey, apiSecret);

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
    // ensure userId is a string
    const userIdStr = userId.toString();
    return streamClient.createToken(userIdStr);
  } catch (error) {
    console.error("Error generating Stream token:", error);
  }
};
