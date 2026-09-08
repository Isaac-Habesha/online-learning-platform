import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import paymentService from '../services/paymentService';

export const useInitializePayment = () => {
  return useMutation({
    mutationFn: (courseId) => paymentService.initializePayment(courseId),
    onSuccess: (data) => {
      if (data?.checkout_url) {
        // Redirect directly to Chapa hosted payment checkout
        window.location.href = data.checkout_url;
      }
    },
  });
};

export const useVerifyPayment = (txRef) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['payment', 'verify', txRef],
    queryFn: () => paymentService.verifyPayment(txRef),
    enabled: !!txRef,
    // Poll every 3 seconds while pending, stop once COMPLETED or FAILED
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED') {
        return false;
      }
      return 3000;
    },
    onSuccess: (data) => {
      if (data?.status === 'COMPLETED') {
        // Invalidate enrollments so dashboard reflects active course immediately
        queryClient.invalidateQueries({ queryKey: ['enrollments'] });
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      }
    },
  });
};
