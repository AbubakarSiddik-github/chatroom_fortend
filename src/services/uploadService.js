import api from '../api/axiosConfig';

const API_URL = '/api/uploads';

const UploadService = {
  uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    // api instance has VITE_API_URL as baseURL and auto-attaches JWT Bearer token
    return api.post(`${API_URL}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`${API_URL}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAvatar() {
    return api.delete('/api/users/me/avatar');
  },

  getMe() {
    return api.get('/api/users/me');
  },

  updateProfile(data) {
    return api.put('/api/users/me/profile', data);
  },
};

export default UploadService;
