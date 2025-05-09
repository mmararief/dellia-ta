import CONFIG from '../config';

const ENDPOINTS = {
  LOGIN: `${CONFIG.BASE_URL}/login`,
  REGISTER: `${CONFIG.BASE_URL}/register`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
  GUEST_ADD_STORY: `${CONFIG.BASE_URL}/stories/guest`,
  NOTIFICATION_SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

class Api {
  constructor() {
    this.baseUrl = CONFIG.BASE_URL;
  }

  static async login(email, password) {
    try {
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const responseJson = await response.json();
      
      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      localStorage.setItem('token', responseJson.loginResult.token);
      localStorage.setItem('user', JSON.stringify(responseJson.loginResult));
      
      return responseJson.loginResult;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async register(name, email, password) {
    try {
      const response = await fetch(ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const responseJson = await response.json();
      
      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      return responseJson;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  static async getStories() {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('Token tidak ditemukan, mengembalikan array kosong');
        return [];
      }
      
      const response = await fetch(ENDPOINTS.STORIES, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const responseJson = await response.json();
      
      if (responseJson.error) {
        console.error('API Error:', responseJson.message);
        return [];
      }
      
      return responseJson.listStory || [];
    } catch (error) {
      console.error('Error fetching stories:', error);
      return [];
    }
  }

  static async getStoryDetail(id) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token tidak ditemukan, silakan login terlebih dahulu');
      }

      console.log('Calling endpoint:', ENDPOINTS.STORY_DETAIL(id));
      
      const response = await fetch(ENDPOINTS.STORY_DETAIL(id), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      
      const responseJson = await response.json();
      console.log('Response data:', responseJson);
      
      if (responseJson.error) {
        throw new Error(responseJson.message || 'Cerita tidak ditemukan');
      }
      
      return responseJson.story;
    } catch (error) {
      console.error('Error fetching story detail:', error);
      throw error;
    }
  }

  static async addStory(formData) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token tidak ditemukan, silakan login terlebih dahulu');
      }
      
      const response = await fetch(ENDPOINTS.ADD_STORY, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      const responseJson = await response.json();
      
      if (responseJson.error) {
        throw new Error(responseJson.message);
      }
      
      return responseJson;
    } catch (error) {
      console.error('Error adding story:', error);
      throw error;
    }
  }
  
  static async addStoryAsGuest(formData) {
    try {
      const response = await fetch(ENDPOINTS.GUEST_ADD_STORY, {
        method: 'POST',
        body: formData,
      });
      
      const responseJson = await response.json();
      
      if (responseJson.error) {
        throw new Error(responseJson.message);
      }
      
      return responseJson;
    } catch (error) {
      console.error('Error adding story as guest:', error);
      throw error;
    }
  }

  static async getStoriesWithLocation() {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('Token tidak ditemukan, mengembalikan array kosong');
        return [];
      }
      
      const response = await fetch(`${CONFIG.BASE_URL}/stories?location=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const responseJson = await response.json();
      
      if (responseJson.error) {
        console.error('API Error:', responseJson.message);
        return [];
      }
      
      return responseJson.listStory || [];
    } catch (error) {
      console.error('Error fetching stories with location:', error);
      return [];
    }
  }
  
  static async subscribeToPushNotification(subscription) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('Token tidak ditemukan, tidak dapat melakukan subscribe');
        throw new Error('Token tidak ditemukan, silakan login terlebih dahulu');
      }
      
      // Check if we've recently tried and failed to subscribe (to prevent repeated retries)
      const lastFailedSubscribe = localStorage.getItem('lastFailedSubscribe');
      if (lastFailedSubscribe) {
        const lastAttempt = parseInt(lastFailedSubscribe, 10);
        const now = Date.now();
        // If less than 5 minutes has passed since last failure, skip the attempt
        if (now - lastAttempt < 5 * 60 * 1000) {
          console.log('Skipping push notification subscription due to recent failure');
          return { message: 'Subscription skipped due to recent failure' };
        }
      }
      
      // Ensure subscription is converted to JSON if it's a PushSubscription object
      let subscriptionData = subscription;
      if (subscription instanceof PushSubscription) {
        subscriptionData = subscription.toJSON();
      }
      
      const response = await fetch(ENDPOINTS.NOTIFICATION_SUBSCRIBE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscriptionData.endpoint,
          keys: {
            p256dh: subscriptionData.keys?.p256dh,
            auth: subscriptionData.keys?.auth
          }
        }),
      });
      
      const responseJson = await response.json();
      
      if (responseJson.error) {
        // Record this failed attempt timestamp
        localStorage.setItem('lastFailedSubscribe', Date.now().toString());
        throw new Error(responseJson.message);
      }
      
      // Clear any record of failed attempts
      localStorage.removeItem('lastFailedSubscribe');
      return responseJson;
    } catch (error) {
      console.error('Error subscribing to push notification:', error);
      // Record this failed attempt timestamp
      localStorage.setItem('lastFailedSubscribe', Date.now().toString());
      throw error;
    }
  }
  
  static async unsubscribeFromPushNotification(subscription) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('Token tidak ditemukan, tidak dapat melakukan unsubscribe');
        throw new Error('Token tidak ditemukan, silakan login terlebih dahulu');
      }
      
      // Ensure subscription is converted to JSON if it's a PushSubscription object
      let subscriptionData = subscription;
      if (subscription instanceof PushSubscription) {
        subscriptionData = subscription.toJSON();
      }
      
      const response = await fetch(ENDPOINTS.NOTIFICATION_SUBSCRIBE, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscriptionData.endpoint
        }),
      });
      
      const responseJson = await response.json();
      
      if (responseJson.error) {
        throw new Error(responseJson.message);
      }
      
      return responseJson;
    } catch (error) {
      console.error('Error unsubscribing from push notification:', error);
      throw error;
    }
  }
}

export default Api;