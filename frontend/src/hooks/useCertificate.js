import { useQuery } from '@tanstack/react-query';
import certificateService from '../services/certificateService';

export const useCourseCertificate = (courseId, options = {}) => {
  return useQuery({
    queryKey: ['certificate', 'course', courseId],
    queryFn: () => certificateService.getCourseCertificate(courseId),
    enabled: !!courseId && (options.enabled !== undefined ? options.enabled : true),
    staleTime: 1000 * 60 * 10,
    retry: false,
    ...options,
  });
};

export const useVerifyCertificate = (certificateCode) => {
  return useQuery({
    queryKey: ['certificate', 'verify', certificateCode],
    queryFn: () => certificateService.verifyCertificate(certificateCode),
    enabled: !!certificateCode,
    retry: false,
  });
};
