import { openDB } from 'idb';
import CONFIG from '../config';

const { DATABASE_NAME, DATABASE_VERSION, OBJECT_STORE_NAME } = CONFIG;

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    // Create object store for stories if it doesn't exist
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      database.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
      console.log(`Object store ${OBJECT_STORE_NAME} created`);
    }
  },
});

const StoryIdb = {
  async getStories() {
    try {
      const db = await dbPromise;
      return await db.getAll(OBJECT_STORE_NAME);
    } catch (error) {
      console.error('Error getting stories from IndexedDB:', error);
      return [];
    }
  },

  async getStory(id) {
    try {
      const db = await dbPromise;
      return await db.get(OBJECT_STORE_NAME, id);
    } catch (error) {
      console.error(`Error getting story ${id} from IndexedDB:`, error);
      return null;
    }
  },

  async saveStories(stories) {
    try {
      // Ambil semua cerita yang ada di IndexedDB terlebih dahulu
      const existingStories = await this.getStories();
      const existingStoriesMap = {}; 
      
      // Buat map dari cerita yang ada untuk akses cepat
      existingStories.forEach(story => {
        existingStoriesMap[story.id] = story;
      });
      
      // Buat transaksi untuk menyimpan cerita ke IndexedDB
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      const promises = [];

      // Update stories dengan status favorite yang ada
      stories.forEach((story) => {
        // Jika cerita sudah ada di IndexedDB, pertahankan status favorite-nya
        if (existingStoriesMap[story.id]) {
          // Pertahankan status favorite dari cerita yang sudah ada
          story.isFavorite = existingStoriesMap[story.id].isFavorite;
        } else if (typeof story.isFavorite === 'undefined') {
          // Jika belum ada, defaultnya false
          story.isFavorite = false;
        }
        
        // Simpan cerita ke IndexedDB
        promises.push(tx.store.put(story));
      });
      
      await Promise.all(promises);
      await tx.done;
      
      console.log('Stories successfully saved to IndexedDB with preserved favorite status');
      return true;
    } catch (error) {
      console.error('Error saving stories to IndexedDB:', error);
      return false;
    }
  },

  async saveStory(story) {
    try {
      // Periksa apakah cerita sudah ada di IndexedDB
      const existingStory = await this.getStory(story.id);
      
      // Jika cerita sudah ada, pertahankan status favorite-nya
      if (existingStory) {
        story.isFavorite = existingStory.isFavorite;
      } else if (typeof story.isFavorite === 'undefined') {
        // Jika belum ada dan tidak memiliki properti isFavorite, defaultnya false
        story.isFavorite = false;
      }
      
      const db = await dbPromise;
      await db.put(OBJECT_STORE_NAME, story);
      console.log(`Story ${story.id} successfully saved to IndexedDB`);
      return true;
    } catch (error) {
      console.error(`Error saving story ${story.id} to IndexedDB:`, error);
      return false;
    }
  },

  async deleteStory(id) {
    try {
      const db = await dbPromise;
      await db.delete(OBJECT_STORE_NAME, id);
      console.log(`Story ${id} successfully deleted from IndexedDB`);
      return true;
    } catch (error) {
      console.error(`Error deleting story ${id} from IndexedDB:`, error);
      return false;
    }
  },

  async searchStories(query) {
    try {
      const stories = await this.getStories();
      return stories.filter((story) => 
        story.name.toLowerCase().includes(query.toLowerCase()) || 
        story.description.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching stories in IndexedDB:', error);
      return [];
    }
  },

  async getFavoriteStories() {
    try {
      const stories = await this.getStories();
      return stories.filter((story) => story.isFavorite);
    } catch (error) {
      console.error('Error getting favorite stories from IndexedDB:', error);
      return [];
    }
  },

  async toggleFavorite(id) {
    try {
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      
      const story = await tx.store.get(id);
      if (!story) return false;
      
      story.isFavorite = !story.isFavorite;
      await tx.store.put(story);
      await tx.done;
      
      console.log(`Story ${id} favorite status toggled to ${story.isFavorite}`);
      return true;
    } catch (error) {
      console.error(`Error toggling favorite for story ${id}:`, error);
      return false;
    }
  },
  
  async setFavoriteStatus(id, isFavorite) {
    try {
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      
      let story = await tx.store.get(id);
      
      // If story doesn't exist in IndexedDB yet, we need to fetch it from API
      if (!story) {
        return false;
      }
      
      story.isFavorite = isFavorite;
      await tx.store.put(story);
      await tx.done;
      
      console.log(`Story ${id} favorite status set to ${isFavorite}`);
      return true;
    } catch (error) {
      console.error(`Error setting favorite status for story ${id}:`, error);
      return false;
    }
  },

  async clearAll() {
    try {
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      await tx.store.clear();
      await tx.done;
      
      console.log('All stories cleared from IndexedDB');
      return true;
    } catch (error) {
      console.error('Error clearing all stories from IndexedDB:', error);
      return false;
    }
  }
};

export default StoryIdb; 