/**
 * VideoManagement component for instructors to manage lesson videos.
 * Allows switching between external and hosted video types.
 */

import React, { useState } from 'react';
import VideoUpload from './VideoUpload';
import { deleteVideo } from '../../services/videoService';

const VideoManagement = ({ lesson, onUpdate }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteVideo = async () => {
    if (!lesson.hosted_video || !confirm('Are you sure you want to delete this video?')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteVideo(lesson.hosted_video.id);

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete video');
      console.error('Video deletion error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadSuccess = (videoData) => {
    setShowUpload(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleVideoTypeChange = async (newType) => {
    // This would typically call an API to update the lesson's video_type
    // For now, we'll just show the upload interface for HOSTED type
    if (newType === 'HOSTED') {
      setShowUpload(true);
    }
  };

  const renderVideoStatus = () => {
    if (!lesson.hosted_video) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm">No hosted video uploaded</p>
        </div>
      );
    }

    const video = lesson.hosted_video;
    const statusColors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'UPLOADING': 'bg-blue-100 text-blue-800',
      'UPLOADED': 'bg-blue-100 text-blue-800',
      'PROCESSING': 'bg-purple-100 text-purple-800',
      'READY': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800',
    };

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-medium text-gray-900">{video.original_filename}</p>
            <p className="text-sm text-gray-600">
              {(video.file_size / (1024 * 1024)).toFixed(2)} MB • {video.mime_type}
            </p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[video.status]}`}>
            {video.status}
          </span>
        </div>

        {video.duration_seconds && (
          <p className="text-sm text-gray-600">
            Duration: {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
          </p>
        )}

        {video.error_message && (
          <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {video.error_message}
          </div>
        )}

        <div className="mt-3 flex space-x-2">
          {video.status === 'READY' && (
            <button
              onClick={() => setShowUpload(true)}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Replace Video
            </button>
          )}
          <button
            onClick={handleDeleteVideo}
            disabled={deleting}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting...' : 'Delete Video'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Video Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Type
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="video_type"
              value="NONE"
              checked={lesson.video_type === 'NONE'}
              onChange={() => handleVideoTypeChange('NONE')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">No Video</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="video_type"
              value="EXTERNAL"
              checked={lesson.video_type === 'EXTERNAL'}
              onChange={() => handleVideoTypeChange('EXTERNAL')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">External URL</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="video_type"
              value="HOSTED"
              checked={lesson.video_type === 'HOSTED'}
              onChange={() => handleVideoTypeChange('HOSTED')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Hosted Video</span>
          </label>
        </div>
      </div>

      {/* External URL Input */}
      {lesson.video_type === 'EXTERNAL' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            External Video URL
          </label>
          <input
            type="url"
            defaultValue={lesson.video_url || ''}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            YouTube, Vimeo, or other video platform URLs
          </p>
        </div>
      )}

      {/* Hosted Video Management */}
      {lesson.video_type === 'HOSTED' && (
        <div>
          {showUpload ? (
            <VideoUpload
              lessonId={lesson.id}
              existingVideo={lesson.hosted_video}
              onUploadSuccess={handleUploadSuccess}
              onCancel={() => setShowUpload(false)}
            />
          ) : (
            <div className="space-y-3">
              {renderVideoStatus()}
              {!lesson.hosted_video && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Upload Video
                </button>
              )}
            </div>
          )}
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

export default VideoManagement;
