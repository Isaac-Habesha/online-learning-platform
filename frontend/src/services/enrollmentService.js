import api from './api';

export const enrollmentService = {
  // POST /api/enrollments/ - body: { course: courseId }
  enroll: async (courseId) => {
    const response = await api.post('/enrollments/', { course: courseId });
    return response.data;
  },

  // GET /api/enrollments/my/
  getMyEnrollments: async () => {
    const response = await api.get('/enrollments/my/');
    return response.data;
  },

  // GET /api/enrollments/lessons/:id/
  getLessonAccess: async (lessonId) => {
    const response = await api.get(`/enrollments/lessons/${lessonId}/`);
    return response.data;
  },
};

export default enrollmentService;
