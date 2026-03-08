import { insforge, db, auth, storage } from './insforge';
import { getLanguageCode } from './utils';

// VPS Config
const ARGOS_URL = 'http://82.25.64.9:5000';
const WHISPER_URL = 'http://82.25.64.9:5001';

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
    await auth.signOut();
  } catch (error) {
    console.error('Erro no logout:', error);
  }
};
// Cache para evitar auto-create repetido na mesma sessão
let profileAutoCreated = false;

export const getCurrentUser = async () => {
  try {
    const { data: authData, error: authError } = await auth.getCurrentUser();
    if (authError || !authData?.user) return null;
    const user = authData.user;

    // 🔍 DEBUG: Full profile dump
    const { data: rawProfile } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
    console.log('[APP LOAD] Full DB profile:', JSON.stringify(rawProfile, null, 2));
    console.log('[APP LOAD] Auth metadata:', JSON.stringify(user.user_metadata, null, 2));

    // Buscar perfil do banco usando maybeSingle (retorna null sem erro)
    const { data: dbProfile, error: dbError } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (dbError) {
      console.warn('DB profile fetch warning:', dbError.message);
    }


    // Se perfil existe no banco, retornar direto (fonte de verdade)
    if (dbProfile) {
      const result = {
        id: user.id,
        email: user.email,
        ...dbProfile,
        native_language: getLanguageCode(dbProfile.native_language),
      };
      console.log('[Auth] User language:', result.native_language);
      return result;
    }

    // Se não existe no banco e ainda não tentamos criar nesta sessão
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
        await db.from('profiles').upsert(newProfile);
      } catch (e) {
        console.warn('Auto-create profile failed:', e.message);
      }

      return { id: user.id, ...newProfile };
    }

    // Fallback: retornar dados mínimos do auth
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
    const { data, error } = await insforge.functions.invoke('get-stream-token');
    if (error) throw error;
    return data;
  } catch (error) {
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

    // 2. Usar Proxy do Backend (que encaminha para Argos VPS)
    try {
      console.log(`[API] Translation proxy call: ${sourceLang} -> ${targetLang}`);
      const response = await fetch('/api/translate', {
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
        const translated = data.translated || data.translatedText || text;
        return {
          translation: { text: translated, language: targetLang },
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          translatedText: translated
        };
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error("[API] Proxy translation failed:", errData);
      }
    } catch (proxyErr) {
      console.error("[API] Proxy translation error:", proxyErr);
    }

    return {
      translation: { text: text, language: 'en' },
      translatedText: text
    };
  } catch (error) {
    console.error("Erro na tradução:", error);
    return {
      translation: { text: text, language: 'en' },
      translatedText: text
    };
  }
};

export const transcribeAudio = async (audioUrl, targetLanguage = 'en', sourceLanguage = 'pt') => {
  try {
    // 1. Usar Proxy do Backend (encaminha para Whisper VPS)
    if (audioUrl) {
      try {
        console.log(`🎤 Transcrevendo via proxy backend: ${audioUrl}`);

        const response = await fetch('/api/stt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio_url: audioUrl,
            from: sourceLanguage,
            to: targetLanguage
          })
        });

        if (response.ok) {
          const result = await response.json();
          return {
            originalTranscription: result.transcript,
            translatedTranscription: result.translated,
            detectedLanguage: result.language || sourceLanguage
          };
        }
      } catch (vpsErr) {
        console.warn("Proxy STT falhou:", vpsErr);
        throw vpsErr;
      }
    }
  } catch (error) {
    console.error("Erro na transcrição:", error);
    return {
      originalTranscription: "🎤 Áudio",
      translatedTranscription: "",
      targetLanguage
    };
  }
};

export const uploadAudio = async (audioBlob, fileName = `audio_${Date.now()}.webm`) => {
  try {
    const filename = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webm`;
    console.log('[Upload] Starting upload:', filename, 'size:', audioBlob.size);

    const { data, error } = await storage
      .from('audio-messages')
      .upload(filename, audioBlob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[Upload] Error:', error);
      throw new Error('Upload failed: ' + error.message);
    }

    console.log('[Upload] Success, path:', data?.path);

    const { data: urlData } = storage
      .from('audio-messages')
      .getPublicUrl(data.path);

    console.log('[Upload] URL data:', urlData);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log('[Upload] Public URL:', urlData.publicUrl);
    return { url: urlData.publicUrl };
  } catch (error) {
    console.error('[Upload] Error in uploadAudio:', error);
    throw error;
  }
};
