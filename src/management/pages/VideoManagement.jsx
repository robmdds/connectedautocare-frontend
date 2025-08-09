import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Save, 
  Eye, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  FileVideo,
  ImageIcon,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';

export default function VideoManagement() {
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [formData, setFormData] = useState({
    video_url: '',
    thumbnail_url: '',
    title: '',
    description: '',
    duration: ''
  });

  // File upload refs
  const videoFileRef = useRef(null);
  const thumbnailFileRef = useRef(null);

  // Upload state
  const [uploadFiles, setUploadFiles] = useState({
    video: null,
    thumbnail: null
  });

  // Service health
  const [serviceHealth, setServiceHealth] = useState(null);

  useEffect(() => {
    loadVideoInfo();
    checkServiceHealth();
  }, []);

  const checkServiceHealth = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/video/health`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const rawData = await response.json();
        
        // Handle array response format [responseData, statusCode]
        let data;
        if (Array.isArray(rawData)) {
          data = rawData[0]; // Take the first element which contains the actual response
        } else {
          data = rawData;
        }
        
        setServiceHealth(data.data || data);
      }
    } catch (error) {
      console.error('Failed to check service health:', error);
    }
  };

  const loadVideoInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      const endpoint = `${API_BASE_URL}/api/admin/video`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || `HTTP ${response.status}: ${response.statusText}`);
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }
      }

      const rawData = await response.json();
      
      // Handle array response format [responseData, statusCode]
      let data;
      if (Array.isArray(rawData)) {
        data = rawData[0]; // Take the first element which contains the actual response
      } else {
        data = rawData;
      }
      
      const video = data.data || data;
      setVideoInfo(video);
      setFormData({
        video_url: video.video_url || '',
        thumbnail_url: video.thumbnail_url || '',
        title: video.title || '',
        description: video.description || '',
        duration: video.duration || ''
      });
      
    } catch (error) {
      console.error('Failed to load video info:', error);
      setError(error.message);
      
      // Set empty data when API fails
      setVideoInfo({
        video_url: '',
        thumbnail_url: '',
        title: 'ConnectedAutoCare Hero Protection',
        description: 'Comprehensive protection plans',
        duration: '0:00',
        updated_at: new Date().toISOString()
      });
      setFormData({
        video_url: '',
        thumbnail_url: '',
        title: 'ConnectedAutoCare Hero Protection',
        description: 'Comprehensive protection plans',
        duration: '0:00'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (type, file) => {
    if (!file) return;

    // Validate file type
    const videoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (type === 'video' && !videoTypes.includes(file.type)) {
      setError('Invalid video file type. Please select mp4, webm, mov, or avi files.');
      return;
    }
    
    if (type === 'thumbnail' && !imageTypes.includes(file.type)) {
      setError('Invalid image file type. Please select jpg, png, gif, or webp files.');
      return;
    }

    // Validate file size
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    const maxImageSize = 10 * 1024 * 1024;  // 10MB
    
    if (type === 'video' && file.size > maxVideoSize) {
      setError('Video file too large. Maximum size is 100MB.');
      return;
    }
    
    if (type === 'thumbnail' && file.size > maxImageSize) {
      setError('Image file too large. Maximum size is 10MB.');
      return;
    }

    setUploadFiles(prev => ({ ...prev, [type]: file }));
    setError(null);
  };

  const uploadNewVideo = async () => {
    try {
      setUploading(true);
      setError(null);
      setUploadProgress('Preparing upload...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!uploadFiles.video && !uploadFiles.thumbnail) {
        throw new Error('Please select at least one file to upload');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      const endpoint = `${API_BASE_URL}/api/admin/video/upload`;

      // Create FormData
      const formDataToUpload = new FormData();
      
      if (uploadFiles.video) {
        formDataToUpload.append('video', uploadFiles.video);
        setUploadProgress('Uploading video...');
      }
      
      if (uploadFiles.thumbnail) {
        formDataToUpload.append('thumbnail', uploadFiles.thumbnail);
        setUploadProgress('Uploading thumbnail...');
      }

      // Add metadata
      formDataToUpload.append('title', formData.title || 'ConnectedAutoCare Hero Video');
      formDataToUpload.append('description', formData.description || 'Hero protection video');
      formDataToUpload.append('duration', formData.duration || '0:00');

      setUploadProgress('Processing upload...');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formDataToUpload,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || `Upload failed: ${response.status}`;
        } catch (parseError) {
          errorMessage = `Upload failed: ${response.status} - ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      const rawData = await response.json();
      
      // Handle array response format [responseData, statusCode]
      let data;
      if (Array.isArray(rawData)) {
        data = rawData[0]; // Take the first element which contains the actual response
      } else {
        data = rawData;
      }
      
      // Handle different response structures
      let uploadedVideo;
      if (data.data && data.data.video_info) {
        // Expected structure: { success: true, data: { video_info: {...} } }
        uploadedVideo = data.data.video_info;
      } else if (data.video_info) {
        // Direct structure: { success: true, video_info: {...} }
        uploadedVideo = data.video_info;
      } else if (data.data) {
        // Fallback: { success: true, data: {...} }
        uploadedVideo = data.data;
      } else {
        // Last resort: use the whole data object
        uploadedVideo = data;
      }
      
      if (uploadedVideo) {
        setVideoInfo(uploadedVideo);
        setFormData({
          video_url: uploadedVideo.video_url || '',
          thumbnail_url: uploadedVideo.thumbnail_url || '',
          title: uploadedVideo.title || '',
          description: uploadedVideo.description || '',
          duration: uploadedVideo.duration || ''
        });
      }

      // Clear upload files
      setUploadFiles({ video: null, thumbnail: null });
      if (videoFileRef.current) videoFileRef.current.value = '';
      if (thumbnailFileRef.current) thumbnailFileRef.current.value = '';

      setUploadProgress('Upload completed successfully!');
      setTimeout(() => setUploadProgress(null), 3000);
      
    } catch (error) {
      console.error('Failed to upload video:', error);
      setError(error.message);
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  };

  const updateVideoMetadata = async () => {
    try {
      setUploading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      const endpoint = `${API_BASE_URL}/api/admin/video`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update video: ${errorText}`);
      }

      const data = await response.json();
      setVideoInfo({ ...videoInfo, ...formData, updated_at: new Date().toISOString() });
      
    } catch (error) {
      console.error('Failed to update video:', error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteVideo = async () => {
    if (!confirm('Are you sure you want to delete the current video? This action cannot be undone.')) {
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/video/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete video: ${errorText}`);
      }

      // Clear video info
      setVideoInfo({ video_url: '', thumbnail_url: '', title: '', description: '', duration: '' });
      setFormData({ video_url: '', thumbnail_url: '', title: '', description: '', duration: '' });
      
    } catch (error) {
      console.error('Failed to delete video:', error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Video Management</h1>
          <p className="text-gray-600 mt-1">Upload and manage landing page videos</p>
          {serviceHealth && (
            <div className="flex items-center mt-2 space-x-2">
              <Badge variant={serviceHealth.status === 'healthy' ? 'default' : 'destructive'}>
                {serviceHealth.storage_provider}
              </Badge>
              {serviceHealth.blob_configured && (
                <Badge variant="secondary">
                  Max: {serviceHealth.max_video_size_mb}MB video, {serviceHealth.max_image_size_mb}MB image
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          {videoInfo?.video_url && (
            <Button variant="destructive" onClick={deleteVideo} disabled={uploading}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Video
            </Button>
          )}
          <Button onClick={updateVideoMetadata} disabled={uploading}>
            <Save className="w-4 h-4 mr-2" />
            {uploading ? 'Saving...' : 'Save Metadata'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center text-red-800">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        </div>
      )}

      {uploadProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center text-blue-800">
            <CheckCircle className="w-4 h-4 mr-2" />
            {uploadProgress}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Current Landing Video</CardTitle>
            <CardDescription>Preview of the current landing page video</CardDescription>
          </CardHeader>
          <CardContent>
            {videoInfo?.video_url ? (
              <div className="space-y-4">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
                  <video
                    src={videoInfo.video_url}
                    poster={videoInfo.thumbnail_url}
                    controls
                    className="w-full h-full object-cover"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">{videoInfo.title}</h3>
                  <p className="text-sm text-gray-600">{videoInfo.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Duration: {videoInfo.duration}</span>
                    <span>Updated: {new Date(videoInfo.updated_at).toLocaleDateString()}</span>
                  </div>
                  {videoInfo.video_url.includes('blob.vercel-storage.com') && (
                    <Badge variant="secondary" className="text-xs">
                      Served by Vercel Blob CDN
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Play className="mx-auto h-12 w-12 mb-2" />
                  <p>No video uploaded</p>
                  <p className="text-xs">Upload a video below to get started</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload New Video</CardTitle>
            <CardDescription>Upload video and thumbnail to Vercel Blob CDN</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video File Upload */}
            <div>
              <Label htmlFor="video_file">Video File</Label>
              <div className="mt-1">
                <input
                  ref={videoFileRef}
                  id="video_file"
                  type="file"
                  accept="video/mp4,video/webm,video/mov,video/avi"
                  onChange={(e) => handleFileSelect('video', e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                />
                <p className="text-xs text-gray-500 mt-1">
                  MP4, WebM, MOV, AVI (max 100MB)
                </p>
                {uploadFiles.video && (
                  <div className="flex items-center mt-2 text-sm text-green-600">
                    <FileVideo className="w-4 h-4 mr-1" />
                    {uploadFiles.video.name} ({(uploadFiles.video.size / 1024 / 1024).toFixed(1)}MB)
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setUploadFiles(prev => ({ ...prev, video: null }));
                        if (videoFileRef.current) videoFileRef.current.value = '';
                      }}
                      className="ml-2 h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail File Upload */}
            <div>
              <Label htmlFor="thumbnail_file">Thumbnail Image</Label>
              <div className="mt-1">
                <input
                  ref={thumbnailFileRef}
                  id="thumbnail_file"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={(e) => handleFileSelect('thumbnail', e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                />
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF, WebP (max 10MB)
                </p>
                {uploadFiles.thumbnail && (
                  <div className="flex items-center mt-2 text-sm text-green-600">
                    <ImageIcon className="w-4 h-4 mr-1" />
                    {uploadFiles.thumbnail.name} ({(uploadFiles.thumbnail.size / 1024).toFixed(1)}KB)
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setUploadFiles(prev => ({ ...prev, thumbnail: null }));
                        if (thumbnailFileRef.current) thumbnailFileRef.current.value = '';
                      }}
                      className="ml-2 h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div>
              <Label htmlFor="title">Video Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="ConnectedAutoCare Hero Video"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the video"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="2:30"
              />
            </div>

            <div className="pt-4 space-y-2">
              <Button 
                onClick={uploadNewVideo} 
                disabled={uploading || (!uploadFiles.video && !uploadFiles.thumbnail)} 
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload to Vercel Blob'}
              </Button>
              
              {!serviceHealth?.blob_configured && (
                <p className="text-xs text-amber-600 text-center">
                  ⚠️ Vercel Blob not configured. Please set VERCEL_BLOB_READ_WRITE_TOKEN environment variable.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}