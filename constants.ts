import { User, Server, ChannelType, DirectMessage } from './types';

export const CURRENT_USER: User = {
  id: 'me',
  username: 'AlexR',
  avatar: 'https://picsum.photos/id/1012/200/200',
  status: 'online'
};

export const MOCK_USERS: Record<string, User> = {
  'u1': { id: 'u1', username: 'Dmitry_Dev', avatar: 'https://picsum.photos/id/1005/200/200', status: 'online' },
  'u2': { id: 'u2', username: 'Anna_Design', avatar: 'https://picsum.photos/id/1027/200/200', status: 'idle' },
  'u3': { id: 'u3', username: 'Orbita_Bot', avatar: 'https://picsum.photos/id/1010/200/200', status: 'online', isBot: true },
  'me': CURRENT_USER
};

export const MOCK_SERVERS: Server[] = [
  {
    id: 's1',
    name: 'React Developers RU',
    icon: 'https://picsum.photos/id/119/200/200',
    channels: [
      { id: 'c1', name: 'general', type: ChannelType.TEXT, messages: [
          { id: 'm1', content: 'Привет всем! Как дела с проектом?', senderId: 'u1', timestamp: '10:30 AM' },
          { id: 'm2', content: 'Все отлично, деплоим на Orbita Cloud.', senderId: 'u2', timestamp: '10:32 AM' }
      ]},
      { id: 'c2', name: 'coding-help', type: ChannelType.TEXT, messages: [] },
      { id: 'c3', name: 'memes', type: ChannelType.TEXT, messages: [] },
      { id: 'vc1', name: 'Golosovoy Chat', type: ChannelType.VOICE, messages: [] },
      { id: 'vc2', name: 'Music Lounge', type: ChannelType.VOICE, messages: [] },
    ]
  },
  {
    id: 's2',
    name: 'Gaming Lounge',
    icon: 'https://picsum.photos/id/237/200/200',
    channels: [
      { id: 'c4', name: 'lfg-dota2', type: ChannelType.TEXT, messages: [] },
      { id: 'c5', name: 'clips', type: ChannelType.TEXT, messages: [] },
      { id: 'vc3', name: 'Squad 1', type: ChannelType.VOICE, messages: [] },
    ]
  }
];

export const MOCK_DMS: DirectMessage[] = [
  {
    id: 'dm1',
    user: MOCK_USERS['u1'],
    messages: [
      { id: 'dm_m1', content: 'Hey, did you see the new update?', senderId: 'u1', timestamp: 'Yesterday' }
    ]
  },
  {
    id: 'dm2',
    user: MOCK_USERS['u2'],
    messages: []
  }
];