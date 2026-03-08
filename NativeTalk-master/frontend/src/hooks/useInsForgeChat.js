import { useEffect, useState, useRef } from 'react';
import { db, insforge } from '../lib/insforge';
import { useAuth } from '../contexts/AuthContext';
import { uploadAudio, translateMessage } from '../lib/api'; // API helpers
import toast from 'react-hot-toast';

export const useInsForgeChat = (receiverId) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const subscriptionRef = useRef(null);

    // 1. OBTEM MENSAGENS E INICIA REALTIME SUBSCRIPTION
    useEffect(() => {
        if (!user || !receiverId) return;

        const fetchInitialMessages = async () => {
            try {
                // Busca histórico de mensagens entre os dois usuários
                const { data, error } = await db
                    .from('messages')
                    .select('*')
                    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
                    .order('created_at', { ascending: true })
                    .limit(50); // Ajuste conforme a necessidade

                if (error) throw error;

                // Transforma as colunas snake_case do banco para camelCase da UI
                const formattedMessages = data.map(msg => ({
                    ...msg,
                    senderId: msg.sender_id,
                    receiverId: msg.receiver_id,
                    audioUrl: msg.audio_url,
                    timestamp: msg.created_at
                }));

                setMessages(formattedMessages);
                setIsConnected(true); // Se conseguiu buscar, considera conectado
            } catch (err) {
                console.error("Erro ao buscar mensagens do DB:", err);
                toast.error("Erro ao carregar histórico");
            }
        };

        fetchInitialMessages();

        // Inscreve no canal de REALTIME do InsForge
        const channel = insforge.channel(`chat_${user.id}_${receiverId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}` // Apenas mensagens novas PARA mim
                },
                (payload) => {
                    const newMsg = payload.new;
                    // Se foi enviada do cara que to conversando, adiciona na lista
                    if (newMsg.sender_id === receiverId) {
                        const formatted = {
                            ...newMsg,
                            senderId: newMsg.sender_id,
                            receiverId: newMsg.receiver_id,
                            audioUrl: newMsg.audio_url,
                            timestamp: newMsg.created_at
                        };
                        setMessages((prev) => [...prev, formatted]);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Conectado ao Realtime Chat do InsForge');
                    setIsConnected(true);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    setIsConnected(false);
                }
            });

        subscriptionRef.current = channel;

        return () => {
            insforge.removeChannel(channel);
            subscriptionRef.current = null;
        };
    }, [user, receiverId]);

    // 2. ENVIAR TEXTO
    const sendMessage = async (text, targetLang = 'en') => {
        if (!user || !receiverId || !text.trim()) return;

        // UI Otimista: joga a msg na tela (sem ID oficial ainda)
        const tempMsg = {
            id: Date.now(), // Temporário
            senderId: user.id,
            receiverId: receiverId,
            text,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            // Em background, traduz se for preciso
            // (Para o backend de vdd, idealmente uma Edge Function lidaria com a Inserção -> Tradução simultânea)
            let translation = null;
            try {
                // Aqui podemos invocar a Edge Function do insforge pra traduzir
                const transRes = await translateMessage(text, receiverId);
                // Assume que transRes retorna { translation: { text, language } }
                if (transRes && transRes.translation) {
                    translation = transRes.translation;
                }
            } catch (err) {
                console.warn("Tradução falhou (Mock ou EdgeFunc offline)", err);
                // Ignora e envia sem tradução
            }

            // Insere no banco (InsForge)
            const { data, error } = await db.from('messages').insert([{
                sender_id: user.id,
                receiver_id: receiverId,
                text,
                translation: translation || null
            }]).select().single();

            if (error) throw error;

            // Atualiza a msg temporária com os dados oficiais (inclui a tradução pra eu ver, se enviou pra mim tbm)
            setMessages(prev => prev.map(msg => msg.id === tempMsg.id ? {
                ...msg,
                ...data, // merge db values
                id: data.id,
                senderId: data.sender_id,
                receiverId: data.receiver_id,
                audioUrl: data.audio_url,
                timestamp: data.created_at
            } : msg));

        } catch (error) {
            console.error("Erro ao enviar mensagem pro DB:", error);
            // Reverte UI em caso de falha (opcional: mostrar [Falhou])
            toast.error("Falha ao enviar mensagem");
        }
    };

    // 3. GRAVAR ÁUDIO
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await processAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop()); // Stop mic
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Acesso negado ao microfone:", error);
            toast.error("Acesso ao microfone negado");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // 4. PROCESSAR ÁUDIO (Simulando fluxo)
    const processAudio = async (audioBlob) => {
        if (!receiverId) return;
        setIsTranscribing(true); // Exibe loading na UI

        try {
            // LER AUDIO BLOB
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                try {
                    const base64Audio = reader.result;

                    // A. Upload do áudio pro InsForge Storage
                    console.time("⏱️ Audio Upload");
                    const uploadRes = await uploadAudio(audioBlob, `voice_${Date.now()}.webm`);
                    console.timeEnd("⏱️ Audio Upload");

                    // B. Chamar a Edge Function de Transcrição
                    let transcribedText = "Áudio enviado";
                    let translationPayload = null;

                    console.time("⏱️ Transcription Edge Func");
                    try {
                        const { data, error } = await insforge.functions.invoke('transcribe', {
                            body: {
                                audioData: base64Audio,
                                language: user.nativeLanguage || 'pt'
                            }
                        });
                        console.timeEnd("⏱️ Transcription Edge Func");

                        if (data && !error) {
                            transcribedText = data.originalTranscription;

                            // C. Traduzir o texto transcrito se necessário
                            // O receptor pode ter um idioma diferente do transcrito
                            console.time("⏱️ Audio Translation");
                            try {
                                const transRes = await translateMessage(transcribedText, receiverId);
                                if (transRes && transRes.translation) {
                                    translationPayload = transRes.translation;
                                }
                            } catch (transError) {
                                console.warn("Tradução automática do áudio falhou:", transError);
                            }
                            console.timeEnd("⏱️ Audio Translation");
                        }
                    } catch (e) {
                        console.timeEnd("⏱️ Transcription Edge Func");
                        console.warn("Falha na Edge Func de Transcrição, enviando sem texto.", e);
                    }

                    // D. Inserir a mensagem no chat DB
                    const { data, error } = await db.from('messages').insert([{
                        sender_id: user.id,
                        receiver_id: receiverId,
                        text: transcribedText,
                        audio_url: uploadRes.url,
                        translation: translationPayload || null
                    }]).select().single();

                    if (error) throw error;

                    // Adicionar na minha tela local (A inserção foi pro banco e eu não escuto pra mim msm)
                    const formatted = {
                        ...data,
                        senderId: data.sender_id,
                        receiverId: data.receiver_id,
                        audioUrl: data.audio_url,
                        timestamp: data.created_at
                    };
                    setMessages(prev => [...prev, formatted]);
                } catch (err) {
                    console.error("Erro no fluxo do áudio:", err);
                    toast.error("Falha ao processar voz");
                } finally {
                    setIsTranscribing(false);
                }
            };
        } catch (error) {
            console.error("Erro no final:", error);
            setIsTranscribing(false);
        }
    };

    return {
        messages,
        sendMessage,
        startRecording,
        stopRecording,
        isConnected, // Usando pra indicar se conectou no Supabase/Insforge Postgres Realtime
        isRecording,
        isTranscribing
    };
};
