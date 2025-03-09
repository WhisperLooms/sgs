import React, { useState, useRef, useEffect } from 'react';
import { Avatar, Box, Button, Container, IconButton, TextField, Typography, Paper, ThemeProvider, createTheme, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Send as SendIcon, Mic as MicIcon, Stop as StopIcon, VolumeUp as VolumeUpIcon, VolumeOff as VolumeOffIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { generateVoice, playAudio } from '../utils/elevenlabs';

// Update theme colors to match SGS requirements
const sgsTheme = createTheme({
  palette: {
    primary: {
      main: '#B8860B', // SGS Gold
      light: '#DAA520', // Lighter gold for hover states
    },
    secondary: {
      main: '#000000', // SGS Black
    },
    background: {
      default: '#F5F5F5',
      paper: '#ffffff',
    },
  },
});

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'headmaster';
  headmaster?: string;
  timestamp: Date;
  audioContent?: string;
}

interface HeadmasterProfile {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  tenure: string;
  avatarUrl: string;
  personality: string[];
  characterInfluences: string[];
  speakingStyle: string[];
}

interface Headmaster {
  id: string;
  name: string;
  subtitle: string;
  tenure: string;
  imagePath: string;
}

// Demo headmasters data
const headmasters: Headmaster[] = [
  {
    id: 'dr-laurence-halloran',
    name: 'Dr. Laurence Halloran',
    subtitle: 'The Founder',
    tenure: '1825',
    imagePath: '/images/Headmaster_1825_Halloran.jpg',
  },
  {
    id: 'william-timothy-cape',
    name: 'William Timothy Cape',
    subtitle: 'The Reformer',
    tenure: '1835-1841',
    imagePath: '/images/Headmaster_1835-1841_WilliamTimothCape.jpg',
  },
  {
    id: 'william-john-stephens',
    name: 'William John Stephens',
    subtitle: 'The Scholar',
    tenure: '1857',
    imagePath: '/images/Headmaster_1857_WJ_Stephens.jpg',
  },
  {
    id: 'albert-bythesea-weigall',
    name: 'Albert Bythesea Weigall',
    subtitle: 'The Chief',
    tenure: '1867-1912',
    imagePath: '/images/Headmaster_1867-1912_Weigall.jpg',
  },
];

export const HeadmasterChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedHeadmaster, setSelectedHeadmaster] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleHeadmasterChange = (event: any) => {
    setSelectedHeadmaster(event.target.value);
    setMessages([]);
    initiateChat(event.target.value);
  };

  const initiateChat = async (headmasterId: string) => {
    if (!headmasterId) return;
    
    const headmaster = headmasters.find(h => h.id === headmasterId);
    if (!headmaster) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/headmasterIntro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headmasterId })
      });
      
      if (!response.ok) throw new Error('Failed to get introduction');
      
      const data = await response.json();
      
      const introMessage: Message = {
        id: Date.now().toString(),
        text: data.introduction,
        sender: 'headmaster',
        headmaster: headmasterId,
        timestamp: new Date(),
      };
      
      setMessages([introMessage]);
      
      if (voiceEnabled) {
        playVoice(data.introduction);
      }
    } catch (error) {
      console.error('Error getting headmaster introduction:', error);
      const fallbackIntro = `Hello, I am ${headmaster.name}. How may I assist you today?`;
      
      setMessages([{
        id: Date.now().toString(),
        text: fallbackIntro,
        sender: 'headmaster',
        headmaster: headmasterId,
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedHeadmaster) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage('');
    setIsProcessing(true);

    try {
      // Format conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Call chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          headmasterId: selectedHeadmaster,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Add headmaster response to chat
      const headmasterMessage: Message = {
        id: Date.now().toString(),
        text: data.reply,
        sender: 'headmaster',
        headmaster: selectedHeadmaster,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, headmasterMessage]);

      // Generate voice if enabled
      if (voiceEnabled) {
        playVoice(data.reply);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "I apologize, but I'm unable to respond at the moment. Please try again later.",
        sender: 'headmaster',
        headmaster: selectedHeadmaster,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceInput = async (audioBlob: Blob) => {
    if (!selectedHeadmaster) return;
    
    setIsProcessing(true);
    
    try {
      // Create form data with audio file
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      
      // Send to OpenAI Whisper API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }
      
      const data = await response.json();
      
      // Set the transcribed text as the new message
      setNewMessage(data.text);
      
      // Auto-send the message
      if (data.text) {
        const userMessage: Message = {
          id: Date.now().toString(),
          text: data.text,
          sender: 'user',
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, userMessage]);
        
        // Now send the message to get a response
        await handleSendMessage();
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      startRecording();
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
  };

  const playVoice = async (text: string) => {
    try {
      const audioContent = await generateVoice(text);
      if (audioContent) {
        playAudio(audioContent);
      }
    } catch (error) {
      console.error('Error playing voice:', error);
    }
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
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        
        if (audioBlob.size > 0) {
          handleVoiceInput(audioBlob);
        }
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  return (
    <ThemeProvider theme={sgsTheme}>
      <Container maxWidth="md" sx={{ height: '100vh', py: 4 }}>
        {/* Header with Stained Glass Window */}
        <Box
          sx={{
            width: '100%',
            height: '200px',
            mb: 3,
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          <Box
            component="img"
            src="/images/FB_Image24.7_Laus Deo Window.jpg"
            alt="Sydney Grammar School Stained Glass"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: '#ffffff',
                fontFamily: 'Trajan Pro, serif',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              Historic Headmaster Chat
            </Typography>
          </Box>
        </Box>

        <Paper
          elevation={3}
          sx={{
            height: 'calc(100% - 200px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'primary.main',
          }}
        >
          {/* Headmaster Selection */}
          <Box sx={{ p: 2, borderBottom: '2px solid', borderColor: 'primary.main' }}>
            <FormControl fullWidth>
              <InputLabel id="headmaster-select-label">Select a Headmaster to chat with</InputLabel>
              <Select
                labelId="headmaster-select-label"
                value={selectedHeadmaster}
                onChange={handleHeadmasterChange}
                label="Select a Headmaster to chat with"
                displayEmpty
                sx={{
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <em>Select a Headmaster to chat with</em>
                </MenuItem>
                {headmasters.map((headmaster) => (
                  <MenuItem 
                    key={headmaster.id} 
                    value={headmaster.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Avatar
                        src={headmaster.imagePath}
                        alt={headmaster.name}
                        sx={{
                          width: 48,
                          height: 48,
                          mr: 2,
                          border: '2px solid',
                          borderColor: 'primary.main',
                        }}
                      />
                      <Box>
                        <Typography variant="subtitle1">
                          {headmaster.name} ({headmaster.tenure})
                        </Typography>
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{ fontStyle: 'italic' }}
                        >
                          "{headmaster.subtitle}"
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Chat Messages */}
          <Box
            sx={{
              flexGrow: 1,
              p: 3,
              overflowY: 'auto',
              bgcolor: '#f8f9fa',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <AnimatePresence>
              {messages.map((message) => {
                const isHeadmasterMessage = message.sender === 'headmaster';
                const headmaster = isHeadmasterMessage ? headmasters.find(h => h.id === message.headmaster) : null;
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      alignSelf: isHeadmasterMessage ? 'flex-start' : 'flex-end',
                      maxWidth: '80%',
                      marginBottom: 16,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isHeadmasterMessage ? 'row' : 'row-reverse',
                        alignItems: 'flex-start',
                      }}
                    >
                      {isHeadmasterMessage && headmaster && (
                        <Avatar
                          src={headmaster.imagePath}
                          alt={headmaster.name}
                          sx={{ mr: 1, mt: 0.5 }}
                        />
                      )}
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          bgcolor: isHeadmasterMessage ? 'white' : 'primary.light',
                          color: isHeadmasterMessage ? 'text.primary' : 'white',
                          borderRadius: 2,
                          borderTopLeftRadius: isHeadmasterMessage ? 0 : 2,
                          borderTopRightRadius: isHeadmasterMessage ? 2 : 0,
                        }}
                      >
                        <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                          {message.text}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={isHeadmasterMessage ? 'text.secondary' : 'rgba(255,255,255,0.8)'}
                          sx={{ display: 'block', mt: 1, textAlign: 'right' }}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Paper>
                    </Box>
                  </motion.div>
                );
              })}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ alignSelf: 'flex-start', margin: '10px 0' }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      bgcolor: 'white',
                      borderRadius: 2,
                      borderTopLeftRadius: 0,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Thinking...
                    </Typography>
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'white',
              borderTop: '1px solid #eaeaea',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <IconButton
              color={isRecording ? 'error' : 'primary'}
              onClick={toggleRecording}
              disabled={!selectedHeadmaster}
              sx={{ mr: 1 }}
            >
              {isRecording ? <StopIcon /> : <MicIcon />}
            </IconButton>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={selectedHeadmaster ? "Type your message..." : "Please select a headmaster first"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={!selectedHeadmaster || isProcessing}
              size="small"
              sx={{ mr: 1 }}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !selectedHeadmaster || isProcessing}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};