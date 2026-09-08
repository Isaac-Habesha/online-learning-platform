import api from './api';

export const paymentService = {
  initializePayment: async (courseId) => {
    const response = await api.post('/payments/initialize/', {
      course_id: courseId,
    });
    return response.data;
  },

  verifyPayment: async (txRef) => {
    const response = await api.get(`/payments/verify/${txRef}/`);
    return response.data;
  },
};

export default paymentService;
