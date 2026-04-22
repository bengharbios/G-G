/* ═══════════════════════════════════════════════════════════════════════
   useVoiceRTC — Real WebRTC P2P Voice Hook (Mobile-Optimized)

   Features:
   - One RTCPeerConnection per on-mic participant (mesh topology)
   - getUserMedia() for local mic (audio only)
   - WebSocket signaling via Socket.IO
   - Independent mic mute (stop audio track) and speaker mute (local only)
   - Speaking detection via AudioContext analyser
   - iOS/Android mobile audio unlock on first user gesture
   - ICE restart with retry on failure
   - Auto-cleanup on unmount or room leave
   - In-app push notifications for room events

   Usage:
   const voice = useVoiceRTC({ roomId, userId, displayName, isOnSeat, isMicMuted });
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

export interface RoomNotification {
  id: string;
  type: 'invite' | 'mention' | 'kick' | 'seat_request' | 'seat_granted' | 'room_event';
  title: string;
  body: string;
  roomId: string;
  fromUserId?: string;
  fromDisplayName?: string;
  timestamp: number;
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
  /** Is audio context unlocked (for iOS)? */
  isAudioUnlocked: boolean;
  /** Pending notifications */
  notifications: RoomNotification[];
  /** Clear a notification */
  clearNotification: (id: string) => void;
  /** Toggle local mic mute */
  toggleMic: () => void;
  /** Toggle speaker mute (all remote audio) */
  toggleSpeaker: () => void;
  /** Programmatic mic mute */
  setLocalMuted: (muted: boolean) => void;
  /** Unlock audio on first user gesture (iOS) */
  unlockAudio: () => Promise<void>;
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
  // Prefer TURN for mobile networks (better NAT traversal)
  iceTransportPolicy: 'all',
  // Bundle and rtcp-mux reduce bandwidth
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

// ── Speaking detection threshold ──
const SPEAKING_THRESHOLD = 0.015;
const SPEAKING_HYSTERESIS = 0.01;

// ── ICE retry config ──
const MAX_ICE_RETRIES = 3;
const ICE_RETRY_DELAY = 2000;

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
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [notifications, setNotifications] = useState<RoomNotification[]>([]);

  /* ── Refs ── */
  const socketRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const connectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const audioStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const speakingPeersRef = useRef<Map<string, boolean>>(new Map());
  const speakingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const remoteAudioContextsRef = useRef<Map<string, AudioContext>>(new Map());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speakingCheckRef = useRef<number | null>(null);
  const localSpeakingRef = useRef(false);
  const audioUnlockedRef = useRef(false);
  const iceRetriesRef = useRef<Map<string, number>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const pendingAudioStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  // Store current config in refs to avoid stale closures
  const configRef = useRef({ roomId, userId, displayName, isOnSeat, isMicMuted });
  configRef.current = { roomId, userId, displayName, isOnSeat, isMicMuted };

  /* ═══════════════════════════════════════════════════════════
     iOS/Android Audio Unlock
     iOS Safari blocks AudioContext and audio.play() until
     a user gesture triggers them. We call unlockAudio()
     on the first tap/click inside the room.
     ═══════════════════════════════════════════════════════════ */
  const unlockAudio = useCallback(async () => {
    if (audioUnlockedRef.current) return true;

    try {
      // 1. Resume/create AudioContext (iOS requires user gesture)
      if (!audioContextRef.current || audioContextRef.current.state === 'suspended') {
        if (audioContextRef.current) {
          await audioContextRef.current.resume();
        } else {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
        }
      }

      // 2. Resume all remote AudioContexts
      for (const [, ctx] of remoteAudioContextsRef.current.entries()) {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
      }

      // 3. Play all pending audio streams
      for (const [key, stream] of pendingAudioStreamsRef.current.entries()) {
        const audio = audioElementsRef.current.get(key);
        if (audio && audio.paused) {
          try {
            audio.srcObject = stream;
            await audio.play();
          } catch {
            // Some browsers still reject even with gesture
          }
        }
      }
      pendingAudioStreamsRef.current.clear();

      // 4. Play all existing audio elements that might be paused
      for (const [, audio] of audioElementsRef.current.entries()) {
        if (audio.paused && audio.srcObject) {
          try { await audio.play(); } catch { /* ignore */ }
        }
      }

      audioUnlockedRef.current = true;
      setIsAudioUnlocked(true);
      console.log('[VoiceRTC] ✅ Audio unlocked successfully');
      return true;
    } catch (err) {
      console.warn('[VoiceRTC] Audio unlock failed:', err);
      return false;
    }
  }, []);

  // Auto-unlock on any touch/click in the document
  useEffect(() => {
    if (audioUnlockedRef.current) return;

    const handleInteraction = () => {
      unlockAudio();
    };

    document.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
    document.addEventListener('touchend', handleInteraction, { once: true, passive: true });
    document.addEventListener('click', handleInteraction, { once: true, passive: true });

    return () => {
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('touchend', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
  }, [unlockAudio]);

  /* ── Notification helper ── */
  const addNotification = useCallback((notif: Omit<RoomNotification, 'id' | 'timestamp'>) => {
    const full: RoomNotification = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    setNotifications(prev => [full, ...prev].slice(0, 20)); // keep max 20

    // Also try browser notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(full.title, {
            body: full.body,
            icon: '/favicon.ico',
            tag: full.id,
            silent: false,
          });
        } catch { /* service worker may handle this */ }
      } else if (Notification.permission === 'default') {
        // Request permission on next user gesture
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            try {
              new Notification(full.title, {
                body: full.body,
                icon: '/favicon.ico',
                tag: full.id,
              });
            } catch { /* ignore */ }
          }
        });
      }
    }
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /* ── Socket.IO connection ── */
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    import('socket.io-client').then(({ io }) => {
      const socket = io('/?XTransformPort=3010', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 8000,
        timeout: 15000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[VoiceRTC] Connected to signaling server');
        setIsConnected(true);

        socket.emit('join-room', {
          roomId: configRef.current.roomId,
          userId: configRef.current.userId,
          displayName: configRef.current.displayName,
          onMic: configRef.current.isOnSeat,
          micMuted: configRef.current.isMicMuted || isLocalMicMuted,
        });
      });

      socket.on('disconnect', (reason: string) => {
        console.log(`[VoiceRTC] Disconnected: ${reason}`);
        setIsConnected(false);
      });

      socket.on('reconnect', () => {
        console.log('[VoiceRTC] Reconnected');
        setIsConnected(true);
        // Re-join room after reconnect
        socket.emit('join-room', {
          roomId: configRef.current.roomId,
          userId: configRef.current.userId,
          displayName: configRef.current.displayName,
          onMic: configRef.current.isOnSeat,
          micMuted: isLocalMicMuted,
        });
      });

      // ── Room members list ──
      socket.on('room-members', (data: { roomId: string; members: Array<{ socketId: string; userId: string; onMic: boolean; micMuted: boolean }> }) => {
        console.log(`[VoiceRTC] Room members: ${data.members.length}`);
        const { isOnSeat: onMic } = configRef.current;

        if (onMic && !isLocalMicMuted) {
          data.members.forEach((m) => {
            if (m.onMic && !m.micMuted) {
              createOfferToPeer(socket, m.socketId, m.userId);
            }
          });
        }
      });

      // ── New peer joined ──
      socket.on('peer-joined', (data: { socketId: string; userId: string; onMic: boolean; micMuted: boolean; roomId: string; displayName: string }) => {
        console.log(`[VoiceRTC] Peer joined: ${data.userId} (onMic=${data.onMic})`);
        const { isOnSeat: onMic } = configRef.current;

        if (onMic && !isLocalMicMuted && data.onMic && !data.micMuted) {
          createOfferToPeer(socket, data.socketId, data.userId);
        }
      });

      // ── Peer left ──
      socket.on('peer-leave', (data: { socketId: string; userId: string; roomId: string }) => {
        console.log(`[VoiceRTC] Peer left: ${data.userId}`);
        closePeerConnection(data.socketId, data.userId);
      });

      // ── Request offer ──
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
        setLocalSpeaking(prev => prev);
      });

      // ── Peer seat change ──
      socket.on('peer-seat-change', (data: { socketId: string; userId: string; onMic: boolean }) => {
        console.log(`[VoiceRTC] Peer ${data.userId} seat change: onMic=${data.onMic}`);
        if (!data.onMic) {
          closePeerConnection(data.socketId, data.userId);
        }
      });

      // ── In-app push notifications from signaling server ──
      socket.on('notification', (data: RoomNotification) => {
        console.log('[VoiceRTC] Notification received:', data);
        addNotification(data);
      });

      // ── Heartbeat ──
      const heartbeat = setInterval(() => {
        if (socket.connected) {
          socket.emit('heartbeat');
        }
      }, 15000);

      socket.on('disconnect', () => {
        clearInterval(heartbeat);
      });
    });
  }, []);

  /* ── Ensure local media stream (mobile-compatible) ── */
  const ensureLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    if (localStreamRef.current) return localStreamRef.current;

    try {
      // Mobile-compatible constraints — no sampleRate (not supported on all mobile)
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Don't force sampleRate — let browser choose (mobile compatibility)
          // channelCount: 1 is default and best for mobile
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
      // On mobile, getUserMedia can fail if:
      // 1. Permission denied
      // 2. No microphone
      // 3. HTTPS not enforced (required on mobile)
      // 4. App is in background
      return null;
    }
  }, []);

  /* ── Speaking detection (mobile-compatible) ── */
  const setupSpeakingDetection = useCallback((stream: MediaStream) => {
    if (typeof window === 'undefined') return;

    try {
      // Reuse existing AudioContext if possible
      let ctx = audioContextRef.current;
      if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;
      }

      // If suspended (iOS), it will be resumed on first user gesture via unlockAudio
      if (ctx.state === 'running') {
        attachAnalyser(ctx, stream);
      } else {
        // Wait for resume
        ctx.addEventListener('statechange', function onState() {
          if (ctx!.state === 'running') {
            ctx!.removeEventListener('statechange', onState);
            attachAnalyser(ctx!, stream);
          }
        });
      }
    } catch (err) {
      console.error('[VoiceRTC] Error setting up speaking detection:', err);
    }
  }, []);

  const attachAnalyser = useCallback((ctx: AudioContext, stream: MediaStream) => {
    if (analyserRef.current) return; // Already attached

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkSpeaking = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

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
        const stream = event.streams[0];
        remoteStreamsRef.current.set(socketId, stream);
        audioStreamsRef.current.set(socketId, stream);

        // Mute if speaker is muted
        if (isSpeakerMuted) {
          stream.getAudioTracks().forEach(t => t.enabled = false);
        }

        // Create audio element for playback (mobile-compatible)
        createAudioElement(socketId, stream);

        // Start speaking detection for this peer
        setupRemoteSpeakingDetection(socketId, stream);

        // Force re-render
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
      if (pc.connectionState === 'disconnected') {
        // On mobile, temporary disconnections are common — wait before closing
        setTimeout(() => {
          if (pc.connectionState === 'disconnected') {
            closePeerConnection(socketId, '');
          }
        }, 5000);
      }
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        closePeerConnection(socketId, '');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[VoiceRTC] ICE state (${socketId}): ${pc.iceConnectionState}`);

      if (pc.iceConnectionState === 'failed') {
        const retries = iceRetriesRef.current.get(socketId) || 0;
        if (retries < MAX_ICE_RETRIES) {
          iceRetriesRef.current.set(socketId, retries + 1);
          console.log(`[VoiceRTC] ICE failed, restart attempt ${retries + 1}/${MAX_ICE_RETRIES}`);
          try {
            pc.restartIce();
            // Force renegotiation
            pc.setLocalDescription(pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false }))
              .then(offer => {
                socket.emit('offer', {
                  targetSocketId: socketId,
                  roomId: configRef.current.roomId,
                  offer,
                });
              })
              .catch(() => {});
          } catch { /* ignore */ }
        } else {
          console.log(`[VoiceRTC] Max ICE retries reached for ${socketId}`);
          closePeerConnection(socketId, '');
        }
      }
    };

    connectionsRef.current.set(socketId, pc);
    return pc;
  }, [isSpeakerMuted]);

  /* ── Create audio element for remote stream (mobile-compatible) ── */
  const createAudioElement = useCallback((socketId: string, stream: MediaStream) => {
    // Remove old element if exists
    const old = audioElementsRef.current.get(socketId);
    if (old) {
      old.pause();
      old.srcObject = null;
      if (old.parentNode) old.parentNode.removeChild(old);
    }

    const audio = new Audio();
    audio.srcObject = stream;
    audio.playsInline = true; // Required for iOS
    audio.preload = 'auto';
    audio.style.display = 'none';
    audio.setAttribute('autoplay', ''); // Hint for browsers that support it

    // Try to play immediately
    audio.play().then(() => {
      console.log('[VoiceRTC] ▶️ Audio playing for', socketId);
    }).catch(() => {
      // Autoplay blocked (iOS) — queue for unlock
      console.log('[VoiceRTC] ⏸️ Audio autoplay blocked, queuing for unlock:', socketId);
      pendingAudioStreamsRef.current.set(socketId, stream);
    });

    document.body.appendChild(audio);
    audioElementsRef.current.set(socketId, audio);
  }, []);

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

  /* ── Remote speaking detection (mobile-compatible) ── */
  const setupRemoteSpeakingDetection = useCallback((socketId: string, stream: MediaStream) => {
    if (typeof window === 'undefined' || !stream.getAudioTracks().length) return;

    try {
      let ctx = remoteAudioContextsRef.current.get(socketId);
      if (!ctx || ctx.state === 'closed') {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        remoteAudioContextsRef.current.set(socketId, ctx);
      }

      if (ctx.state === 'running') {
        attachRemoteAnalyser(socketId, ctx, stream);
      } else {
        // Wait for user gesture to resume (iOS)
        const onState = () => {
          if (ctx!.state === 'running') {
            ctx!.removeEventListener('statechange', onState);
            attachRemoteAnalyser(socketId, ctx!, stream);
          }
        };
        ctx.addEventListener('statechange', onState);
      }
    } catch (err) {
      // Ignore - some browsers may block AudioContext creation
    }
  }, []);

  const attachRemoteAnalyser = useCallback((socketId: string, ctx: AudioContext, stream: MediaStream) => {
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const check = () => {
      if (!remoteStreamsRef.current.has(socketId)) {
        ctx.close().catch(() => {});
        remoteAudioContextsRef.current.delete(socketId);
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
        const timer = speakingTimersRef.current.get(socketId);
        if (timer) clearTimeout(timer);
      } else if (!isSpeaking && wasSpeaking) {
        const timer = setTimeout(() => {
          speakingPeersRef.current.set(socketId, false);
          setLocalSpeaking(prev => prev);
        }, 500);
        speakingTimersRef.current.set(socketId, timer);
      }

      requestAnimationFrame(check);
    };

    check();
  }, []);

  /* ── Close peer connection ── */
  const closePeerConnection = useCallback((socketId: string, _userId: string) => {
    const pc = connectionsRef.current.get(socketId);
    if (pc) {
      pc.close();
      connectionsRef.current.delete(socketId);
    }
    remoteStreamsRef.current.delete(socketId);
    audioStreamsRef.current.delete(socketId);

    // Close audio element
    const audio = audioElementsRef.current.get(socketId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      if (audio.parentNode) audio.parentNode.removeChild(audio);
      audioElementsRef.current.delete(socketId);
    }

    pendingAudioStreamsRef.current.delete(socketId);

    // Close remote AudioContext
    const remoteCtx = remoteAudioContextsRef.current.get(socketId);
    if (remoteCtx) {
      remoteCtx.close().catch(() => {});
      remoteAudioContextsRef.current.delete(socketId);
    }

    const timer = speakingTimersRef.current.get(socketId);
    if (timer) clearTimeout(timer);
    speakingTimersRef.current.delete(socketId);
    iceRetriesRef.current.delete(socketId);
    speakingPeersRef.current.delete(socketId);
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
    iceRetriesRef.current.clear();

    // Close all audio elements
    for (const [key, audio] of audioElementsRef.current.entries()) {
      audio.pause();
      audio.srcObject = null;
      if (audio.parentNode) audio.parentNode.removeChild(audio);
    }
    audioElementsRef.current.clear();
    pendingAudioStreamsRef.current.clear();

    // Close all remote AudioContexts
    for (const [, ctx] of remoteAudioContextsRef.current.entries()) {
      ctx.close().catch(() => {});
    }
    remoteAudioContextsRef.current.clear();

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
      try {
        socket.emit('leave-room', { roomId: configRef.current.roomId });
      } catch {}
      socket.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsAudioUnlocked(false);
    audioUnlockedRef.current = false;
    setLocalSpeaking(false);
    localSpeakingRef.current = false;
    setNotifications([]);
  }, []);

  /* ── Toggle mic ── */
  const toggleMic = useCallback(() => {
    const newMuted = !isLocalMicMuted;
    setIsLocalMicMuted(newMuted);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !newMuted;
      });
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit('mic-toggle', {
        roomId: configRef.current.roomId,
        micMuted: newMuted,
      });
    }

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

    if (!configRef.current.isOnSeat) {
      for (const [socketId] of connectionsRef.current.entries()) {
        closePeerConnection(socketId, '');
      }
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
    isAudioUnlocked,
    notifications,
    clearNotification,
    toggleMic,
    toggleSpeaker,
    setLocalMuted,
    unlockAudio,
    audioStreams,
  };
}
