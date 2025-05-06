import StoryIdb from '../../utils/db';

export default class FavoritePage {
  #stories = [];
  
  async render() {
    return `
      <section id="page-content" class="favorite-page container">
        <h1>Cerita Favorit</h1>
        
        <div class="page-description">
          <p>Daftar cerita yang telah Anda tandai sebagai favorit.</p>
        </div>
        
        <div id="favorite-stories-container" class="stories-container">
          <div class="loading-indicator">Memuat cerita favorit...</div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this.loadFavoriteStories();
    
    // Add event listener for online/offline status
    window.addEventListener('online', () => {
      if (this.#stories.length === 0) {
        this.loadFavoriteStories();
      }
    });
  }
  
  async loadFavoriteStories() {
    try {
      this.#stories = await StoryIdb.getFavoriteStories();
      this.renderFavoriteStories();
    } catch (error) {
      this.showError(error);
    }
  }
  
  renderFavoriteStories() {
    const storiesContainer = document.getElementById('favorite-stories-container');
    
    if (this.#stories.length === 0) {
      storiesContainer.innerHTML = `
        <div class="empty-state">
          <p>Belum ada cerita favorit. Tambahkan cerita ke favorit dari halaman beranda.</p>
          <a href="#/" class="btn-primary">Kembali ke Beranda</a>
        </div>
      `;
      return;
    }
    
    let storiesHTML = '<div class="story-list">';
    
    this.#stories.forEach((story) => {
      storiesHTML += `
        <div class="story-card">
          <img src="${story.photoUrl}" alt="${story.name}" class="story-image">
          <div class="story-content">
            <div class="story-header">
              <h2 class="story-title">${story.name}</h2>
              <button class="btn-favorite favorited" data-id="${story.id}" aria-label="Hapus dari favorit">
                <i class="fas fa-heart"></i>
              </button>
            </div>
            <p class="story-info">
              <span class="story-author">Oleh: ${story.name}</span>
              <span class="story-date">Tanggal: ${new Date(story.createdAt).toLocaleDateString('id-ID')}</span>
            </p>
            <p class="story-description">${story.description.substring(0, 100)}${story.description.length > 100 ? '...' : ''}</p>
            <a href="#/detail/${story.id}" class="btn-detail">Baca Selengkapnya</a>
          </div>
        </div>
      `;
    });
    
    storiesHTML += '</div>';
    storiesContainer.innerHTML = storiesHTML;
    
    // Add event listeners for favorite buttons
    document.querySelectorAll('.btn-favorite').forEach(button => {
      button.addEventListener('click', async (event) => {
        const storyId = event.currentTarget.dataset.id;
        await StoryIdb.toggleFavorite(storyId);
        await this.loadFavoriteStories(); // Refresh the list
      });
    });
  }
  
  showError(error) {
    const storiesContainer = document.getElementById('favorite-stories-container');
    storiesContainer.innerHTML = `
      <div class="error-message">
        <p>Gagal memuat cerita favorit: ${error.message}</p>
        <p>Silakan coba lagi nanti.</p>
        <a href="#/" class="btn-primary">Kembali ke Beranda</a>
      </div>
    `;
  }
} 