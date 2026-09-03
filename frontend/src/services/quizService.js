import api from './api';

export const quizService = {
  // GET /api/quizzes/quizzes/
  getQuizzes: async (params = {}) => {
    const response = await api.get('/quizzes/', { params });
    return response.data;
  },

  // GET /api/quizzes/quizzes/:id/
  getQuiz: async (id) => {
    const response = await api.get(`/quizzes/${id}/`);
    return response.data;
  },

  // POST /api/quizzes/quizzes/ (instructor)
  createQuiz: async (quizData) => {
    const response = await api.post('/quizzes/', quizData);
    return response.data;
  },

  // PATCH /api/quizzes/quizzes/:id/ (instructor)
  updateQuiz: async (id, quizData) => {
    const response = await api.patch(`/quizzes/${id}/`, quizData);
    return response.data;
  },

  // DELETE /api/quizzes/quizzes/:id/ (instructor)
  deleteQuiz: async (id) => {
    const response = await api.delete(`/quizzes/${id}/`);
    return response.data;
  },

  // POST /api/quizzes/quizzes/:id/start/ (learner)
  startAttempt: async (quizId) => {
    const response = await api.post(`/quizzes/${quizId}/start/`);
    return response.data;
  },

  // POST /api/quizzes/quizzes/:id/submit/ (learner)
  // body: { answers: [{ question_id: 1, selected_option_id: 2 }] }
  submitAttempt: async (quizId, answers) => {
    const response = await api.post(`/quizzes/${quizId}/submit/`, { answers });
    return response.data;
  },

  // GET /api/quizzes/quizzes/:id/results/ (learner & instructor)
  getResults: async (quizId, userId = null) => {
    const params = userId ? { user_id: userId } : {};
    const response = await api.get(`/quizzes/${quizId}/results/`, { params });
    return response.data;
  },

  // GET /api/quizzes/instructor_attempts/ (instructor gradebook)
  getInstructorQuizAttempts: async (params = {}) => {
    const response = await api.get('/quizzes/instructor_attempts/', { params });
    return response.data;
  },
};

export default quizService;
