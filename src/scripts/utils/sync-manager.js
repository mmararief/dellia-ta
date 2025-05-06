import StoryIdb from './db';
import Api from '../data/api';
import NotificationHelper from './notification-helper';

class SyncManager {
  constructor() {
    this.initialized = false;
  }
  
  // Initialize the sync manager
  init() {
    if (this.initialized) return;
    
    window.addEventListener('online', () => {
      console.log('Back online - starting sync process');
      this.syncPendingUploads();
    });
    
    this.initialized = true;
  }
  
  // Synchronize pending uploads when back online
  async syncPendingUploads() {
    try {
      const stories = await StoryIdb.getStories();
      const pendingStories = stories.filter(story => story.isPendingUpload);
      
      if (pendingStories.length === 0) {
        console.log('No pending uploads to sync');
        return;
      }
      
      console.log(`Found ${pendingStories.length} pending uploads to sync`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Cannot sync - user not logged in');
        return;
      }
      
      let syncedCount = 0;
      
      for (const story of pendingStories) {
        try {
          // Convert base64 image back to blob for upload
          const imageBlob = await this.dataURLtoBlob(story.photoUrl);
          
          // Create form data for upload
          const formData = new FormData();
          formData.append('description', `${story.name}\n\n${story.description}`);
          formData.append('photo', imageBlob, 'photo.jpg');
          
          if (story.lat && story.lon) {
            formData.append('lat', story.lat);
            formData.append('lon', story.lon);
          }
          
          // Try to upload to server
          await Api.addStory(formData);
          
          // Delete the pending story from IndexedDB
          await StoryIdb.deleteStory(story.id);
          
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync story ${story.id}:`, error);
        }
      }
      
      if (syncedCount > 0) {
        // Reload stories to update the UI
        const updatedStories = await Api.getStories();
        await StoryIdb.saveStories(updatedStories);
        
        // Show notification about successful sync
        if (Notification.permission === 'granted') {
          NotificationHelper.showNotification({
            title: 'Story Share',
            options: {
              body: `${syncedCount} cerita berhasil diupload ke server!`,
              icon: 'icons/web-app-manifest-192x192.png',
            }
          });
        }
      }
    } catch (error) {
      console.error('Error during sync process:', error);
    }
  }
  
  // Helper method to convert base64 data URL to Blob
  dataURLtoBlob(dataUrl) {
    return new Promise((resolve) => {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      resolve(new Blob([u8arr], { type: mime }));
    });
  }
}

const syncManager = new SyncManager();
export default syncManager; 