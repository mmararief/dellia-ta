import Api from '../../data/api';
import HomePresenter from './home-presenter';

export default class HomePage {
  #presenter;
  
  async render() {
    return `
      <section id="page-content" class="home-page container">
        <h1>Cerita Terbaru</h1>
        
        <div id="auth-status" class="auth-status"></div>
        
        <div id="connection-status" class="connection-status">
          ${navigator.onLine ? 
            '<span class="online-status">Online</span>' : 
            '<span class="offline-status">Offline - Menampilkan data tersimpan</span>'}
        </div>
        
        <div id="stories-container" class="stories-container">
          <div class="loading-indicator">Memuat cerita...</div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter(Api, this);
    
    // Update connection status when online/offline status changes
    window.addEventListener('online', () => {
      document.getElementById('connection-status').innerHTML = '<span class="online-status">Online</span>';
      this.#presenter.loadStories(); // Reload stories when connection is back
    });
    
    window.addEventListener('offline', () => {
      document.getElementById('connection-status').innerHTML = '<span class="offline-status">Offline - Menampilkan data tersimpan</span>';
    });
    
    await this.#presenter.checkAuthStatus();
    await this.#presenter.loadStories();
  }
  
  renderAuthStatus(token, user) {
    const authStatusContainer = document.getElementById('auth-status');
    
    if (!token) {
      authStatusContainer.innerHTML = `
        <div class="auth-message">
          <p>Anda belum login. <a href="#/login">Login disini</a> untuk melihat atau membuat cerita.</p>
        </div>
      `;
    } else if (user) {
      authStatusContainer.innerHTML = `
        <div class="user-info">
          <p>Selamat datang, ${user.name}</p>
          <a href="#/add" class="btn-add">
            <i class="fas fa-plus"></i> Tambah Cerita Baru
          </a>
          <button id="logout-button" class="btn-logout">Logout</button>
        </div>
      `;
      
      document.getElementById('logout-button').addEventListener('click', () => {
        this.#presenter.handleLogout();
      });
    }
  }
  
  renderStories(stories) {
    const storiesContainer = document.getElementById('stories-container');
    
    if (stories.length === 0) {
      storiesContainer.innerHTML = `
        <div class="empty-state">
          <p>Tidak ada cerita tersedia. Tambahkan cerita baru atau coba lagi nanti.</p>
        </div>
      `;
      return;
    }
    
    let storiesHTML = '<div class="story-list">';
    
    stories.forEach((story) => {
      const favoriteClass = story.isFavorite ? 'favorited' : '';
      const favoriteIcon = story.isFavorite ? 'fas fa-heart' : 'far fa-heart';
      
      storiesHTML += `
        <div class="story-card">
          <img src="${story.photoUrl}" alt="${story.name}" class="story-image">
          <div class="story-content">
            <div class="story-header">
              <h2 class="story-title">${story.name}</h2>
              <button class="btn-favorite ${favoriteClass}" data-id="${story.id}" aria-label="${story.isFavorite ? 'Hapus dari favorit' : 'Tambahkan ke favorit'}">
                <i class="${favoriteIcon}"></i>
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
      button.addEventListener('click', (event) => {
        const storyId = event.currentTarget.dataset.id;
        this.#presenter.toggleFavorite(storyId);
      });
    });
  }
  
  showError(error) {
    const storiesContainer = document.getElementById('stories-container');
    storiesContainer.innerHTML = `
      <div class="error-message">
        <p>Gagal memuat cerita: ${error.message}</p>
        <p>Silakan coba lagi nanti.</p>
      </div>
    `;
  }
}