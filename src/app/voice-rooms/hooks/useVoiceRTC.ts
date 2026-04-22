/* ═══════════════════════════════════════════════════════════════════════
   useVoiceRTC — Real WebRTC P2P Voice Hook

   Features:
   - One RTCPeerConnection per on-mic participant (mesh topology)
   - getUserMedia() for local mic (audio only)
   - WebSocket signaling via Socket.IO
   - Independent mic mute (stop audio track) and speaker mute (local only)
   - Speaking detection via AudioContext analyser
   - Auto-cleanup on unmount or room leave

   Usage:
   const voice = useVoiceRTC({ roomId, userId, displayName, isOnSeat, isMicMuted });
   // voice.speakingPeers: Map<userId, boolean> — who is speaking
   // voice.localSpeaking: boolean — am I speaking
   // voice.toggleMic(): void — toggle local mic
   // voice.toggleSpeaker(): void — toggle all remote audio
   // voice.setLocalMuted(muted: boolean): void — programmatic mute
   ═══════════════════════════════════════════════════════════════════════ */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceRTCConfig {
  roomId: string;
  userId: string;
  displayName: string;
  isOnSeat: boolean;
  isMicMuted: boolean;
}

interface VoiceRTCReturn {
  /** Map of userId → true if currently speaking */
  speakingPeers: React.MutableRefObject<Map<string, boolean>>;
  /** Am I speaking? */
  localSpeaking: boolean;
  /** Is speaker muted (all remote audio)? */
  isSpeakerMuted: boolean;
  /** Is mic muted? */
  isLocalMicMuted: boolean;
  /** Is connected to signaling server? */
  isConnected: boolean;
  /** Toggle local mic mute */
  toggleMic: () => void;
  /** Toggle speaker mute (all remote audio) */
  toggleSpeaker: () => void;
  /** Programmatic mic mute */
  setLocalMuted: (muted: boolean) => void;
  /** Audio elements for each peer (to attach to DOM) */
  audioStreams: React.MutableRefObject<Map<string, MediaStream>>;
}

// ── ICE Configuration ──
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Free TURN servers (metered.ca)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

// ── Speaking detection threshold ──
const SPEAKING_THRESHOLD = 0.015;
const SPEAKING_HYSTERESIS = 0.01;

export function useVoiceRTC({
  roomId,
  userId,
  displayName,
  isOnSeat,
  isMicMuted,
}: VoiceRTCConfig): VoiceRTCReturn {
  /* ── State ── */
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isLocalMicMuted, setIsLocalMicMuted] = useState(isMicMuted);
  const [isConnected, setIsConnected] = useState(false);

  /* ── Refs ── */
  const socketRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const connectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const audioStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const speakingPeersRef = useRef<Map<string, boolean>>(new Map());
  const speakingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speakingCheckRef = useRef<number | null>(null);
  const localSpeakingRef = useRef(false);

  // Store current config in refs to avoid stale closures
  const configRef = useRef({ roomId, userId, displayName, isOnSeat, isMicMuted });
  configRef.current = { roomId, userId, displayName, isOnSeat, isMicMuted };

  /* ── Socket.IO connection ── */
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    // Dynamically import socket.io-client
    import('socket.io-client').then(({ io }) => {
      const socket = io('/?XTransformPort=3010', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[VoiceRTC] Connected to signaling server');
        setIsConnected(true);

        // Join room
        socket.emit('join-room', {
          roomId: configRef.current.roomId,
          userId: configRef.current.userId,
          displayName: configRef.current.displayName,
          onMic: configRef.current.isOnSeat,
          micMuted: configRef.current.isMicMuted || isLocalMicMuted,
        });
      });

      socket.on('disconnect', () => {
        console.log('[VoiceRTC] Disconnected from signaling server');
        setIsConnected(false);
      });

      // ── Room members list ──
      socket.on('room-members', (data: { roomId: string; members: Array<{ socketId: string; userId: string; onMic: boolean; micMuted: boolean }> }) => {
        console.log(`[VoiceRTC] Room members: ${data.members.length}`);
        const { isOnSeat: onMic } = configRef.current;

        // If I'm on mic, request offers from existing on-mic members
        if (onMic && !isLocalMicMuted) {
          data.members.forEach((m) => {
            if (m.onMic && !m.micMuted) {
              // Create offer to this peer
              createOfferToPeer(socket, m.socketId, m.userId);
            }
          });
        }
      });

      // ── New peer joined ──
      socket.on('peer-joined', (data: { socketId: string; userId: string; onMic: boolean; micMuted: boolean; roomId: string }) => {
        console.log(`[VoiceRTC] Peer joined: ${data.userId} (onMic=${data.onMic})`);
        const { isOnSeat: onMic } = configRef.current;

        // If I'm on mic and they're on mic, I send offer
        if (onMic && !isLocalMicMuted && data.onMic && !data.micMuted) {
          createOfferToPeer(socket, data.socketId, data.userId);
        }
      });

      // ── Peer left ──
      socket.on('peer-leave', (data: { socketId: string; userId: string; roomId: string }) => {
        console.log(`[VoiceRTC] Peer left: ${data.userId}`);
        closePeerConnection(data.socketId, data.userId);
      });

      // ── Request offer (someone wants me to send them an offer) ──
      socket.on('request-offer', (data: { targetSocketId: string; roomId: string }) => {
        const { isOnSeat: onMic } = configRef.current;
        if (onMic && !isLocalMicMuted) {
          createOfferToPeer(socket, data.targetSocketId, '');
        }
      });

      // ── Receive offer ──
      socket.on('offer', async (data: { fromSocketId: string; roomId: string; offer: RTCSessionDescriptionInit }) => {
        console.log('[VoiceRTC] Received offer');
        const { isOnSeat: onMic } = configRef.current;
        if (!onMic) return;

        try {
          await ensureLocalStream();
          const pc = getOrCreatePeerConnection(socket, data.fromSocketId);
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('answer', {
            targetSocketId: data.fromSocketId,
            roomId: configRef.current.roomId,
            answer,
          });
        } catch (err) {
          console.error('[VoiceRTC] Error handling offer:', err);
        }
      });

      // ── Receive answer ──
      socket.on('answer', async (data: { fromSocketId: string; roomId: string; answer: RTCSessionDescriptionInit }) => {
        console.log('[VoiceRTC] Received answer');
        const pc = connectionsRef.current.get(data.fromSocketId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          } catch (err) {
            console.error('[VoiceRTC] Error handling answer:', err);
          }
        }
      });

      // ── Receive ICE candidate ──
      socket.on('ice-candidate', (data: { fromSocketId: string; roomId: string; candidate: RTCIceCandidateInit }) => {
        const pc = connectionsRef.current.get(data.fromSocketId);
        if (pc && pc.remoteDescription) {
          try {
            pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error('[VoiceRTC] Error adding ICE candidate:', err);
          }
        } else {
          // Queue the candidate if remoteDescription not set yet
          setTimeout(() => {
            const pc2 = connectionsRef.current.get(data.fromSocketId);
            if (pc2 && pc2.remoteDescription) {
              pc2.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
            }
          }, 500);
        }
      });

      // ── Peer mic toggle ──
      socket.on('peer-mic-toggle', (data: { socketId: string; userId: string; micMuted: boolean }) => {
        console.log(`[VoiceRTC] Peer ${data.userId} mic toggled: ${data.micMuted}`);
        speakingPeersRef.current.set(data.userId, false);
        // Force re-render
        setLocalSpeaking(prev => prev);
      });

      // ── Peer seat change ──
      socket.on('peer-seat-change', (data: { socketId: string; userId: string; onMic: boolean }) => {
        console.log(`[VoiceRTC] Peer ${data.userId} seat change: onMic=${data.onMic}`);
        if (!data.onMic) {
          closePeerConnection(data.socketId, data.userId);
        }
      });

      // ── Heartbeat ──
      const heartbeat = setInterval(() => {
        if (socket.connected) {
          socket.emit('heartbeat');
        }
      }, 15000);

      // Cleanup on disconnect
      socket.on('disconnect', () => {
        clearInterval(heartbeat);
      });
    });
  }, []);

  /* ── Ensure local media stream ── */
  const ensureLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    if (localStreamRef.current) return localStreamRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
        video: false,
      });

      localStreamRef.current = stream;

      // Set up speaking detection
      setupSpeakingDetection(stream);

      // If muted, disable track
      if (isLocalMicMuted) {
        stream.getAudioTracks().forEach(t => t.enabled = false);
      }

      return stream;
    } catch (err) {
      console.error('[VoiceRTC] Error getting user media:', err);
      return null;
    }
  }, []);

  /* ── Speaking detection ── */
  const setupSpeakingDetection = useCallback((stream: MediaStream) => {
    if (typeof window === 'undefined') return;

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      // Check volume every 100ms
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkSpeaking = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate RMS volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length) / 255;

        const wasSpeaking = localSpeakingRef.current;
        const isSpeaking = wasSpeaking
          ? rms > (SPEAKING_THRESHOLD - SPEAKING_HYSTERESIS)
          : rms > (SPEAKING_THRESHOLD + SPEAKING_HYSTERESIS);

        localSpeakingRef.current = isSpeaking;

        if (isSpeaking !== wasSpeaking) {
          setLocalSpeaking(isSpeaking);
        }

        speakingCheckRef.current = requestAnimationFrame(checkSpeaking);
      };

      checkSpeaking();
    } catch (err) {
      console.error('[VoiceRTC] Error setting up speaking detection:', err);
    }
  }, []);

  /* ── Create or get peer connection ── */
  const getOrCreatePeerConnection = useCallback((socket: any, socketId: string): RTCPeerConnection => {
    if (connectionsRef.current.has(socketId)) {
      return connectionsRef.current.get(socketId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('[VoiceRTC] Remote track received from', socketId);
      if (event.streams[0]) {
        remoteStreamsRef.current.set(socketId, event.streams[0]);
        audioStreamsRef.current.set(socketId, event.streams[0]);

        // Mute if speaker is muted
        if (isSpeakerMuted) {
          event.streams[0].getAudioTracks().forEach(t => t.enabled = false);
        }

        // Start speaking detection for this peer
        setupRemoteSpeakingDetection(socketId, event.streams[0]);

        // Force re-render to update audio elements
        setLocalSpeaking(prev => prev);
      }
    };

    // ICE candidate
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          targetSocketId: socketId,
          roomId: configRef.current.roomId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      console.log(`[VoiceRTC] Connection state (${socketId}): ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        closePeerConnection(socketId, '');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[VoiceRTC] ICE state (${socketId}): ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        // Try to restart ICE
        if (pc.connectionState === 'connected') {
          pc.restartIce();
        }
      }
    };

    connectionsRef.current.set(socketId, pc);
    return pc;
  }, [isSpeakerMuted]);

  /* ── Create offer to a peer ── */
  const createOfferToPeer = useCallback(async (socket: any, targetSocketId: string, _targetUserId: string) => {
    try {
      const stream = await ensureLocalStream();
      if (!stream) return;

      const pc = getOrCreatePeerConnection(socket, targetSocketId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);

      socket.emit('offer', {
        targetSocketId,
        roomId: configRef.current.roomId,
        offer,
      });

      console.log('[VoiceRTC] Sent offer to peer');
    } catch (err) {
      console.error('[VoiceRTC] Error creating offer:', err);
    }
  }, [ensureLocalStream, getOrCreatePeerConnection]);

  /* ── Remote speaking detection ── */
  const setupRemoteSpeakingDetection = useCallback((socketId: string, stream: MediaStream) => {
    if (typeof window === 'undefined' || !stream.getAudioTracks().length) return;

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const check = () => {
        if (!remoteStreamsRef.current.has(socketId)) {
          ctx.close();
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length) / 255;
        const isSpeaking = rms > SPEAKING_THRESHOLD;

        const wasSpeaking = speakingPeersRef.current.get(socketId) || false;

        if (isSpeaking && !wasSpeaking) {
          speakingPeersRef.current.set(socketId, true);
          // Clear any pending "stop speaking" timer
          const timer = speakingTimersRef.current.get(socketId);
          if (timer) clearTimeout(timer);
        } else if (!isSpeaking && wasSpeaking) {
          // Delay before marking as not speaking (debounce)
          const timer = setTimeout(() => {
            speakingPeersRef.current.set(socketId, false);
            setLocalSpeaking(prev => prev); // trigger re-render
          }, 500);
          speakingTimersRef.current.set(socketId, timer);
        }

        requestAnimationFrame(check);
      };

      check();
    } catch (err) {
      // Ignore - some browsers may block AudioContext creation
    }
  }, []);

  /* ── Close peer connection ── */
  const closePeerConnection = useCallback((socketId: string, _userId: string) => {
    const pc = connectionsRef.current.get(socketId);
    if (pc) {
      pc.close();
      connectionsRef.current.delete(socketId);
    }
    remoteStreamsRef.current.delete(socketId);

    const timer = speakingTimersRef.current.get(socketId);
    if (timer) clearTimeout(timer);
    speakingTimersRef.current.delete(socketId);

    // Note: we don't delete from speakingPeers or audioStreams here
    // because the UI needs time to clean up
  }, []);

  /* ── Cleanup all ── */
  const cleanup = useCallback(() => {
    // Stop speaking check
    if (speakingCheckRef.current) {
      cancelAnimationFrame(speakingCheckRef.current);
      speakingCheckRef.current = null;
    }

    // Close all peer connections
    for (const [socketId, pc] of connectionsRef.current.entries()) {
      pc.close();
    }
    connectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    audioStreamsRef.current.clear();
    speakingPeersRef.current.clear();

    for (const [, timer] of speakingTimersRef.current.entries()) {
      clearTimeout(timer);
    }
    speakingTimersRef.current.clear();

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    // Disconnect socket
    if (socketRef.current) {
      const socket = socketRef.current;
      // Leave room first
      try {
        socket.emit('leave-room', { roomId: configRef.current.roomId });
      } catch {}
      socket.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setLocalSpeaking(false);
    localSpeakingRef.current = false;
  }, []);

  /* ── Toggle mic ── */
  const toggleMic = useCallback(() => {
    const newMuted = !isLocalMicMuted;
    setIsLocalMicMuted(newMuted);

    // Toggle local audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !newMuted;
      });
    }

    // Notify signaling server
    if (socketRef.current?.connected) {
      socketRef.current.emit('mic-toggle', {
        roomId: configRef.current.roomId,
        micMuted: newMuted,
      });
    }

    // If unmuting and on seat, create offers to existing peers
    if (!newMuted && configRef.current.isOnSeat) {
      if (socketRef.current?.connected) {
        socketRef.current.emit('request-offers', {
          roomId: configRef.current.roomId,
        });
      }
    }
  }, [isLocalMicMuted]);

  /* ── Programmatic mute ── */
  const setLocalMuted = useCallback((muted: boolean) => {
    setIsLocalMicMuted(muted);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !muted;
      });
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit('mic-toggle', {
        roomId: configRef.current.roomId,
        micMuted: muted,
      });
    }
  }, []);

  /* ── Toggle speaker ── */
  const toggleSpeaker = useCallback(() => {
    const newMuted = !isSpeakerMuted;
    setIsSpeakerMuted(newMuted);

    // Toggle all remote streams
    for (const [, stream] of remoteStreamsRef.current.entries()) {
      stream.getAudioTracks().forEach(t => {
        t.enabled = !newMuted;
      });
    }
  }, [isSpeakerMuted]);

  /* ── Handle seat change ── */
  useEffect(() => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit('seat-change', {
      roomId: configRef.current.roomId,
      onMic: configRef.current.isOnSeat,
      micMuted: isLocalMicMuted,
    });

    // If leaving seat, close all connections
    if (!configRef.current.isOnSeat) {
      for (const [socketId] of connectionsRef.current.entries()) {
        closePeerConnection(socketId, '');
      }
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }
  }, [isOnSeat, closePeerConnection]);

  /* ── Handle external mic mute sync ── */
  useEffect(() => {
    // Sync with external isMicMuted state
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !isMicMuted;
      });
    }
  }, [isMicMuted]);

  /* ── Connect on mount ── */
  useEffect(() => {
    connectSocket();

    return () => {
      cleanup();
    };
  }, []);

  return {
    speakingPeers: speakingPeersRef,
    localSpeaking,
    isSpeakerMuted,
    isLocalMicMuted,
    isConnected,
    toggleMic,
    toggleSpeaker,
    setLocalMuted,
    audioStreams,
  };
}
