import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

interface User {
  id: string;
  name: string;
  icon: string;
  socketId: string;
}

interface VoiceCallProps {
  socket: Socket;
  user: User;
  partner: User;
  onEndCall: () => void;
}

export default function VoiceCall({ socket, user, partner, onEndCall }: VoiceCallProps) {
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [partnerVolume, setPartnerVolume] = useState(100);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initializeCall = async () => {
      try {
        // ローカルストリーム取得
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        localStreamRef.current = stream;
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = stream;
        }

        // RTCPeerConnection作成
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        peerConnectionRef.current = pc;

        // ローカルストリームを追加
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // リモートストリーム処理
        pc.ontrack = (event) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
            setIsConnected(true);
          }
        };

        // ICE candidate処理
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('call-ice-candidate', {
              candidate: event.candidate,
              targetSocketId: partner.socketId
            });
          }
        };

        // Offer作成・送信
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call-offer', {
          offer: offer,
          targetSocketId: partner.socketId
        });

        // Answer受信
        socket.on('call-answer', (data: { answer: RTCSessionDescriptionInit; from: string }) => {
          if (data.from === partner.socketId && pc.signalingState !== 'closed') {
            pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });

        // ICE candidate受信
        socket.on('call-ice-candidate', (data: { candidate: RTCIceCandidateInit; from: string }) => {
          if (data.from === partner.socketId && pc.remoteDescription) {
            pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        });

        // Offer受信（相手から）
        socket.on('call-offer', async (data: { offer: RTCSessionDescriptionInit; from: { socketId: string } }) => {
          if (data.from.socketId === partner.socketId && pc.signalingState === 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('call-answer', {
              answer: answer,
              targetSocketId: partner.socketId
            });
          }
        });

        // 通話終了
        socket.on('call-end', (data: { from: string }) => {
          if (data.from === partner.socketId) {
            handleEndCall();
          }
        });
      } catch (error) {
        console.error('通話初期化エラー:', error);
        alert('マイクへのアクセスが拒否されました。');
        onEndCall();
      }
    };

    initializeCall();

    return () => {
      handleEndCall();
    };
  }, []);

  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    socket.emit('call-end', { targetSocketId: partner.socketId });
    onEndCall();
  };

  const toggleMicMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = isMicMuted;
      });
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleSpeakerMute = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerMuted;
      setIsSpeakerMuted(!isSpeakerMuted);
    }
  };

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = partnerVolume / 100;
    }
  }, [partnerVolume]);

  return (
    <div className="w-96 bg-gray-900 border-l-2 border-white flex flex-col shadow-xl">
      <div className="bg-gray-800 border-b-2 border-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{partner.icon}</span>
            <div>
              <h3 className="font-bold text-white">{partner.name}</h3>
              <p className="text-xs text-gray-400">ID: {partner.id}</p>
            </div>
          </div>
          <button
            onClick={handleEndCall}
            className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors text-white"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="text-6xl mb-4">{partner.icon}</div>
        <div className="text-center">
          <div className="font-semibold text-lg text-white">{partner.name}</div>
          <div className="text-sm text-gray-400 mt-1">
            {isConnected ? '接続中' : '接続待機中...'}
          </div>
        </div>

        {/* コントロールボタン */}
        <div className="flex flex-wrap gap-3 mt-8 justify-center">
          <button
            onClick={toggleMicMute}
            className={`p-4 rounded-full ${
              isMicMuted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-700 hover:bg-gray-600'
            } text-white transition-colors`}
            title={isMicMuted ? 'マイクミュート解除' : 'マイクミュート'}
          >
            {isMicMuted ? '🔇' : '🎤'}
          </button>
          <button
            onClick={toggleSpeakerMute}
            className={`p-4 rounded-full ${
              isSpeakerMuted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-700 hover:bg-gray-600'
            } text-white transition-colors`}
            title={isSpeakerMuted ? 'スピーカーミュート解除' : 'スピーカーミュート'}
          >
            {isSpeakerMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={handleEndCall}
            className="p-4 bg-red-600 rounded-full hover:bg-red-700 text-white transition-colors"
            title="通話終了"
          >
            📞
          </button>
        </div>

        {/* 相手の音量調整 */}
        <div className="w-full mt-6 p-4 bg-gray-800 border-2 border-white rounded-lg">
          <label className="block text-sm font-medium text-white mb-2">
            相手の音量: {partnerVolume}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={partnerVolume}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPartnerVolume(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <audio ref={localAudioRef} autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}

