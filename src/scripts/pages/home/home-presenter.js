import StoryIdb from '../../utils/db';
import NotificationHelper from '../../utils/notification-helper';

export default class HomePresenter {
    #view;
    #model;
  
    constructor(model, view) {
      this.#model = model;
      this.#view = view;
    }
  
    async checkAuthStatus() {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
      
      this.#view.renderAuthStatus(token, user);
    }
    
    async loadStories() {
      try {
        // Try to get stories from IndexedDB first
        const storiesFromIdb = await StoryIdb.getStories();
        
        // If there are stories in IndexedDB, render them first for faster loading
        if (storiesFromIdb.length > 0) {
          this.#view.renderStories(storiesFromIdb);
        }
        
        // Try to fetch stories from the API
        try {
          const storiesFromApi = await this.#model.getStories();
          
          // If stories from API successfully loaded, update IndexedDB
          if (storiesFromApi.length > 0) {
            await StoryIdb.saveStories(storiesFromApi);
            
            // Only update UI if the data is different
            if (JSON.stringify(storiesFromIdb) !== JSON.stringify(storiesFromApi)) {
              this.#view.renderStories(storiesFromApi);
              
              // Show notification about new stories if there are more stories now
              if (storiesFromApi.length > storiesFromIdb.length && Notification.permission === 'granted') {
                NotificationHelper.showNotification({
                  title: 'Story Share',
                  options: {
                    body: 'Ada cerita baru yang tersedia!',
                    icon: 'icons/web-app-manifest-192x192.png',
                  }
                });
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch stories from API, using cached data:', error);
          // If API call fails but we have stories in IndexedDB, we're still good
          // We've already rendered the stories from IndexedDB
          if (storiesFromIdb.length === 0) {
            throw error; // If no cached data and API fails, show error
          }
        }
      } catch (error) {
        this.#view.showError(error);
      }
    }
    
    handleLogout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    
    async toggleFavorite(id) {
      await StoryIdb.toggleFavorite(id);
      // Refresh the stories to show the updated favorite status
      const stories = await StoryIdb.getStories();
      this.#view.renderStories(stories);
    }
}