import api from './api';

export const certificateService = {
  getCourseCertificate: async (courseId) => {
    const response = await api.get(`/certificates/course/${courseId}/`);
    return response.data;
  },

  verifyCertificate: async (certificateCode) => {
    const response = await api.get(`/certificates/verify/${certificateCode}/`);
    return response.data;
  },

  getDownloadUrl: (certificateCode) => {
    const baseURL = api.defaults.baseURL || 'http://127.0.0.1:8000/api';
    return `${baseURL}/certificates/download/${certificateCode}/`;
  },
};

export default certificateService;
