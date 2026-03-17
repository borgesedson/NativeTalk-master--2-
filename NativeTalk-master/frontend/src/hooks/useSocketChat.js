import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { uploadAudio, transcribeAudio } from '../lib/api'; // Import API helpers
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export const useSocketChat = (receiverId) => {
    const { user, token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false); // State for "Transcribing..." UI
    const socketRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        if (!user || !token) return;

        // Initialize Socket
        const newSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ Connected to Socket.io');
            setIsConnected(true);
            newSocket.emit('join-user-room', user.id); // Join my own room
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Disconnected from Socket.io');
            setIsConnected(false);
        });

        newSocket.on('receive-message', (message) => {
            console.log('📩 Message received:', message);
            setMessages((prev) => [...prev, message]);
        });

        newSocket.on('message-sent', (message) => {
            console.log('📤 Message sent confirmation:', message);
            // Ensure we don't duplicate if optimistic UI is used (not used here yet)
            setMessages((prev) => [...prev, message]);
        });

        // Handle broadcasted audio translation specifically if needed (but 'receive-message' covers it now)
        // Keeping as backup if server emits this specific event for audio
        newSocket.on('audio-translation', (data) => {
            // Logic merged into receive-message in server.js, but keeping for backward compat
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user, token]);

    const sendMessage = (text, targetLang = 'ja') => {
        if (!socketRef.current || !receiverId) {
            toast.error("No receiver selected");
            return;
        }

        const messageData = {
            toUser: receiverId,
            text,
            targetLang,
            timestamp: Date.now(),
        };

        socketRef.current.emit('send-message', messageData);
    };

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
            console.error("Error accessing microphone:", error);
            toast.error("Could not access microphone");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const processAudio = async (audioBlob) => {
        if (!receiverId) return;
        setIsTranscribing(true); // Show "Transcribing..." UI

        try {
            // 1. Convert Blob to Base64
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result;

                // 2. Upload Audio (to get URL for persistence)
                // Note: api.uploadAudio returns { audioUrl }
                const uploadRes = await uploadAudio(base64Audio, `voice_note_${Date.now()}.webm`);

                // 3. Transcribe & Translate
                // transcribeAudio expects { audioData, senderUserId, receiverUserId }
                // Note: api.transcribeAudio uses formData, but controller expects JSON in recent check? 
                // Wait, controller expects JSON body: { audioData, senderUserId... }
                // But api.transcribeAudio sends FormData. 
                // LET'S CRITICAL CHECK: api.js says `axiosInstance.post('/transcription/transcribe', formData, ... 'Content-Type': 'multipart/form-data')`
                // But `transcription.controller.js` does `req.body`. Express json middleware handles JSON, but multer handles FormData.
                // Controller does NOT look like it uses multer. It destructures `req.body`.
                // SO `api.js` `transcribeAudio` might be WRONG if it sends FormData.
                // I will use a direct axios call here to be safe and match controller expectation of JSON.

                // Direct call matching controller expectation:
                const response = await fetch(`${SOCKET_URL}/api/transcription/transcribe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        audioData: base64Audio,
                        senderUserId: user.id,
                        receiverUserId: receiverId
                    })
                });
                const transcriptionData = await response.json();

                // 4. Send Message via Socket
                const messageData = {
                    toUser: receiverId,
                    text: transcriptionData.originalTranscription,
                    translation: {
                        text: transcriptionData.translatedTranscription,
                        language: transcriptionData.targetLanguage
                    },
                    audioUrl: uploadRes.audioUrl,
                    targetLang: transcriptionData.targetLanguage, // Ensure consistency
                    timestamp: Date.now()
                };

                socketRef.current.emit('send-message', messageData);
                setIsTranscribing(false);
            };
        } catch (error) {
            console.error("Error processing audio:", error);
            toast.error("Failed to send voice note");
            setIsTranscribing(false);
        }
    };

    return {
        messages,
        sendMessage,
        startRecording,
        stopRecording,
        isConnected,
        isRecording,
        isTranscribing
    };
};
