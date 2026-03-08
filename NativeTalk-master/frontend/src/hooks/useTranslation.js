import { useState } from "react";
import { translateMessage } from "../lib/api";

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);

  const translate = async (text, targetUserId) => {
    setIsTranslating(true);
    setError(null);

    try {
      const result = await translateMessage(text, targetUserId);
      return result;
    } catch (err) {
      console.error("Translation error:", err);
      setError(err.message || "Failed to translate message");
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    translate,
    isTranslating,
    error,
  };
};
