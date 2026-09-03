import api from './api';

export const progressService = {
  // POST /api/progress/lessons/:lessonId/start/
  startLesson: async (lessonId) => {
    const response = await api.post(`/progress/lessons/${lessonId}/start/`);
    return response.data;
  },

  // POST /api/progress/lessons/:lessonId/complete/
  completeLesson: async (lessonId) => {
    const response = await api.post(`/progress/lessons/${lessonId}/complete/`);
    return response.data;
  },

  // GET /api/progress/my/
  getMyProgress: async () => {
    const response = await api.get('/progress/my/');
    return response.data;
  },

  // GET /api/progress/courses/:courseId/
  getCourseProgress: async (courseId) => {
    const response = await api.get(`/progress/courses/${courseId}/`);
    return response.data;
  },
};

export default progressService;
