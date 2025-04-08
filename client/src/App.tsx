import React, { useState, useEffect, useRef } from 'react';
import TypewriterEffect from './components/TypewriterEffect';
import './App.css';

interface Voice {
  id: string;
  description: string;
}

// Tốc độ phù hợp cho từng giọng nói (ms/character)
const VOICE_SPEEDS: { [key: string]: number } = {
  'alloy': 45,    // Giọng cân bằng, tốc độ trung bình
  'echo': 60,     // Giọng trầm, nói chậm hơn
  'fable': 50,    // Giọng ấm áp, tốc độ vừa phải
  'onyx': 40,     // Giọng mạnh mẽ, nói nhanh hơn
  'nova': 55,     // Giọng nữ chuyên nghiệp, tốc độ trung bình
  'shimmer': 35   // Giọng trẻ trung, nói nhanh
};

function App() {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [audioContent, setAudioContent] = useState<string>('');
  const [recognition, setRecognition] = useState<any>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('nova');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setTranscript(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    // Fetch available voices
    fetch('http://localhost:5001/api/voices')
      .then(response => response.json())
      .then(data => setVoices(data))
      .catch(error => console.error('Error fetching voices:', error));
  }, []);

  const handleMouseDown = () => {
    if (recognitionRef.current) {
      setTranscript(''); // Clear previous transcript
      recognitionRef.current.start();
      setIsListening(true);
      setIsRecording(true);
    }
  };

  const handleMouseUp = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsRecording(false);
      if (transcript.trim()) {
        handleSubmit();
      }
    }
  };

  const handleCancel = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsRecording(false);
      setTranscript('');
    }
  };

  useEffect(() => {
    // Initialize audio element
    if (audioRef.current) {
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onpause = () => setIsPlaying(false);
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
      };
    }
  }, [audioRef.current]);

  const playResponse = () => {
    if (audioRef.current && audioContent) {
      // Stop any ongoing playback
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Create audio source from base64
      const audioSrc = `data:audio/mp3;base64,${audioContent}`;
      audioRef.current.src = audioSrc;
      
      // Play the audio
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: transcript,
          voice: selectedVoice 
        }),
      });

      const data = await response.json();
      setResponse(data.response);
      setDisplayedResponse(''); // Reset displayed response
      setIsTyping(true); // Start typing animation
      setAudioContent(data.audioContent);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypingComplete = () => {
    setIsTyping(false);
  };

  const skipAnimation = () => {
    setDisplayedResponse(response);
    setIsTyping(false);
    // Play audio immediately when skipping
    if (audioContent) {
      playResponse();
    }
  };

  const getVoiceSpeed = (voiceId: string): number => {
    return VOICE_SPEEDS[voiceId] || 55; // Mặc định là 55 nếu không tìm thấy
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>English Learning Assistant</h1>
        <div className="voice-selector">
          <label htmlFor="voice-select">Choose a voice: </label>
          <select 
            id="voice-select"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
          >
            {voices.map(voice => (
              <option key={voice.id} value={voice.id}>
                {voice.id} - {voice.description}
              </option>
            ))}
          </select>
        </div>
        <div className="chat-container">
          <div className="transcript">
            <h3>Your Message:</h3>
            <p>{transcript}</p>
          </div>
          <div className="response">
            <h3>AI Response:</h3>
            <div className="response-content">
              {isLoading ? (
                <div className="loading-dots">
                  <span>Thinking</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </div>
              ) : response && (
                <>
                  <TypewriterEffect 
                    text={response} 
                    speed={getVoiceSpeed(selectedVoice)}
                    onStart={playResponse}
                    onComplete={handleTypingComplete}
                  />
                </>
              )}
            </div>
            {response && !isTyping && !isLoading && (
              <button 
                onClick={playResponse}
                disabled={isPlaying}
                className="speak-button"
              >
                {isPlaying ? 'Playing...' : 'Play Response'}
              </button>
            )}
            <audio ref={audioRef} />
          </div>
        </div>
        <div className="controls">
          <button 
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`record-button ${isRecording ? 'recording' : ''}`}
            disabled={isLoading}
          >
            {isRecording ? 'Recording...' : 'Hold to Speak'}
          </button>
          {isRecording && (
            <button 
              onClick={handleCancel}
              className="cancel-button"
            >
              Cancel
            </button>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
