import StoryIdb from '../../utils/db';
import NotificationHelper from '../../utils/notification-helper';

export default class AddStoryPresenter {
    #view;
    #model;
  
    constructor(model, view) {
      this.#model = model;
      this.#view = view;
    }
  
    setSelectedPosition(position) {
      this.#view.updateLocationInfo(position);
      this.#view.updateSubmitButtonState();
    }
  
    async submitStory(name, description, photoBlob, position) {
      try {
        // Create form data for API submission
        const formData = new FormData();
        formData.append('description', `${name}\n\n${description}`);
        formData.append('photo', photoBlob, 'photo.jpg');
        
        if (position) {
          formData.append('lat', position.lat);
          formData.append('lon', position.lng);
        }
        
        // Try to submit to API if online
        if (navigator.onLine) {
          try {
            const response = await this.#model.addStory(formData);
            this.#view.showSuccessMessage('Cerita berhasil ditambahkan!');
            
            // Show push notification if permission granted
            if (Notification.permission === 'granted') {
              NotificationHelper.showNotification({
                title: 'Story Share',
                options: {
                  body: 'Cerita baru berhasil ditambahkan!',
                  icon: 'icons/web-app-manifest-192x192.png',
                }
              });
            }
            
            await this.#view.redirectAfterDelay(2000, '#/');
          } catch (error) {
            console.error('Error submitting to API, saving locally:', error);
            await this.saveStoryLocally(name, description, photoBlob, position);
          }
        } else {
          // If offline, save locally
          await this.saveStoryLocally(name, description, photoBlob, position);
        }
      } catch (error) {
        this.#view.showErrorMessage(error);
      }
    }
    
    async saveStoryLocally(name, description, photoBlob, position) {
      try {
        // Convert photo blob to base64 for local storage
        const base64Photo = await this.readBlobAsDataURL(photoBlob);
        
        // Create temp story object for IndexedDB
        const tempId = 'local_' + new Date().getTime();
        const story = {
          id: tempId,
          name,
          description,
          photoUrl: base64Photo,
          createdAt: new Date().toISOString(),
          lat: position ? position.lat : null,
          lon: position ? position.lng : null,
          isPendingUpload: true, // Flag to indicate it needs to be uploaded later
        };
        
        // Save to IndexedDB
        await StoryIdb.saveStory(story);
        
        this.#view.showSuccessMessage('Cerita disimpan secara lokal. Akan diunggah saat kembali online.');
        await this.#view.redirectAfterDelay(2000, '#/');
      } catch (error) {
        console.error('Error saving story locally:', error);
        this.#view.showErrorMessage(new Error('Gagal menyimpan cerita secara lokal: ' + error.message));
      }
    }
    
    // Utility to convert blob to base64
    readBlobAsDataURL(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
        reader.readAsDataURL(blob);
      });
    }
    
    // For subscribing to push notifications - safely without triggering refresh loops
    async subscribeToPushNotification() {
      try {
        // Get current permission status without triggering a permission prompt
        const permissionStatus = NotificationHelper.getPermissionStatus();
        
        // Handle various permission states
        if (permissionStatus === 'denied' || permissionStatus === 'denied-permanent') {
          this.#view.showNotificationStatus('Notifikasi tidak diizinkan oleh browser. Silakan ubah pengaturan browser Anda.', false);
          return null;
        }
        
        // If permission not granted yet, request it explicitly through a direct request
        if (permissionStatus !== 'granted') {
          // Call the helper with forceRequest true to bypass stored denials
          const granted = await NotificationHelper.requestPermission(true);
          
          if (!granted) {
            this.#view.showNotificationStatus('Anda tidak memberikan izin notifikasi.', false);
            return null;
          }
          
          // Permission was just granted, proceed with subscription directly
          // without recursively calling subscribeToPushNotification again
          const subscription = await NotificationHelper._subscribeToPushNotification();
          if (subscription) {
            this.#view.showNotificationStatus('Notifikasi berhasil diaktifkan!', true);
            return subscription;
          } else {
            this.#view.showNotificationStatus('Gagal mengaktifkan notifikasi.', false);
            return null;
          }
        }
        
        // Permission already granted, proceed with subscription
        const subscription = await NotificationHelper._subscribeToPushNotification();
        
        if (subscription) {
          this.#view.showNotificationStatus('Notifikasi berhasil diaktifkan!', true);
        } else {
          this.#view.showNotificationStatus('Gagal mengaktifkan notifikasi.', false);
        }
        
        return subscription;
      } catch (error) {
        console.error('Error in subscribeToPushNotification:', error);
        this.#view.showNotificationStatus('Error: ' + error.message, false);
        return null;
      }
    }
  }