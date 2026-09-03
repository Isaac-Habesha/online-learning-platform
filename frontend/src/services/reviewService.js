import api from './api';

export const reviewService = {
  // GET /api/reviews/reviews/?course=:courseId
  getReviewsForCourse: async (courseId) => {
    const response = await api.get('/reviews/reviews/', { params: { course: courseId } });
    return response.data;
  },

  // POST /api/reviews/reviews/ - body: { course: courseId, rating: 1-5, comment: string }
  createReview: async ({ course, rating, comment }) => {
    const response = await api.post('/reviews/reviews/', { course, rating, comment });
    return response.data;
  },

  // GET /api/reviews/reviews/course-stats/:courseId/
  getCourseReviewStats: async (courseId) => {
    const response = await api.get(`/reviews/reviews/course-stats/${courseId}/`);
    return response.data;
  },

  // DELETE /api/reviews/reviews/:id/
  deleteReview: async (id) => {
    const response = await api.delete(`/reviews/reviews/${id}/`);
    return response.data;
  },
};

export default reviewService;
