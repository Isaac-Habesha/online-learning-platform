/**
 * VideoUpload component for instructors to upload videos to lessons.
 * Supports file selection, validation, upload progress, and status display.
 */

import React, { useState, useCallback } from 'react';
import { uploadVideo, replaceVideo, validateVideoFile, formatFileSize } from '../../services/videoService';

const VideoUpload = ({ lessonId, existingVideo, onUploadSuccess, onCancel }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Additional check: ensure it's a video file
    if (!file.type.startsWith('video/')) {
      setValidationError('Only video files are allowed. Please select a valid video file (MP4, WebM, MOV, AVI, MKV).');
      setSelectedFile(null);
      event.target.value = ''; // Clear the input
      return;
    }

    // Validate file
    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      setValidationError(validation.error);
      setSelectedFile(null);
      event.target.value = ''; // Clear the input
      return;
    }

    setValidationError(null);
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const uploadFunction = existingVideo ? replaceVideo : uploadVideo;
      const response = await uploadFunction(lessonId, selectedFile);

      setUploadProgress(100);
      setUploading(false);

      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      setUploading(false);
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      console.error('Video upload error:', err);
    }
  }, [selectedFile, lessonId, existingVideo, onUploadSuccess]);

  const handleCancel = () => {
    setSelectedFile(null);
    setValidationError(null);
    setError(null);
    if (onCancel) onCancel();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">
        {existingVideo ? 'Replace Video' : 'Upload Video'}
      </h3>

      {/* File Selection */}
      {!selectedFile && !uploading && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              id="video-upload"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="video-upload"
              className="cursor-pointer block"
            >
              <div className="text-gray-500 mb-2">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                Click to select a video file or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                MP4, WebM, MOV, AVI, MKV (max 2GB)
              </p>
            </label>
          </div>

          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {validationError}
            </div>
          )}

          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && !uploading && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-blue-900">{selectedFile.name}</p>
                <p className="text-sm text-blue-700">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type}
                </p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploading}
            >
              {existingVideo ? 'Replace Video' : 'Upload Video'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                {existingVideo ? 'Replacing video...' : 'Uploading video...'}
              </span>
              <span className="text-sm text-blue-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
