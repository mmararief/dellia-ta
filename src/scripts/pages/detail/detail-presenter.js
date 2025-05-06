export default class DetailPresenter {
  #view;
  #model;
  #id;

  constructor(id, model, view) {
    if (id) {
      this.#id = id;
    } else {
      const hash = window.location.hash.slice(1);
      const segments = hash.split('/');
      const lastSegment = segments[segments.length - 1];
      this.#id = lastSegment;
    }
    
    console.log('DetailPresenter using ID:', this.#id);
    
    this.#model = model;
    this.#view = view;
    
    if (!this.#id || this.#id === '') {
      console.error('ID tidak valid:', this.#id);
      this.#view.showError(new Error('ID cerita tidak valid'));
    }
  }

  async getStoryDetail() {
    console.time('fetchStory');
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.#view.showError(new Error('Token tidak ditemukan, silakan login terlebih dahulu'));
      window.location.href = '#/login';
      return;
    }

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Permintaan timeout setelah 15 detik')), 15000)
    );
    
    try {
      const story = await Promise.race([
        this.#model.getStoryDetail(this.#id),
        timeoutPromise
      ]);
      
      console.log('Story data received:', story);
      
      if (!story) {
        throw new Error('Data cerita kosong atau tidak valid');
      }
      
      console.timeEnd('fetchStory');
      
      if (story && story.photoUrl) {
        if (!story.photoUrl.startsWith('http')) {
          console.log('Photo URL in presenter:', story.photoUrl);
        }
      }
      
      this.#view.showStory(story);
      
      if (story.lat && story.lon) {
        this.#view.showMap(story);
      } else {
        this.#view.hideMap();
      }
    } catch (error) {
      console.timeEnd('fetchStory');
      console.error('Error fetching story:', error);
      
      if (error.message.includes('token') || error.message.includes('Token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '#/login';
      }
      
      this.#view.showError(error);
    }
  }
}