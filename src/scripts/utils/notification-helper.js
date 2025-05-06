import CONFIG from '../config';
import Api from '../data/api';

// Add a module-level flag to prevent multiple concurrent requests
let _isRequestingPermission = false;

const NotificationHelper = {
  async requestPermission(forceRequest = false) {
    if (!('Notification' in window)) {
      console.error('Browser tidak mendukung notifikasi');
      return false;
    }

    // Prevent concurrent requests
    if (_isRequestingPermission) {
      console.log('Already requesting notification permission, skipping duplicate request');
      return false;
    }

    // Check if we've already been denied and stored it locally
    const deniedStatus = localStorage.getItem('notificationPermissionDenied');
    if (deniedStatus === 'true' && !forceRequest) {
      console.log('Notification permission was previously denied, not asking again');
      return false;
    }

    try {
      _isRequestingPermission = true;
      
      const result = await Notification.requestPermission();
      
      if (result === 'denied') {
        console.error('Fitur notifikasi tidak diizinkan');
        // Store the denied status to prevent future requests
        localStorage.setItem('notificationPermissionDenied', 'true');
        _isRequestingPermission = false;
        return false;
      }

      if (result === 'default') {
        console.error('Pengguna menutup dialog permintaan izin');
        _isRequestingPermission = false;
        return false;
      }

      // Clear any record of denied permission
      localStorage.removeItem('notificationPermissionDenied');
      
      // If permission granted, automatically try to subscribe to push
      if (result === 'granted') {
        console.log('Notification permission granted, attempting push subscription');
        // Call directly to subscribeToPushNotification without recursion
        await this._subscribeToPushNotification();
      }

      _isRequestingPermission = false;
      return true;
    } catch (error) {
      console.error('Error saat meminta izin notifikasi:', error);
      _isRequestingPermission = false;
      return false;
    }
  },

  // Check if a notification request is currently in progress
  isRequestingPermission() {
    return _isRequestingPermission;
  },

  // Check current permission status without requesting
  getPermissionStatus() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    
    // Check if we've recorded a denied status in localStorage
    if (localStorage.getItem('notificationPermissionDenied') === 'true' && 
        Notification.permission !== 'granted') {
      return 'denied-permanent';
    }
    
    return Notification.permission;
  },

  async showNotification({ title, options }) {
    if (!this.checkAvailability()) return;

    if (Notification.permission !== 'granted') {
      console.error('Izin notifikasi belum diberikan');
      return;
    }

    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
      console.error('Browser tidak mendukung fitur showNotification');
      
      // Fallback to standard Notification API
      new Notification(title, options);
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      console.error('Service worker belum terdaftar');
      return;
    }

    try {
      await registration.showNotification(title, options);
    } catch (error) {
      console.error('Error saat menampilkan notifikasi:', error);
    }
  },

  // Check if notification is supported
  checkAvailability() {
    if (!('Notification' in window)) {
      console.error('Browser tidak mendukung notifikasi');
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      console.error('Browser tidak mendukung service worker');
      return false;
    }

    return true;
  },

  // For subscribing to push notifications (to be called from outside)
  async subscribeToPushNotification() {
    if (!this.checkAvailability()) return null;

    try {
      // Check if we've explicitly been denied before
      const permissionStatus = this.getPermissionStatus();
      if (permissionStatus === 'denied-permanent') {
        console.log('Notification permission was previously denied, not asking again');
        return null;
      }
      
      // First, request permission if not granted
      if (Notification.permission !== 'granted') {
        const permissionGranted = await this.requestPermission();
        if (!permissionGranted) {
          console.error('Izin notifikasi tidak diberikan');
          return null;
        }
        // Permission was just granted, the subscription was already attempted in requestPermission
        return null;
      }
      
      // Permission is already granted, proceed with subscription
      return await this._subscribeToPushNotification();
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  },

  // Internal method for push notification subscription to prevent recursion
  // Made public for direct access when needed
  async _subscribeToPushNotification() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.error('Service worker belum terdaftar');
        return null;
      }

      // Getting existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Already subscribed, but ensure it's registered on the server
        try {
          await Api.subscribeToPushNotification(subscription);
          console.log('User already subscribed, registration confirmed with server');
        } catch (error) {
          console.error('Error confirming existing subscription with server:', error);
        }
        return subscription;
      }

      // If the user is not subscribed, create a new subscription
      // Convert the VAPID key to Uint8Array
      const vapidPublicKey = CONFIG.VAPID_PUBLIC_KEY;
      const convertedVapidKey = this.urlB64ToUint8Array(vapidPublicKey);

      // Subscribe the user
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log('User successfully subscribed to push notifications');
      
      // Register subscription with the server
      try {
        const serverResponse = await Api.subscribeToPushNotification(subscription);
        console.log('Subscription registered with server:', serverResponse);
      } catch (error) {
        console.error('Error registering subscription with server:', error);
        // Consider unsubscribing if server registration failed
        await subscription.unsubscribe();
        return null;
      }
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  },

  // Utility function to convert base64 string to Uint8Array
  urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  },

  // Method to unsubscribe from push notifications
  async unsubscribeFromPushNotification() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // First, unregister from server
        try {
          await Api.unsubscribeFromPushNotification(subscription);
          console.log('Subscription unregistered from server');
        } catch (error) {
          console.error('Error unregistering subscription from server:', error);
          // Continue with client-side unsubscription even if server unregistration fails
        }
        
        // Then, unsubscribe on the client
        await subscription.unsubscribe();
        console.log('User unsubscribed from push notifications');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }
};

export default NotificationHelper; 