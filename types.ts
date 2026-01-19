export enum ChannelType {
  TEXT = 'TEXT',
  VOICE = 'VOICE'
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  isBot?: boolean;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  attachment?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  messages: Message[]; // Mocking DB storage in memory
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  channels: Channel[];
}

export interface DirectMessage {
  id: string;
  user: User;
  messages: Message[];
}

export enum AppView {
  SERVER = 'SERVER',
  DM = 'DM'
}