import api from '../api/axiosConfig';

const ChatService = {
  getRooms:       ()         => api.get('/api/rooms').then(r => r.data),
  getUsers:       ()         => api.get('/api/users').then(r => r.data),
  getMessages:    (roomId)   => api.get(`/api/messages/room/${roomId}`).then(r => r.data),
  sendMessage:    (payload)  => api.post('/api/messages', payload).then(r => r.data),
  startPrivate:   (userId)   => api.post(`/api/rooms/private/${userId}`).then(r => r.data),
  deleteMessage:  (msgId)    => api.delete(`/api/messages/${msgId}`).then(r => r.data),
};

export default ChatService;
