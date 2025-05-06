import MapPresenter from './map-presenter';
import CONFIG from '../../config';
import Api from '../../data/api';

export default class MapPage {
  #map = null;
  #markers = [];
  #mapPresenter = null;

  constructor(mapPresenter = null) {
    this.#mapPresenter = mapPresenter;
  }

  async render() {
    return `
      <section id="page-content" class="map-page container">
        <h1>Peta Cerita</h1>
        <p>Lihat semua cerita berdasarkan lokasi</p>
        
        <div id="stories-map" class="stories-map"></div>
        
        <div class="map-legend">
          <p><strong>Keterangan:</strong> Klik marker untuk melihat detail cerita</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (this.#mapPresenter) {
      this.#mapPresenter.loadStoriesWithLocation();
    } else {
      try {
        const stories = await Api.getStoriesWithLocation();
        this._initMap(stories);
      } catch (error) {
        console.error('Error fetching stories with location:', error);
        document.querySelector('#stories-map').innerHTML = `
          <p class="error-message">Gagal memuat data cerita. Silakan coba lagi nanti.</p>
        `;
      }
    }
  }
  
  renderMap(stories) {
    this._initMap(stories);
  }

  showError(error) {
    console.error('Error fetching stories with location:', error);
    document.querySelector('#stories-map').innerHTML = `
      <p class="error-message">Gagal memuat data cerita. Silakan coba lagi nanti.</p>
    `;
  }
  
  _initMap(stories) {
    const script = document.createElement('script');
    script.src = 'https://cdn.maptiler.com/maplibre-gl-js/v2.4.0/maplibre-gl.js';
    document.head.appendChild(script);
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.maptiler.com/maplibre-gl-js/v2.4.0/maplibre-gl.css';
    document.head.appendChild(link);
    
    script.onload = () => {
      let center = [107.6191, -6.9175]; 
      let zoom = 5;
      
      if (stories.length > 0 && stories[0].lat && stories[0].lon) {
        center = [stories[0].lon, stories[0].lat];
        zoom = 9;
      }
      
      this.#map = new maplibregl.Map({
        container: 'stories-map',
        style: `https://api.maptiler.com/maps/streets/style.json?key=${CONFIG.MAP_TILER_KEY}`,
        center,
        zoom
      });
      
      this.#map.addControl(new maplibregl.NavigationControl(), 'top-right');
      
      const layerControl = document.createElement('div');
      layerControl.className = 'layer-control';
      layerControl.innerHTML = `
        <select id="map-style">
          <option value="streets">Streets</option>
          <option value="outdoors">Outdoors</option>
          <option value="satellite">Satellite</option>
          <option value="basic">Basic</option>
        </select>
      `;

      document.getElementById('stories-map').appendChild(layerControl);
      
      document.getElementById('map-style').addEventListener('change', (e) => {
        const style = e.target.value;
        this.#map.setStyle(`https://api.maptiler.com/maps/${style}/style.json?key=${CONFIG.MAP_TILER_KEY}`);
      });
      
      stories.forEach((story) => {
        if (!story.lat || !story.lon) return;
        
        const popup = new maplibregl.Popup({ offset: 25 })
          .setHTML(`
            <div class="map-popup">
              <h3>${story.name}</h3>
              <div class="popup-image">
                <img src="${CONFIG.BASE_IMAGE_URL}${story.photoUrl}" alt="Foto cerita ${story.name}" width="150">
              </div>
              <p>${story.description.substring(0, 100)}${story.description.length > 100 ? '...' : ''}</p>
              <a href="#/detail/${story.id}" class="popup-link">Lihat Detail</a>
            </div>
          `);
        
        const marker = new maplibregl.Marker()
          .setLngLat([story.lon, story.lat])
          .setPopup(popup)
          .addTo(this.#map);
        
        this.#markers.push(marker);
      });
    };
  }
}