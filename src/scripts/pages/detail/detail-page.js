import DetailPresenter from './detail-presenter';
import Api from '../../data/api';
import { sleep } from '../../utils';
import { parseActivePathname } from '../../utils';
import StoryIdb from '../../utils/db';

export default class DetailPage {
  #presenter;
  #currentStory = null;
  
  constructor(presenter = null) {
    this.#presenter = presenter;
  }
  
  setPresenter(presenter) {
    this.#presenter = presenter;
  }

  async render() {
    return `
      <section id="page-content" class="detail-page container">
        <h1 id="story-title">Loading story details...</h1>
        
        <div id="story-loading" class="loading-indicator">
          <i class="fas fa-spinner fa-spin"></i> Loading story...
        </div>
        
        <div id="story-content" class="story-content" style="display:none;">
          <div class="story-header">
            <div class="story-meta">
              <p class="author">By <span id="story-author">-</span></p>
              <p class="date"><span id="story-date">-</span></p>
            </div>
            <button id="favorite-button" class="btn-favorite" aria-label="Tambahkan ke favorit">
              <i id="favorite-icon" class="far fa-heart"></i>
            </button>
          </div>
          
          <div class="story-image-container">
            <img id="story-image" src="" alt="Story image" class="story-image">
          </div>
          
          <div id="story-description" class="story-description"></div>
          
          <div id="story-map" class="story-map" style="display:none;">
            <h3>Location</h3>
            <div id="map-container" class="map-container"></div>
          </div>
        </div>
        
        <div id="error-container" class="error-container" style="display:none;">
          <div class="error-message">
            <h3>Error loading story</h3>
            <p id="error-text"></p>
          </div>
        </div>
        
        <div class="navigation-actions">
          <a href="#/" class="back-button">Back to stories</a>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._showLoadingState();
    
    this.#presenter = new DetailPresenter(null, Api, this);
    
    await this.#presenter.getStoryDetail();
  }
  
  _showLoadingState() {
    const loadingIndicator = document.getElementById('story-loading');
    loadingIndicator.style.display = 'block';
    
    const storyContent = document.getElementById('story-content');
    storyContent.style.display = 'none';
    
    const errorContainer = document.getElementById('error-container');
    errorContainer.style.display = 'none';
  }
  
  async showStory(story) {
    this.#currentStory = story;
    
    const loadingIndicator = document.getElementById('story-loading');
    loadingIndicator.style.display = 'none';
    
    const storyContent = document.getElementById('story-content');
    storyContent.style.display = 'block';
    
    document.getElementById('story-title').textContent = story.title || 'Untitled Story';
    document.getElementById('story-author').textContent = story.name || 'Anonymous';
    document.getElementById('story-date').textContent = new Date(story.createdAt).toLocaleDateString();
    document.getElementById('story-description').innerHTML = story.description || '';
    
    const storyImage = document.getElementById('story-image');
    if (story.photoUrl) {
      storyImage.src = story.photoUrl;
      storyImage.alt = `Image for ${story.title}`;
    } else {
      storyImage.src = '/images/placeholder.jpg'; 
      storyImage.alt = 'No image available';
    }
    
    // Save the story to IndexedDB if it doesn't exist
    await this._saveStoryToIndexedDB(story);
    
    // Init favorite functionality
    this._initFavoriteButton();
  }
  
  async _saveStoryToIndexedDB(story) {
    // Check if story already exists in IndexedDB
    const existingStory = await StoryIdb.getStory(story.id);
    
    if (!existingStory) {
      // Add isFavorite property if it doesn't exist
      if (typeof story.isFavorite === 'undefined') {
        story.isFavorite = false;
      }
      
      await StoryIdb.saveStory(story);
    } else {
      // Update story with new data but keep favorite status
      story.isFavorite = existingStory.isFavorite;
      await StoryIdb.saveStory(story);
    }
  }
  
  async _initFavoriteButton() {
    const favoriteButton = document.getElementById('favorite-button');
    const favoriteIcon = document.getElementById('favorite-icon');
    
    // Get current favorite status from IndexedDB
    const story = await StoryIdb.getStory(this.#currentStory.id);
    
    if (story && story.isFavorite) {
      favoriteIcon.className = 'fas fa-heart';
      favoriteButton.classList.add('favorited');
      favoriteButton.setAttribute('aria-label', 'Hapus dari favorit');
    } else {
      favoriteIcon.className = 'far fa-heart';
      favoriteButton.classList.remove('favorited');
      favoriteButton.setAttribute('aria-label', 'Tambahkan ke favorit');
    }
    
    // Add event listener for the favorite button
    favoriteButton.addEventListener('click', async () => {
      await StoryIdb.toggleFavorite(this.#currentStory.id);
      
      // Get updated story
      const updatedStory = await StoryIdb.getStory(this.#currentStory.id);
      
      // Update UI
      if (updatedStory.isFavorite) {
        favoriteIcon.className = 'fas fa-heart';
        favoriteButton.classList.add('favorited');
        favoriteButton.setAttribute('aria-label', 'Hapus dari favorit');
      } else {
        favoriteIcon.className = 'far fa-heart';
        favoriteButton.classList.remove('favorited');
        favoriteButton.setAttribute('aria-label', 'Tambahkan ke favorit');
      }
    });
  }
  
  showMap(story) {
    const mapContainer = document.getElementById('story-map');
    mapContainer.style.display = 'block';

    const mapElement = document.getElementById('map-container');
    mapElement.innerHTML = `Map showing location at latitude: ${story.lat}, longitude: ${story.lon}`;
  }
  
  hideMap() {
    const mapContainer = document.getElementById('story-map');
    mapContainer.style.display = 'none';
  }
  
  showError(error) {
    const loadingIndicator = document.getElementById('story-loading');
    loadingIndicator.style.display = 'none';
    
    const storyContent = document.getElementById('story-content');
    storyContent.style.display = 'none';
    
    const errorContainer = document.getElementById('error-container');
    errorContainer.style.display = 'block';
    
    const errorText = document.getElementById('error-text');
    errorText.textContent = error.message || 'Failed to load story details. Please try again later.';
  }
}