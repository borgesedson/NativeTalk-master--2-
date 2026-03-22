import { insforge, db, auth, storage } from './insforge';
import { getLanguageCode } from './utils';
import { translationEngine } from './translationEngine';

// Networking Config
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper: converte "English"/"en"/etc para código ISO
const _langCode = (lang) => getLanguageCode(lang);

/**
 * NativeTalk - InsForge Native API Layer
 * This file handles all backend communication through InsForge SDK.
 */

// --- Authentication & User Profile ---

export const login = async (email, password) => {
  try {
    const { data, error } = await auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: data.user, token: data.accessToken };
  } catch (error) {
    throw new Error(error.message || "Erro ao fazer login");
  }
};

export const register = async (name, email, password, native_language) => {
  try {
    const { data, error } = await auth.signUp({
      email,
      password,
      options: {
        data: { name, native_language }
      }
    });

    if (error) throw error;

    if (data.user) {
      // 1. Salvar no auth profile
      try {
        await auth.setProfile({ name, native_language });
      } catch (e) {
        console.warn('Could not set initial profile:', e.message);
      }

      // 2. Inserir na tabela profiles do banco (para busca e amigos)
      try {
        await db.from('profiles').upsert({
          id: data.user.id,
          name,
          email,
          native_language: native_language || 'en-US',
          avatar_url: '',
          bio: '',
          location: '',
          onboarded: false
        });
      } catch (e) {
        console.warn('Could not create DB profile:', e.message);
      }
    }

    return { user: data.user, token: data.accessToken };
  } catch (error) {
    throw new Error(error.message || "Erro ao registrar");
  }
};

export const signup = register;

export const verifyOTP = async (email, otp) => {
  try {
    const { data, error } = await auth.verifyEmail({ email, otp });
    if (error) throw error;
    return { user: data.user, token: data.accessToken };
  } catch (error) {
    throw new Error(error.message || "Erro ao verificar o código OTP");
  }
};

export const logout = async () => {
  try {
    localStorage.removeItem('stream_chat_token');
    localStorage.removeItem('stream_chat_token_time');
    await auth.signOut();
  } catch (error) {
    console.error('Erro no logout:', error);
  }
};
// Cache para evitar auto-create repetido na mesma sessão
let profileAutoCreated = false;

export const getCurrentUser = async () => {
  try {
    const { data, error } = await auth.getCurrentUser();
    const user = data?.user || data;

    console.log('[Auth] Final user extracted:', user?.id);
    if (error || !user) return null;

    // 🔍 DEBUG: Full profile dump
    console.log('[APP LOAD] Auth user retrieved');

    // Buscar perfil do banco usando maybeSingle (retorna null sem erro)
    const { data: dbProfile, error: dbError } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (dbError) {
      console.warn('DB profile fetch warning:', dbError.message);
      // Prevent zombie sessions: If the user's JWT is fully expired, force a logout instead of fallback.
      if (dbError.message?.includes('JWT') || dbError.code === 'PGRST301') {
        await auth.signOut();
        return null;
      }

      // If it's a transient db error, DO NOT auto-create to prevent wiping data!
      // Return a safe fallback from user_metadata instead.
      const fallbackLang = getLanguageCode(user.user_metadata?.native_language || 'en');
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        native_language: fallbackLang,
        avatar_url: user.user_metadata?.avatar_url || '',
        bio: '',
        location: '',
      };
    }

    // Se perfil existe no banco, retornar direto (fonte de verdade)
    if (dbProfile) {
      const result = {
        id: user.id,
        email: user.email,
        ...dbProfile,
        native_language: getLanguageCode(dbProfile.native_language),
      };
      console.log('[APP LOAD] Profile matched DB');
      return result;
    }

    // Se não existe no banco, e dbError é null (realmente não existe) e não tentamos criar...
    if (!profileAutoCreated) {
      profileAutoCreated = true;
      const meta = user.user_metadata || {};
      const newProfile = {
        id: user.id,
        name: meta.name || user.email?.split('@')[0] || 'Usuário',
        email: user.email,
        native_language: getLanguageCode(meta.native_language || 'en'),
        avatar_url: meta.avatar_url || '',
        bio: '',
        location: '',
        onboarded: false
      };

      try {
        // Use insert carefully so we never wipe existing row accidentally
        await db.from('profiles').insert([newProfile]);
      } catch (e) {
        console.warn('Auto-create profile failed (might exist):', e.message);
      }

      return { id: user.id, ...newProfile };
    }

    // Fallback minimal
    const fallbackLang = getLanguageCode(user.user_metadata?.native_language || 'en');
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
      native_language: fallbackLang,
      avatar_url: user.user_metadata?.avatar_url || '',
      bio: '',
      location: '',
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
};

export const getAuthUser = getCurrentUser;

// Atualizar perfil — salva no auth E na tabela profiles do banco
export const updateProfile = async (formData) => {
  try {
    const { data: { user } } = await auth.getCurrentUser();
    if (!user) throw new Error("Usuário não autenticado");

    const profileData = {
      name: formData.name,
      bio: formData.bio || '',
      location: formData.location || '',
      native_language: getLanguageCode(formData.native_language || 'en'),
      avatar_url: formData.avatar_url || '',
      onboarded: formData.onboarded !== undefined ? formData.onboarded : true,
      updated_at: new Date().toISOString()
    };

    // 1. Salvar no auth profile (backup)
    await auth.setProfile(profileData);

    // 2. Upsert na tabela profiles do banco (fonte principal para busca/amigos)
    const { data, error } = await db
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        ...profileData
      });

    if (error) {
      console.error("DB upsert error:", error);
      // Se falhar no banco, pelo menos salvou no auth
    }

    return { user: { id: user.id, email: user.email, ...profileData } };
  } catch (error) {
    throw new Error(error.message || "Erro ao atualizar perfil");
  }
};


// Carregar foto de perfil
export const uploadProfilePic = async (file) => {
  try {
    const { data: { user } } = await auth.getCurrentUser();
    const fileExt = file.name?.split('.').pop() || 'jpg';
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { data, error: uploadError } = await storage
      .from('profiles')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // InsForge retorna a URL pública diretamente no data.url
    return data.url;
  } catch (error) {
    console.error("Upload error details:", error);
    throw new Error(error.message || "Erro ao carregar imagem");
  }
};


export const completeOnboarding = async (onboardingData) => {
  return await updateProfile({
    ...onboardingData,
    onboarded: true
  });
};

export const saveE2EKeys = async (publicKey, encryptedPrivateKey) => {
  const { data: { user } } = await auth.getCurrentUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { error } = await db
    .from('profiles')
    .update({
      public_key: publicKey,
      encrypted_private_key: encryptedPrivateKey
    })
    .eq('id', user.id);

  if (error) throw error;
};

export const getPublicKey = async (userId) => {
  const { data, error } = await db
    .from('profiles')
    .select('public_key')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data?.public_key;
};

// --- Users & Friends ---

export const getAllUsers = async (filters = {}) => {
  try {
    // Se há filtro de busca, tenta usar ilike no banco
    if (filters.name) {
      const { data, error } = await db
        .from('profiles')
        .select('*')
        .ilike('name', `%${filters.name}%`);

      if (!error && data && data.length > 0) return data;

      // Fallback: buscar todos e filtrar no cliente
      const { data: allData, error: allError } = await db
        .from('profiles')
        .select('*');

      if (allError) throw allError;

      const search = filters.name.toLowerCase();
      return (allData || []).filter(u =>
        u.name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search)
      );
    }

    // Sem filtro — buscar todos
    const { data, error } = await db.from('profiles').select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("getAllUsers error:", error);
    return [];
  }
};

export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("getUserProfile error:", error);
    throw error;
  }
};

export const getFriends = async () => {
  try {
    const { data: { user } } = await auth.getCurrentUser();
    if (!user) return [];

    // Buscar IDs dos amigos
    const { data: friendRows, error } = await db
      .from('friends')
      .select('friend_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('getFriends error:', error);
      return [];
    }

    if (!friendRows || friendRows.length === 0) return [];

    // Buscar perfis completos de cada amigo
    const friendIds = friendRows.map(f => f.friend_id);
    const friendProfiles = [];

    for (const fid of friendIds) {
      const { data: profile } = await db
        .from('profiles')
        .select('*')
        .eq('id', fid)
        .single();
      if (profile) friendProfiles.push(profile);
    }

    return friendProfiles;
  } catch (error) {
    console.error("getFriends error:", error);
    return [];
  }
};

export const getUserFriends = getFriends;

export const sendFriendRequest = async (userId) => {
  try {
    const { data: { user } } = await auth.getCurrentUser();
    const { error } = await db.from('friend_requests').insert([{
      from_id: user.id,
      to_id: userId,
      status: 'pending'
    }]);
    if (error) throw error;
    return { message: "Solicitação enviada" };
  } catch (error) {
    throw new Error(error.message || "Erro ao enviar solicitação");
  }
};

export const getFriendRequests = async () => {
  try {
    const { data: { user } } = await auth.getCurrentUser();

    // Pedidos de amizade recebidos pendentes
    const { data: incoming, error: inError } = await db
      .from('friend_requests')
      .select('*, sender:profiles!friend_requests_from_id_fkey(*)')
      .eq('to_id', user.id)
      .eq('status', 'pending');

    if (inError) console.error('Incoming query error:', inError);

    // Pedidos aceitos (enviados por mim)
    const { data: accepted, error: accError } = await db
      .from('friend_requests')
      .select('*, recipient:profiles!friend_requests_to_id_fkey(*)')
      .eq('from_id', user.id)
      .eq('status', 'accepted');

    if (accError) console.error('Accepted query error:', accError);

    return {
      incomingReqs: incoming || [],
      acceptedReqs: accepted || []
    };
  } catch (error) {
    console.error("getFriendRequests error:", error);
    return { incomingReqs: [], acceptedReqs: [] };
  }
};

export const getOutgoingFriendReqs = async () => {
  try {
    const { data: { user } } = await auth.getCurrentUser();
    const { data, error } = await db
      .from('friend_requests')
      .select('*, to:profiles(*)')
      .eq('from_id', user.id)
      .eq('status', 'pending');

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(error.message || "Erro ao buscar solicitações enviadas");
  }
};

export const acceptFriendRequest = async (requestId) => {
  try {
    const { data: request, error: fetchError } = await db
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await db
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    const { error: friendsError } = await db.from('friends').insert([
      { user_id: request.from_id, friend_id: request.to_id },
      { user_id: request.to_id, friend_id: request.from_id }
    ]);

    if (friendsError) throw friendsError;

    return { message: "Solicitação aceita" };
  } catch (error) {
    throw new Error(error.message || "Erro ao aceitar solicitação");
  }
};

export const rejectFriendRequest = async (requestId) => {
  try {
    const { error } = await db
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) throw error;
    return { message: "Solicitação rejeitada" };
  } catch (error) {
    throw new Error(error.message || "Erro ao rejeitar solicitação");
  }
};

export const getRecommendedUsers = async () => {
  try {
    const { data: { user } } = await auth.getCurrentUser();

    // Buscar IDs de amigos
    const { data: friendRows } = await db
      .from('friends')
      .select('friend_id')
      .eq('user_id', user.id);
    const friendIds = new Set((friendRows || []).map(f => f.friend_id));

    // Buscar IDs de pedidos pendentes (enviados por mim)
    const { data: requestRows } = await db
      .from('friend_requests')
      .select('to_id')
      .eq('from_id', user.id)
      .eq('status', 'pending');
    const pendingIds = new Set((requestRows || []).map(r => r.to_id));

    // Buscar todos os perfis exceto o meu
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .limit(20);

    if (error) throw error;

    // Filtrar quem já é amigo ou tem pedido pendente
    return (data || []).filter(u => !friendIds.has(u.id) && !pendingIds.has(u.id));
  } catch (error) {
    console.error("getRecommendedUsers error:", error);
    return [];
  }
};

// --- Calls ---

export const initiateCall = async (receiverId, type, deviceInfo = {}) => {
  try {
    const { data: { user } } = await auth.getCurrentUser();
    const tempCallId = `call_${Date.now()}`;

    const { data, error } = await db.from('calls').insert([{
      callid: tempCallId,
      callerid: user.id,
      receiverid: receiverId,
      type,
      status: 'initiated',
      device_info: deviceInfo
    }]).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(error.message || "Erro ao iniciar chamada");
  }
};

export const updateCallStatus = async (callId, status, endReason = null, deviceInfo = null) => {
  try {
    const updateData = { status };
    if (endReason) {
      updateData.ended_at = new Date().toISOString();
      updateData.end_reason = endReason;
    }
    if (deviceInfo) updateData.device_info = deviceInfo;

    const { data, error } = await db
      .from('calls')
      .update(updateData)
      .eq('call_id', callId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(error.message || "Erro ao atualizar chamada");
  }
};

export const getCallStats = async () => {
  try {
    const { data: { user } } = await auth.getCurrentUser();
    const { data, error } = await db
      .from('calls')
      .select('status, created_at, duration')
      .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (error) throw error;

    const stats = {
      total: data.length,
      missed: data.filter(c => c.status === 'missed').length,
      today: data.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length,
      avgDuration: data.reduce((acc, c) => acc + (c.duration || 0), 0) / (data.length || 1)
    };

    return { stats };
  } catch (error) {
    throw new Error(error.message || "Erro ao buscar estatísticas");
  }
};

export const getCallHistory = async (page = 1, limit = 50) => {
  try {
    const { data: { user } } = await auth.getCurrentUser();
    const { data, error } = await db
      .from('calls')
      .select('*, caller:profiles(*), receiver:profiles(*)')
      .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('initiated_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(error.message || "Erro ao buscar histórico");
  }
};

export const deleteCallFromHistory = async (callId) => {
  try {
    const { error } = await db.from('calls').delete().eq('id', callId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    throw new Error(error.message || "Erro ao deletar chamada");
  }
};

export const rateCall = async (callId, rating, feedback = '') => {
  try {
    const { error } = await db
      .from('calls')
      .update({ rating, feedback })
      .eq('call_id', callId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    throw new Error(error.message || "Erro ao avaliar chamada");
  }
};

// --- Groups ---

export const getGroups = async () => {
  try {
    const { data, error } = await db.from('groups').select('*');
    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(error.message || "Erro ao buscar grupos");
  }
};

// --- Edge Functions (Stream, Translation, Audio) ---

export const getStreamToken = async () => {
  try {
    const CACHE_KEY = 'stream_chat_token_v2';
    const CACHE_TIME_KEY = 'stream_chat_token_time_v2';
    const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

    // 1. Check Cache
    const cachedToken = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    
    if (cachedToken && cachedTime && (Date.now() - parseInt(cachedTime)) < CACHE_TTL) {
      console.log('[Stream] Using cached token (TTL ok)');
      return { token: cachedToken };
    }

    console.log('[Auth] Fetching fresh Stream token from local backend...');
    const { data: { session } } = await insforge.auth.getCurrentSession();
    
    if (!session?.accessToken) throw new Error('No active session token');

    const response = await fetch(`${API_BASE_URL}/chat/token`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch stream token from server');
    
    const data = await response.json();
    
    if (!data?.token || typeof data.token !== 'string') {
      console.error('[Stream] Invalid token received from backend:', data);
      throw new Error('Backend returned invalid Stream token');
    }

    // 2. Save to Cache
    localStorage.setItem(CACHE_KEY, data.token);
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    
    return data;
  } catch (error) {
    console.error("Token fetch error:", error);
    throw new Error(error.message || "Erro ao obter token de chat");
  }
};


export const translateMessage = async (text, targetUserId, forcedTargetLang = null, forcedSourceLang = null) => {
  try {
    const { data: { user: currentUser } } = await auth.getCurrentUser();

    // Prioritize explicit codes, then user metadata, then fallback
    const sourceLang = _langCode(forcedSourceLang || currentUser.user_metadata?.native_language || 'pt');

    // If targetLang provided, use it. Otherwise fetch receiver profile.
    let targetLang = forcedTargetLang;
    if (!targetLang && targetUserId) {
      const { data: recipient } = await db.from('profiles').select('native_language').eq('id', targetUserId).single();
      targetLang = recipient?.native_language;
    }
    targetLang = _langCode(targetLang || 'en');

    console.log(`[API] Translation Call -> FROM: ${sourceLang}, TO: ${targetLang}, TEXT: "${text.substring(0, 30)}..."`);

    if (sourceLang === targetLang) {
      return { translation: { text, language: targetLang }, translatedText: text, sourceLanguage: sourceLang, targetLanguage: targetLang };
    }

    // 1. Tentar Tradução Local (Privada / Offline)
    try {
      const localTranslation = await translationEngine.translate(text, sourceLang, targetLang);
      if (localTranslation) {
        console.log(`[API] Local translation used: ${sourceLang} -> ${targetLang}`);
        return { 
          translatedText: localTranslation, 
          sourceLanguage: sourceLang, 
          targetLanguage: targetLang,
          isLocal: true 
        };
      }
    } catch (localErr) {
      console.warn("[API] Local translation failed, falling back to network:", localErr);
    }

    // 2. Usar Proxy do Backend (que encaminha para Argos VPS) ou Fallback Offline
    let translatorResult = null;
    let usedFallback = false;

    if (navigator.onLine) {
      try {
        console.log(`[API] Translation proxy call: ${sourceLang} -> ${targetLang}`);
        const response = await fetch(`${API_BASE_URL}/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            from: sourceLang,
            to: targetLang
          })
        });

        if (response.ok) {
          const data = await response.json();
          translatorResult = data.translated || data.translatedText || text;
        } else {
          const errData = await response.json().catch(() => ({}));
          console.error("[API] Proxy translation failed:", errData);
        }
      } catch (proxyErr) {
        console.error("[API] Proxy translation error:", proxyErr);
      }
    }

    // 3. Fallback Offline se a internet falhar ou a VPS cair
    if (!translatorResult) {
      console.log(`[API] VPS unavailable. Attempting offline fallback.`);
      if ('translation' in window && window.translation.createTranslator) {
        try {
          // Normalize languages (navigator.translation prefers BCP-47 like "es", "en")
          const canTranslate = await window.translation.canTranslate({
            sourceLanguage: sourceLang,
            targetLanguage: targetLang
          });
          if (canTranslate !== 'no') {
            const translator = await window.translation.createTranslator({
              sourceLanguage: sourceLang,
              targetLanguage: targetLang
            });
            translatorResult = await translator.translate(text);
            usedFallback = true;
          }
        } catch (e) {
          console.warn("[API] Local translation API failed", e);
        }
      }

      // Hard fallback
      if (!translatorResult) {
        translatorResult = `[Offline] ${text}`;
        usedFallback = true;
      }
    }

    return {
      translation: { text: translatorResult, language: targetLang },
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      translatedText: translatorResult,
      confidence: usedFallback ? 0 : 0.99
    };
  } catch (error) {
    console.error("Erro na tradução:", error);
    return {
      translation: { text: `[Erro] ${text}`, language: 'en' },
      translatedText: `[Erro] ${text}`
    };
  }
};

export const transcribeAudio = async (audioData, senderUserId, receiverUserId, transcription = null, from = null, to = null) => {
  try {
    // If first argument is an object (new style), destructure it
    let payload = {};
    if (typeof audioData === 'object' && audioData !== null && !audioData.audioData) {
      payload = audioData;
    } else {
      // Positional arguments (legacy or simple calls)
      // Check if it's an URL (InterpreterPage style)
      if (typeof audioData === 'string' && audioData.startsWith('http')) {
        // Fetch audio data if URL provided? Or just send URL?
        // Backend currently expects base64 in audioData.
        // Let's assume for now it's base64 or null.
        payload = { audio_url: audioData, from: senderUserId, to: receiverUserId };
        // Wait, if it's InterpreterPage, senderUserId is actually 'from' and receiverUserId is 'to'
      } else {
        payload = { audioData, senderUserId, receiverUserId, transcription, from, to };
      }
    }

    const response = await fetch(`${API_BASE_URL}/transcription/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Transcription failed');
    return await response.json();
  } catch (error) {
    console.error("Erro na transcrição:", error);
    return {
      originalTranscription: transcription || "🎤 Áudio",
      translatedTranscription: transcription || "",
      error: error.message
    };
  }
};

export const uploadAudio = async (blob, mimeType = 'audio/webm;codecs=opus') => {
  const { data: { session } } = await insforge.auth.getCurrentSession();
  if (!session) {
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const ext = mimeType.includes('wav') ? 'wav' : (mimeType.includes('ogg') ? 'ogg' : 'webm');
  const filename = `audio_${Date.now()}.${ext}`;

  const { data, error } = await insforge.storage
    .from('audio-messages')
    .upload(filename, blob, { contentType: mimeType, upsert: false });

  console.log('[Upload] data:', JSON.stringify(data));
  console.log('[Upload] error:', JSON.stringify(error));

  if (error) {
    if (error.statusCode === 401) {
      window.location.href = '/login';
      throw new Error('Session expired - please login again');
    }
    throw new Error(error.message);
  }

  // Insforge returns URL in data.url directly
  const publicUrl = data?.url || data?.publicUrl || data?.Key;

  console.log('[Upload] publicUrl:', publicUrl);

  if (!publicUrl) throw new Error('Failed to get public URL');
  return publicUrl;
};
