/**
 * Video service for API calls related to video upload and management.
 * Uses the existing API service layer for all HTTP requests.
 */

import api from './api';

/**
 * Upload a video for a lesson
 * @param {number} lessonId - The lesson ID
 * @param {File} videoFile - The video file to upload
 * @returns {Promise} - API response with video details
 */
export const uploadVideo = async (lessonId, videoFile) => {
  const formData = new FormData();
  formData.append('video', videoFile);

  console.log('Uploading video for lesson:', lessonId);
  console.log('File:', videoFile.name, videoFile.size, videoFile.type);

  try {
    const response = await api.post(`/courses/lessons/${lessonId}/video/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Upload response:', response);
    return response;
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};

/**
 * Replace an existing video for a lesson
 * @param {number} lessonId - The lesson ID
 * @param {File} videoFile - The new video file
 * @returns {Promise} - API response with updated video details
 */
export const replaceVideo = async (lessonId, videoFile) => {
  const formData = new FormData();
  formData.append('video', videoFile);

  return api.post(`/courses/lessons/${lessonId}/video/replace/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Get video details
 * @param {number} videoId - The video ID
 * @returns {Promise} - API response with video details
 */
export const getVideo = async (videoId) => {
  return api.get(`/courses/videos/${videoId}/`);
};

/**
 * Delete a video
 * @param {number} videoId - The video ID
 * @returns {Promise} - API response
 */
export const deleteVideo = async (videoId) => {
  return api.delete(`/courses/videos/${videoId}/`);
};

/**
 * Get video playback information for a lesson
 * @param {number} lessonId - The lesson ID
 * @returns {Promise} - API response with playback information
 */
export const getVideoPlayback = async (lessonId) => {
  return api.get(`/courses/lessons/${lessonId}/video/playback/`);
};

/**
 * Validate video file before upload
 * @param {File} file - The file to validate
 * @returns {Object} - Validation result with isValid and error message
 */
export const validateVideoFile = (file) => {
  const MAX_SIZE_MB = 2048; // 2GB default
  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
  const ALLOWED_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

  // Check file size
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${MAX_SIZE_MB}MB`,
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `MIME type ${file.type} not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format video duration for display
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration (MM:SS or HH:MM:SS)
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export default {
  uploadVideo,
  replaceVideo,
  getVideo,
  deleteVideo,
  getVideoPlayback,
  validateVideoFile,
  formatFileSize,
  formatDuration,
};
