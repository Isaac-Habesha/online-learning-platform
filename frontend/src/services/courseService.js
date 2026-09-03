import api from './api';

export const courseService = {
  // GET /api/courses/ with query parameters
  getCourses: async (params = {}) => {
    const response = await api.get('/courses/', { params });
    return response.data;
  },

  // GET /api/courses/:id/
  getCourse: async (id) => {
    const response = await api.get(`/courses/${id}/`);
    return response.data;
  },

  // GET /api/courses/:id/curriculum/
  getCourseCurriculum: async (id) => {
    const response = await api.get(`/courses/${id}/curriculum/`);
    return response.data;
  },

  // GET /api/courses/:id/students/ (instructor only)
  getCourseStudents: async (id) => {
    const response = await api.get(`/courses/${id}/students/`);
    return response.data;
  },

  // POST /api/courses/ (instructor only) - supports FormData for thumbnail
  createCourse: async (courseData) => {
    const response = await api.post('/courses/', courseData);
    return response.data;
  },

  // PATCH /api/courses/:id/ (instructor only) - supports FormData or JSON
  updateCourse: async (id, courseData) => {
    const response = await api.patch(`/courses/${id}/`, courseData);
    return response.data;
  },

  // DELETE /api/courses/:id/
  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}/`);
    return response.data;
  },

  // POST /api/courses/:id/publish/
  publishCourse: async (id) => {
    const response = await api.post(`/courses/${id}/publish/`);
    return response.data;
  },

  // POST /api/courses/:id/archive/
  archiveCourse: async (id) => {
    const response = await api.post(`/courses/${id}/archive/`);
    return response.data;
  },

  // --- SECTIONS ---
  // GET /api/courses/:courseId/sections/
  getSections: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/sections/`);
    return response.data;
  },

  // POST /api/courses/:courseId/sections/
  createSection: async (courseId, sectionData) => {
    const response = await api.post(`/courses/${courseId}/sections/`, sectionData);
    return response.data;
  },

  // GET /api/courses/sections/:id/
  getSection: async (id) => {
    const response = await api.get(`/courses/sections/${id}/`);
    return response.data;
  },

  // PATCH /api/courses/sections/:id/
  updateSection: async (id, sectionData) => {
    const response = await api.patch(`/courses/sections/${id}/`, sectionData);
    return response.data;
  },

  // DELETE /api/courses/sections/:id/
  deleteSection: async (id) => {
    const response = await api.delete(`/courses/sections/${id}/`);
    return response.data;
  },

  // --- LESSONS ---
  // GET /api/courses/sections/:sectionId/lessons/
  getLessons: async (sectionId) => {
    const response = await api.get(`/courses/sections/${sectionId}/lessons/`);
    return response.data;
  },

  // POST /api/courses/sections/:sectionId/lessons/ (supports FormData for documents)
  createLesson: async (sectionId, lessonData) => {
    const response = await api.post(`/courses/sections/${sectionId}/lessons/`, lessonData);
    return response.data;
  },

  // GET /api/courses/lessons/:id/
  getLesson: async (id) => {
    const response = await api.get(`/courses/lessons/${id}/`);
    return response.data;
  },

  // PATCH /api/courses/lessons/:id/ (supports FormData for documents)
  updateLesson: async (id, lessonData) => {
    const response = await api.patch(`/courses/lessons/${id}/`, lessonData);
    return response.data;
  },

  // DELETE /api/courses/lessons/:id/
  deleteLesson: async (id) => {
    const response = await api.delete(`/courses/lessons/${id}/`);
    return response.data;
  },
};

export default courseService;
