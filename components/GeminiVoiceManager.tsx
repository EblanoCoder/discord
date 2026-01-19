import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { User } from '../types';
import { decodeAudioData, createPcmBlob, base64ToUint8Array } from '../services/audioUtils';
import { Mic, MicOff, PhoneOff, Radio } from 'lucide-react';

interface GeminiVoiceManagerProps {
  channelName: string;
  onDisconnect: () => void;
  currentUser: User;
}

const GeminiVoiceManager: React.FC<GeminiVoiceManagerProps> = ({ channelName, onDisconnect, currentUser }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());
  
  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Animation frame for volume meter visualization (mock)
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const connectToGemini = useCallback(async () => {
    try {
      if (!process.env.API_KEY) {
        console.warn("No API Key found. Voice simulation mode only.");
        setIsConnecting(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Setup Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are a helpful AI participant in a voice channel named ${channelName} on the Orbita platform. Chat casually, be brief, and act like a team member.`,
        },
      };

      const sessionPromise = ai.live.connect({
        model: config.model,
        config: config.config,
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            setIsConnecting(false);
            setActiveSpeakers(prev => new Set(prev).add('Orbita AI'));

            if (!inputAudioContextRef.current || !streamRef.current) return;

            const inputCtx = inputAudioContextRef.current;
            const source = inputCtx.createMediaStreamSource(streamRef.current);
            sourceRef.current = source;

            // Using ScriptProcessor as per guidance (AudioWorklet is better modern practice, but guidance uses SP)
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
               if (isMuted) return; // Simple mute logic
               const inputData = e.inputBuffer.getChannelData(0);
               const blob = createPcmBlob(inputData);
               
               sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: blob });
               });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (!outputAudioContextRef.current) return;
            const outputCtx = outputAudioContextRef.current;

            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               // Speaking indicator
               setActiveSpeakers(prev => new Set(prev).add('Orbita AI'));
               setTimeout(() => setActiveSpeakers(prev => {
                 const next = new Set(prev);
                 next.delete('Orbita AI');
                 return next;
               }), 2000); // Rough approximation of speaking time for UI

               const audioBytes = base64ToUint8Array(base64Audio);
               const audioBuffer = await decodeAudioData(audioBytes, outputCtx, 24000, 1);
               
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
               
               const source = outputCtx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputCtx.destination);
               source.start(nextStartTimeRef.current);
               
               activeSourcesRef.current.add(source);
               source.onended = () => activeSourcesRef.current.delete(source);
               
               nextStartTimeRef.current += audioBuffer.duration;
            }

            if (msg.serverContent?.interrupted) {
               activeSourcesRef.current.forEach(s => s.stop());
               activeSourcesRef.current.clear();
               nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
             console.log("Gemini Live Closed");
             // Reconnect logic could go here
          },
          onerror: (err) => {
             console.error("Gemini Live Error", err);
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (e) {
      console.error("Failed to connect voice:", e);
      setIsConnecting(false);
    }
  }, [channelName, isMuted]);

  useEffect(() => {
    connectToGemini();
    return () => {
      // Cleanup
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (processorRef.current && sourceRef.current) {
        sourceRef.current.disconnect();
        processorRef.current.disconnect();
      }
      if (inputAudioContextRef.current) inputAudioContextRef.current.close();
      if (outputAudioContextRef.current) outputAudioContextRef.current.close();
      sessionPromiseRef.current?.then(s => s.close());
    };
  }, [connectToGemini]);

  // Visualizer loop
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      let animationId: number;
      const draw = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#5865F2';
          const bars = 5;
          const time = Date.now() / 200;
          
          for(let i=0; i<bars; i++) {
              const h = Math.abs(Math.sin(time + i)) * 20 + 5;
              ctx.fillRect(i * 12 + 10, 15 - h/2, 8, h);
          }
          animationId = requestAnimationFrame(draw);
      };
      draw();
      return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="bg-gray-900 border-t border-gray-800 p-3 flex flex-col gap-2">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-400">
             <Radio size={16} className={isConnecting ? "animate-pulse" : ""} />
             <span className="text-sm font-semibold truncate max-w-[150px]">
               {isConnecting ? "Connecting..." : `${channelName} / Connected`}
             </span>
          </div>
          <button onClick={onDisconnect} className="text-gray-400 hover:text-white">
             <PhoneOff size={18} />
          </button>
       </div>
       
       {/* Active Participants Visualization */}
       <div className="flex gap-2 overflow-x-auto py-2">
           {/* Self */}
           <div className="relative group">
              <img src={currentUser.avatar} className={`w-10 h-10 rounded-full border-2 ${isMuted ? 'border-red-500' : 'border-green-500'}`} alt="me" />
              <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-0.5">
                  {isMuted ? <MicOff size={12} className="text-red-500"/> : <Mic size={12} className="text-green-500"/>}
              </div>
           </div>

           {/* AI / Others */}
           <div className={`relative transition-all duration-300 ${activeSpeakers.has('Orbita AI') ? 'scale-110' : ''}`}>
               <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold border-2 border-transparent">
                  AI
               </div>
               {activeSpeakers.has('Orbita AI') && (
                   <span className="absolute -top-1 -right-1 flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                   </span>
               )}
           </div>
           
           <canvas ref={canvasRef} width={80} height={30} className="ml-auto opacity-50" />
       </div>

       <div className="flex justify-center gap-4 mt-1">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-full ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
          >
             {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
       </div>
    </div>
  );
};

export default GeminiVoiceManager;