import axios from 'axios';

const API_URL = '/api/uploads';

const UploadService = {
  uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API_URL}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API_URL}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default UploadService;
