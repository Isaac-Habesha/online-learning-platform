import api from './api';

export const assignmentService = {
  // GET /api/assignments/assignments/
  getAssignments: async (params = {}) => {
    const response = await api.get('/assignments/assignments/', { params });
    return response.data;
  },

  // GET /api/assignments/assignments/:id/
  getAssignment: async (id) => {
    const response = await api.get(`/assignments/assignments/${id}/`);
    return response.data;
  },

  // POST /api/assignments/assignments/ (instructor)
  createAssignment: async (assignmentData) => {
    const response = await api.post('/assignments/assignments/', assignmentData);
    return response.data;
  },

  // PATCH /api/assignments/assignments/:id/ (instructor)
  updateAssignment: async (id, assignmentData) => {
    const response = await api.patch(`/assignments/assignments/${id}/`, assignmentData);
    return response.data;
  },

  // DELETE /api/assignments/assignments/:id/ (instructor)
  deleteAssignment: async (id) => {
    const response = await api.delete(`/assignments/assignments/${id}/`);
    return response.data;
  },

  // POST /api/assignments/assignments/:id/submit/ (learner) - supports FormData
  submitAssignment: async (assignmentId, formData) => {
    const response = await api.post(`/assignments/assignments/${assignmentId}/submit/`, formData);
    return response.data;
  },

  // GET /api/assignments/assignments/:id/my_submissions/ (learner)
  getMySubmissionsForAssignment: async (assignmentId) => {
    const response = await api.get(`/assignments/assignments/${assignmentId}/my_submissions/`);
    return response.data;
  },

  // GET /api/assignments/submissions/ (instructor / learner queue)
  getAllSubmissions: async (params = {}) => {
    const response = await api.get('/assignments/submissions/', { params });
    return response.data;
  },

  // GET /api/assignments/submissions/:id/
  getSubmission: async (id) => {
    const response = await api.get(`/assignments/submissions/${id}/`);
    return response.data;
  },

  // POST /api/assignments/submissions/:id/grade/ (instructor) - body: { grade, feedback }
  gradeSubmission: async (submissionId, { grade, feedback }) => {
    const response = await api.post(`/assignments/submissions/${submissionId}/grade/`, {
      grade,
      feedback,
    });
    return response.data;
  },
};

export default assignmentService;
