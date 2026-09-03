import api from './api';

export const categoryService = {
  // GET /api/categories/
  getCategories: async () => {
    const response = await api.get('/categories/');
    return response.data;
  },

  // GET /api/categories/:id/
  getCategory: async (id) => {
    const response = await api.get(`/categories/${id}/`);
    return response.data;
  },
};

export default categoryService;
