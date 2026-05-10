import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Send, 
  User as UserIcon, 
  MessageSquare, 
  Clock, 
  CheckCheck,
  Zap,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchChatHistory(selectedContact.otherUser.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    const handleSocketMessage = (event) => {
      const data = event.detail;
      // If the message is from the person we are currently chatting with
      if (selectedContact && (data.senderId === selectedContact.otherUser.id || data.receiverId === selectedContact.otherUser.id)) {
        // Avoid duplicates if it's our own message being echoed (though backend shouldn't echo)
        setMessages(prev => {
            if (prev.some(m => m.id === data.id)) return prev;
            return [...prev, data];
        });
      }
    };

    window.addEventListener('socket_message', handleSocketMessage);
    return () => window.removeEventListener('socket_message', handleSocketMessage);
  }, [selectedContact]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/requests/accepted');
      // Use a Map to ensure unique contacts by User ID
      const contactsMap = new Map();
      
      res.data.forEach(req => {
        if (!req.sender || !req.receiver || !user) return;
        
        const otherUser = req.sender.id === user.id ? req.receiver : req.sender;
        if (otherUser && !contactsMap.has(otherUser.id)) {
            contactsMap.set(otherUser.id, { 
                id: req.id, 
                otherUser, 
                lastMessage: "Neural link secured",
                timestamp: req.createdAt
            });
        }
      });
      
      setContacts(Array.from(contactsMap.values()));
    } catch (err) {
      console.error("Failed to load contacts", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async (otherUserId) => {
    try {
      const res = await api.get(`/messages/history/${otherUserId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !socket || socket.readyState !== WebSocket.OPEN) {
        if (socket?.readyState !== WebSocket.OPEN) {
            toast.error("Neural link unstable. Reconnecting...");
        }
        return;
    }

    const messageData = {
      senderId: user.id,
      receiverId: selectedContact.otherUser.id,
      content: newMessage.trim(),
      type: 'CHAT'
    };

    // Send via standard WebSocket
    socket.send(JSON.stringify(messageData));

    // Optimistically update UI
    setMessages(prev => [...prev, {
      id: Date.now().toString(), // Temporary ID
      senderId: user.id,
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    }]);

    setNewMessage("");
  };

  return (
    <div className="min-h-screen pt-24 pb-10 px-4 md:px-6 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto h-[80vh] flex glass-card overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-2xl">
        
        {/* Sidebar - Contacts */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-white/5 flex flex-col ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-white/5">
            <h1 className="text-2xl font-black uppercase tracking-tighter mb-4 text-white">Comms <span className="text-maroon">Center</span></h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search operatives..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-inter focus:border-maroon focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loading ? (
              <div className="flex justify-center p-10"><div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin" /></div>
            ) : contacts.length === 0 ? (
              <div className="text-center p-10">
                <MessageSquare className="mx-auto text-gray-700 mb-4" size={40} />
                <p className="text-gray-500 text-sm font-inter">No connections found. Initialize search in the dashboard.</p>
              </div>
            ) : contacts.map(contact => (
              <motion.button
                key={contact.id}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all mb-2 ${
                  selectedContact?.id === contact.id ? 'bg-white/5 border border-white/10' : 'border border-transparent'
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-maroon/20 to-white/5 flex items-center justify-center border border-white/10">
                    <UserIcon className="text-maroon" size={24} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-white truncate text-sm">{contact.otherUser.name}</h3>
                    <span className="text-[10px] text-gray-500 font-space whitespace-nowrap">
                      {new Date(contact.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate font-inter">{contact.lastMessage}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col bg-white/[0.01] ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedContact(null)} className="md:hidden text-gray-500 hover:text-white">
                    <ChevronLeft size={24} />
                  </button>
                  <div className="w-10 h-10 rounded-lg bg-maroon/10 flex items-center justify-center border border-maroon/20">
                    <UserIcon className="text-maroon" size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">{selectedContact.otherUser.name}</h2>
                    <p className="text-[10px] text-green-500 uppercase font-space tracking-widest">Active Neural Link</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-maroon/5 border border-maroon/10 rounded-lg">
                  <Zap size={14} className="text-maroon" />
                  <span className="text-[10px] font-space font-bold uppercase tracking-tight text-white/70">Matching Optimization Active</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <motion.div 
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl font-inter text-sm shadow-xl ${
                        isMe 
                          ? 'bg-maroon text-white rounded-tr-none border border-white/10' 
                          : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/5 backdrop-blur-md'
                      }`}>
                        <p>{msg.content}</p>
                        <div className={`flex items-center justify-end gap-2 mt-2 text-[10px] ${isMe ? 'text-white/60' : 'text-gray-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && <CheckCheck size={14} />}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-6 border-t border-white/5">
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Encrypt message and send..." 
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-inter focus:border-maroon focus:outline-none focus:ring-1 focus:ring-maroon selection:bg-maroon/30 transition-all shadow-inner"
                  />
                  <button 
                    type="submit"
                    className="w-14 h-14 bg-maroon rounded-2xl flex items-center justify-center text-white shadow-neon hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-40">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mb-6">
                <MessageSquare size={32} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-widest mb-2">Initialize Communication</h2>
              <p className="text-sm font-inter max-w-xs uppercase tracking-tight">Select an operative from the grid to establish a secure neural link</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
