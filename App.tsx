import React, { useState, useEffect, useRef } from 'react';
import { 
  HashRouter, 
  Routes, 
  Route 
} from 'react-router-dom';
import { 
  Plus, 
  Compass, 
  Download, 
  Hash, 
  Volume2, 
  Settings, 
  Mic, 
  Headphones, 
  UserPlus, 
  Video, 
  Phone, 
  Smile, 
  Paperclip,
  Menu,
  X,
  Copy,
  Check
} from 'lucide-react';

import { MOCK_SERVERS, MOCK_DMS, CURRENT_USER, MOCK_USERS } from './constants';
import { Server, Channel, ChannelType, User, Message, AppView } from './types';
import GeminiVoiceManager from './components/GeminiVoiceManager';
import { Tooltip } from './components/Tooltip';

// --- Sub-components (defined in same file for single-file constraints where appropriate, but logically separated) ---

const ServerIcon: React.FC<{ 
  server?: Server; 
  isActive?: boolean; 
  onClick?: () => void;
  icon?: React.ReactNode;
  color?: string;
  label: string;
}> = ({ server, isActive, onClick, icon, color, label }) => {
  return (
    <div className="relative flex items-center justify-center w-[72px] mb-2 cursor-pointer group" onClick={onClick}>
      {/* Active Indicator */}
      <div className={`absolute left-0 bg-white rounded-r-full transition-all duration-200 
        ${isActive ? 'h-10 w-1' : 'h-2 w-1 scale-0 group-hover:scale-100 group-hover:h-5'}`} 
      />
      
      <Tooltip text={label}>
        <div className={`w-12 h-12 rounded-[24px] transition-all duration-200 overflow-hidden flex items-center justify-center
          ${isActive ? 'rounded-[16px] bg-[#5865F2]' : 'group-hover:rounded-[16px] group-hover:bg-[#5865F2]'}
          ${!server && !isActive ? 'bg-[#313338] text-[#23a559] group-hover:text-white group-hover:bg-[#23a559]' : ''}
          ${color ? color : 'bg-[#313338]'}
        `}>
          {server ? (
            <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
          ) : (
            icon
          )}
        </div>
      </Tooltip>
    </div>
  );
};

const InviteModal: React.FC<{ serverName: string, onClose: () => void }> = ({ serverName, onClose }) => {
  const [copied, setCopied] = useState(false);
  // Generate a realistic looking invite code
  const code = useRef(Math.random().toString(36).substring(2, 8).toUpperCase()).current;
  const inviteLink = `https://orbita.gg/${serverName.replace(/\s+/g, '-').toLowerCase()}/${code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback if clipboard fails in some sandbox environments
      setCopied(true);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#313338] w-full max-w-[440px] rounded-lg shadow-2xl overflow-hidden scale-100 transition-transform" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 flex justify-between items-center">
            <h4 className="font-bold text-white uppercase text-xs tracking-wide">Invite friends to {serverName}</h4>
            <button onClick={onClose}><X className="text-gray-400 hover:text-white" /></button>
        </div>
        <div className="px-4 pb-6">
            <p className="text-[#B5BAC1] text-xs mb-2 font-semibold uppercase">Send a server invite link to a friend</p>
            <div className="flex bg-[#1E1F22] rounded p-1 items-center border border-[#1E1F22] focus-within:border-[#00A8FC] transition-colors">
                <input 
                    type="text" 
                    value={inviteLink} 
                    readOnly 
                    className="bg-transparent text-gray-200 text-sm flex-1 px-2 outline-none"
                />
                <button 
                    onClick={handleCopy}
                    className={`min-w-[70px] px-4 py-1.5 rounded text-sm font-medium transition-colors flex justify-center items-center ${copied ? 'bg-green-600 text-white' : 'bg-[#5865F2] text-white hover:bg-[#4752C4]'}`}
                >
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <p className="text-[10px] text-[#949BA4] mt-2">Your invite link expires in 7 days.</p>
        </div>
        <div className="bg-[#2B2D31] p-4 text-xs text-[#B5BAC1] flex flex-col gap-2">
           <div className="flex items-center gap-2 cursor-pointer hover:text-white">
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-black text-[10px] font-bold">+</div>
              Add another link
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Logic ---

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.SERVER);
  const [activeServerId, setActiveServerId] = useState<string>(MOCK_SERVERS[0].id);
  const [activeChannelId, setActiveChannelId] = useState<string>(MOCK_SERVERS[0].channels[0].id);
  const [activeDMId, setActiveDMId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Voice State
  const [activeVoiceChannel, setActiveVoiceChannel] = useState<Channel | null>(null);

  const activeServer = MOCK_SERVERS.find(s => s.id === activeServerId);
  const activeChannel = activeServer?.channels.find(c => c.id === activeChannelId);

  // Messages State (Simple in-memory store for demo)
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  useEffect(() => {
    // Initialize mock messages
    const initialMsgs: Record<string, Message[]> = {};
    MOCK_SERVERS.forEach(s => s.channels.forEach(c => {
      initialMsgs[c.id] = c.messages;
    }));
    setMessages(initialMsgs);
  }, []);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      content: text,
      senderId: CURRENT_USER.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Determine where to add message
    const targetId = activeChannelId; 
    setMessages(prev => ({
      ...prev,
      [targetId]: [...(prev[targetId] || []), newMessage]
    }));
  };

  const handleJoinVoice = (channel: Channel) => {
    if (activeVoiceChannel?.id === channel.id) return;
    setActiveVoiceChannel(channel);
  };

  const handleLeaveVoice = () => {
    setActiveVoiceChannel(null);
  };

  return (
    <HashRouter>
      <div className="flex h-screen w-full bg-[#313338] text-gray-100 font-sans overflow-hidden">
        
        {/* 1. Server Sidebar (Leftmost) */}
        <nav className="w-[72px] bg-[#1E1F22] py-3 flex flex-col items-center flex-shrink-0 overflow-y-auto no-scrollbar hidden sm:flex">
          {/* DM / Home Button */}
          <ServerIcon 
            label="Direct Messages"
            icon={<img src="https://assets-global.website-files.com/6257adef93867e56f84d3092/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" className="w-7 h-7" alt="Home" />}
            isActive={currentView === AppView.DM} 
            color="bg-[#313338]"
            onClick={() => { setCurrentView(AppView.DM); setActiveDMId(null); }}
          />
          
          <div className="w-8 h-[2px] bg-[#35363C] rounded-lg mb-2"></div>
          
          {/* Server List */}
          {MOCK_SERVERS.map(server => (
            <ServerIcon 
              key={server.id} 
              server={server} 
              label={server.name}
              isActive={currentView === AppView.SERVER && activeServerId === server.id} 
              onClick={() => { 
                setActiveServerId(server.id); 
                setCurrentView(AppView.SERVER);
                // Default to first text channel
                const firstText = server.channels.find(c => c.type === ChannelType.TEXT);
                if (firstText) setActiveChannelId(firstText.id);
              }} 
            />
          ))}

          <div className="w-8 h-[2px] bg-[#35363C] rounded-lg mb-2"></div>

          <ServerIcon 
            label="Add Server"
            icon={<Plus size={24} className="text-[#23a559] group-hover:text-white" />} 
          />
          <ServerIcon 
            label="Explore"
            icon={<Compass size={24} className="text-[#23a559] group-hover:text-white" />} 
          />
        </nav>

        {/* 2. Secondary Sidebar (Channels or DMs) */}
        <div className={`w-60 bg-[#2B2D31] flex flex-col flex-shrink-0 ${mobileMenuOpen ? 'absolute z-20 h-full' : 'hidden md:flex'}`}>
          {/* Header */}
          <div className="h-12 shadow-sm border-b border-[#1F2023] flex items-center px-4 font-bold hover:bg-[#35373C] cursor-pointer transition-colors text-white">
            {currentView === AppView.SERVER ? activeServer?.name : 'Find or start a conversation'}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
            {currentView === AppView.SERVER && activeServer ? (
               <>
                 {/* Text Channels */}
                 <div className="pt-4 px-2 pb-1 text-xs font-bold text-[#949BA4] uppercase hover:text-gray-300 cursor-pointer flex items-center">
                    <span>Text Channels</span>
                    <Plus size={12} className="ml-auto cursor-pointer" />
                 </div>
                 {activeServer.channels.filter(c => c.type === ChannelType.TEXT).map(channel => (
                   <div 
                      key={channel.id}
                      onClick={() => { setActiveChannelId(channel.id); setMobileMenuOpen(false); }}
                      className={`group px-2 py-1.5 rounded mx-1 flex items-center cursor-pointer transition-colors
                        ${activeChannelId === channel.id ? 'bg-[#404249] text-white' : 'text-[#949BA4] hover:bg-[#35373C] hover:text-gray-200'}
                      `}
                   >
                     <Hash size={20} className="mr-1.5 text-[#80848E]" />
                     <span className="truncate font-medium">{channel.name}</span>
                   </div>
                 ))}

                 {/* Voice Channels */}
                 <div className="pt-4 px-2 pb-1 text-xs font-bold text-[#949BA4] uppercase hover:text-gray-300 cursor-pointer flex items-center">
                    <span>Voice Channels</span>
                    <Plus size={12} className="ml-auto cursor-pointer" />
                 </div>
                 {activeServer.channels.filter(c => c.type === ChannelType.VOICE).map(channel => (
                   <div 
                      key={channel.id}
                      onClick={() => { handleJoinVoice(channel); setMobileMenuOpen(false); }}
                      className={`group px-2 py-1.5 rounded mx-1 flex items-center cursor-pointer transition-colors
                        ${activeVoiceChannel?.id === channel.id ? 'bg-[#404249] text-white' : 'text-[#949BA4] hover:bg-[#35373C] hover:text-gray-200'}
                      `}
                   >
                     <Volume2 size={20} className="mr-1.5 text-[#80848E]" />
                     <span className="truncate font-medium">{channel.name}</span>
                   </div>
                 ))}
               </>
            ) : (
              // DM List
              <>
                 <div className="px-2 py-2">
                   <button className="w-full text-left bg-[#1E1F22] text-[#949BA4] text-sm p-2 rounded hover:text-gray-200">
                     Find or start a conversation
                   </button>
                 </div>
                 <div className="pt-2 px-2 pb-1 text-xs font-bold text-[#949BA4] uppercase">Direct Messages</div>
                 {MOCK_DMS.map(dm => (
                   <div key={dm.id} className="group px-2 py-2 rounded mx-1 flex items-center cursor-pointer text-[#949BA4] hover:bg-[#35373C] hover:text-gray-200">
                      <div className="relative mr-3">
                        <img src={dm.user.avatar} className="w-8 h-8 rounded-full" alt={dm.user.username}/>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#2B2D31] rounded-full 
                          ${dm.user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                      <span className="font-medium">{dm.user.username}</span>
                   </div>
                 ))}
              </>
            )}
          </div>

          {/* User Controls Footer */}
          <div className="bg-[#232428] p-2 flex items-center text-gray-200">
             <div className="relative group cursor-pointer mr-2">
                <img src={CURRENT_USER.avatar} className="w-8 h-8 rounded-full hover:opacity-80" alt="Me" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#232428] rounded-full"></div>
             </div>
             <div className="flex-1 overflow-hidden">
                <div className="text-sm font-semibold truncate">{CURRENT_USER.username}</div>
                <div className="text-xs text-gray-400 truncate">#1337</div>
             </div>
             <div className="flex items-center space-x-1">
                <button className="p-1.5 rounded hover:bg-[#3F4147]"><Mic size={18}/></button>
                <button className="p-1.5 rounded hover:bg-[#3F4147]"><Headphones size={18}/></button>
                <button className="p-1.5 rounded hover:bg-[#3F4147]"><Settings size={18}/></button>
             </div>
          </div>
        </div>

        {/* 3. Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#313338] relative">
          
          {/* Mobile Header */}
          <div className="md:hidden h-12 border-b border-[#26272D] flex items-center px-4 shadow-sm">
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mr-4 text-gray-300">
               {mobileMenuOpen ? <X /> : <Menu />}
             </button>
             <span className="font-bold text-white">Orbita</span>
          </div>

          {/* Channel Header */}
          <div className="h-12 border-b border-[#26272D] flex items-center px-4 shadow-sm justify-between">
            <div className="flex items-center text-white">
               {currentView === AppView.SERVER ? (
                 <>
                   <Hash size={24} className="text-[#80848E] mr-2" />
                   <h3 className="font-bold mr-4">{activeChannel?.name || 'select-channel'}</h3>
                   <span className="text-[#949BA4] text-sm hidden sm:block truncate border-l border-[#3F4147] pl-4">
                     {activeChannel?.name === 'general' ? 'General chat for everyone.' : 'Topic of the day.'}
                   </span>
                 </>
               ) : (
                 <h3 className="font-bold">Friends</h3>
               )}
            </div>
            <div className="flex items-center space-x-4 text-[#B5BAC1]">
               <Phone className="cursor-pointer hover:text-gray-200" size={24} />
               <Video className="cursor-pointer hover:text-gray-200" size={24} />
               <div className="relative hidden sm:block">
                  <input type="text" placeholder="Search" className="bg-[#1E1F22] text-sm rounded px-2 py-1 text-gray-200 w-36 transition-all focus:w-60" />
               </div>
               <UserPlus 
                className="cursor-pointer hover:text-gray-200" 
                size={24} 
                onClick={() => setShowInviteModal(true)}
               />
            </div>
          </div>

          {/* Chat / Messages Area */}
          <div className="flex-1 overflow-y-auto flex flex-col p-4 space-y-4 custom-scrollbar">
             {/* Welcome Message */}
             <div className="mt-auto mb-4">
                <div className="w-16 h-16 bg-[#41434A] rounded-full flex items-center justify-center mb-4">
                   <Hash size={40} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome to #{activeChannel?.name}!</h1>
                <p className="text-[#B5BAC1]">This is the start of the #{activeChannel?.name} channel.</p>
             </div>

             {/* Message List */}
             {activeChannel && messages[activeChannel.id]?.map((msg) => {
               const user = MOCK_USERS[msg.senderId];
               return (
                 <div key={msg.id} className="flex group hover:bg-[#2E3035] -mx-4 px-4 py-1 mt-0.5">
                    <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full mr-4 mt-0.5 cursor-pointer hover:opacity-80" />
                    <div className="flex-1 min-w-0">
                       <div className="flex items-baseline">
                          <span className={`font-medium mr-2 cursor-pointer hover:underline ${user.id === 'me' ? 'text-white' : 'text-gray-100'}`}>
                            {user.username}
                          </span>
                          {user.isBot && <span className="bg-[#5865F2] text-white text-[10px] px-1.5 rounded mr-2 align-middle flex items-center h-4">APP</span>}
                          <span className="text-xs text-[#949BA4]">{msg.timestamp}</span>
                       </div>
                       <p className={`text-[#DBDEE1] whitespace-pre-wrap`}>{msg.content}</p>
                    </div>
                 </div>
               );
             })}
          </div>

          {/* Voice Overlay (if active) */}
          {activeVoiceChannel && (
            <GeminiVoiceManager 
              channelName={activeVoiceChannel.name} 
              onDisconnect={handleLeaveVoice}
              currentUser={CURRENT_USER}
            />
          )}

          {/* Message Input */}
          <div className="p-4 pt-0">
            <div className="bg-[#383A40] rounded-lg px-4 py-2.5 flex items-center">
               <button className="text-[#B5BAC1] hover:text-gray-200 mr-4 bg-[#383A40]">
                 <Plus size={24} className="bg-[#B5BAC1] text-[#383A40] rounded-full p-0.5 hover:bg-gray-200" />
               </button>
               <input 
                 type="text" 
                 placeholder={`Message #${activeChannel?.name || 'channel'}`} 
                 className="bg-transparent flex-1 text-gray-200 outline-none placeholder-[#949BA4]"
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     handleSendMessage(e.currentTarget.value);
                     e.currentTarget.value = '';
                   }
                 }}
               />
               <div className="flex space-x-3 text-[#B5BAC1] ml-2">
                  <GiftIcon className="hover:text-gray-200 cursor-pointer" />
                  <GifIcon className="hover:text-gray-200 cursor-pointer" />
                  <StickerIcon className="hover:text-gray-200 cursor-pointer" />
                  <Smile size={24} className="hover:text-gray-200 cursor-pointer" />
               </div>
            </div>
          </div>
        </div>

        {/* 4. Members Sidebar (Hidden on small screens) */}
        {currentView === AppView.SERVER && (
          <div className="w-60 bg-[#2B2D31] hidden lg:flex flex-col flex-shrink-0 border-l border-[#26272D] overflow-y-auto p-4 custom-scrollbar">
            <h3 className="text-[#949BA4] text-xs font-bold uppercase mb-4">Online — {Object.values(MOCK_USERS).filter(u => u.status !== 'offline').length}</h3>
            {Object.values(MOCK_USERS).filter(u => u.status !== 'offline').map(user => (
               <div key={user.id} className="flex items-center mb-2 px-2 py-1.5 rounded hover:bg-[#35373C] cursor-pointer opacity-90 hover:opacity-100">
                  <div className="relative mr-3">
                     <img src={user.avatar} className="w-8 h-8 rounded-full" alt={user.username} />
                     <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] border-[#2B2D31] rounded-full 
                        ${user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  </div>
                  <div>
                    <div className={`font-medium ${user.isBot ? 'text-blue-400' : 'text-gray-200'}`}>{user.username}</div>
                    {user.id === 'u2' && <div className="text-xs text-[#949BA4]">Listening to Spotify</div>}
                  </div>
               </div>
            ))}
            
            <h3 className="text-[#949BA4] text-xs font-bold uppercase mt-6 mb-4">Offline — 14</h3>
            {/* Mock offline users */}
            {[1,2,3].map(i => (
               <div key={i} className="flex items-center mb-2 px-2 py-1.5 rounded hover:bg-[#35373C] cursor-pointer opacity-40 hover:opacity-70">
                  <img src={`https://picsum.photos/seed/${i+50}/200`} className="w-8 h-8 rounded-full mr-3 grayscale" alt="offline" />
                  <div className="font-medium text-gray-400">User_{i+99}</div>
               </div>
            ))}
          </div>
        )}

        {/* Invite Modal Overlay */}
        {showInviteModal && activeServer && (
            <InviteModal serverName={activeServer.name} onClose={() => setShowInviteModal(false)} />
        )}

      </div>
    </HashRouter>
  );
};

// Simple Icons
const GiftIcon = ({ className }: {className?: string}) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 6h-3V4c0-1.103-.897-2-2-2h-2.172a2.98 2.98 0 0 0-2.122.879l-1.414 1.414A2.98 2.98 0 0 0 8.414 6H6c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V8c0-1.103-.897-2-2-2zM6 8h4.5v12H6V8zm6.5 12V8H18v12h-5.5z"/>
  </svg>
);
const GifIcon = ({ className }: {className?: string}) => (
  <div className={`border-2 border-current rounded px-1 text-[10px] font-bold leading-4 ${className}`}>GIF</div>
);
const StickerIcon = ({ className }: {className?: string}) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
     <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>
);

export default App;