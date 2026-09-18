/**
 * VideoPlayer component for displaying videos in lessons.
 * Supports both external and hosted videos with appropriate players.
 */

import React, { useState, useEffect, useRef } from 'react';
import { getVideoPlayback } from '../../services/videoService';

const VideoPlayer = ({ lesson, videoType, videoUrl, hostedVideo }) => {
  const [playbackInfo, setPlaybackInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  // Use props or fallback to lesson object
  const currentVideoType = videoType || lesson?.video_type;
  const currentVideoUrl = videoUrl || lesson?.video_url;
  const currentHostedVideo = hostedVideo || lesson?.hosted_video;

  useEffect(() => {
    // Load hosted video playback information if applicable
    if (currentVideoType === 'HOSTED' && lesson?.id) {
      loadPlaybackInfo();
    }
  }, [currentVideoType, lesson?.id]);

  const loadPlaybackInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getVideoPlayback(lesson.id);
      setPlaybackInfo(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load video');
      console.error('Video playback error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render external video player (YouTube, Vimeo, etc.)
  const renderExternalVideo = () => {
    if (!currentVideoUrl) return null;

    // Check if it's a YouTube URL
    const youtubeMatch = currentVideoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (youtubeMatch) {
      return (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=0&rel=0`}
            title={lesson?.title || 'Video'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    }

    // Check if it's a Vimeo URL
    const vimeoMatch = currentVideoUrl.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) {
      return (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
            title={lesson?.title || 'Video'}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    }

    // Default HTML5 video player for other external URLs
    return (
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
        <video
          ref={videoRef}
          controls
          className="w-full h-full"
          title={lesson?.title || 'Video'}
        >
          <source src={currentVideoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };

  // Render hosted video player
  const renderHostedVideo = () => {
    if (loading) {
      return (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Loading video...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-rose-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-slate-200 font-medium text-sm">Video unavailable</p>
            <p className="text-slate-400 text-xs mt-1">{error}</p>
          </div>
        </div>
      );
    }

    if (!playbackInfo) {
      return (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-400 text-sm">No video available for this lesson</p>
          </div>
        </div>
      );
    }

    // Check video status
    if (playbackInfo.status !== 'READY') {
      const statusMessages = {
        'PENDING': 'Video is pending upload',
        'UPLOADING': 'Video is being uploaded',
        'UPLOADED': 'Video is being processed',
        'PROCESSING': 'Video is being processed',
        'FAILED': 'Video processing failed',
      };

      return (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-amber-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-200 font-medium text-sm">Video not ready</p>
            <p className="text-slate-400 text-xs mt-1">
              {statusMessages[playbackInfo.status] || 'Video is being prepared'}
            </p>
          </div>
        </div>
      );
    }

    // Render video player with hosted video
    return (
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
        <video
          ref={videoRef}
          controls
          className="w-full h-full"
          title={lesson?.title || 'Video'}
          poster={playbackInfo.thumbnail_url || undefined}
        >
          <source src={playbackInfo.playback_url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };

  // Render based on video type
  if (currentVideoType === 'EXTERNAL') {
    return renderExternalVideo();
  }

  if (currentVideoType === 'HOSTED') {
    return renderHostedVideo();
  }

  // No video
  return (
    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-400 text-sm">No video for this lesson</p>
      </div>
    </div>
  );
};

export default VideoPlayer;
