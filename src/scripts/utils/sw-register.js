let deferredPrompt;

export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.bundle.js');
        console.log('Service worker registered successfully with scope:', registration.scope);
        
        // Mendengarkan event updatefound untuk menangani update service worker
        registration.addEventListener('updatefound', () => {
          // Dapatkan service worker yang baru diinstal
          const newWorker = registration.installing;
          
          // Tambahkan listener untuk perubahan state pada service worker baru
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Ada service worker yang baru diinstal dan yang lama masih aktif
              console.log('New service worker installed, content updated!');
              
              // Tampilkan notifikasi bahwa ada update
              if (confirm('Konten baru tersedia! Klik OK untuk memperbarui.')) {
                window.location.reload();
                // Beri tahu service worker untuk skip waiting
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            }
          });
        });
        
        return registration;
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  };

// Fungsi untuk menangani installable event
export const initInstallPromotion = () => {
  // Simpan event prompt untuk digunakan nanti
  window.addEventListener('beforeinstallprompt', (event) => {
    // Cegah Chrome menampilkan prompt install bawaan
    event.preventDefault();
    
    // Simpan event untuk digunakan nanti
    deferredPrompt = event;
    
    // Tampilkan UI untuk menampilkan opsi instalasi aplikasi
    showInstallPromotion();
  });
  
  // Ketika aplikasi diinstal, hapus prompt
  window.addEventListener('appinstalled', () => {
    // Log bahwa aplikasi berhasil diinstal
    console.log('PWA was installed');
    
    // Reset prompt variabel
    deferredPrompt = null;
    
    // Sembunyikan UI ajakan instalasi
    hideInstallPromotion();
  });
};

// Fungsi untuk menampilkan UI promosi instalasi
const showInstallPromotion = () => {
  // Pastikan elemen UI ada dalam DOM
  const installBanner = document.getElementById('pwa-install-banner');
  if (installBanner) {
    installBanner.style.display = 'flex';
    
    // Tambahkan event listener pada tombol install
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.addEventListener('click', showInstallPrompt);
    }
  } else {
    // Jika belum ada, buat elemen banner
    createInstallBanner();
  }
};

// Fungsi untuk menyembunyikan UI promosi instalasi
const hideInstallPromotion = () => {
  const installBanner = document.getElementById('pwa-install-banner');
  if (installBanner) {
    installBanner.style.display = 'none';
  }
};

// Fungsi untuk menampilkan prompt instalasi
const showInstallPrompt = async () => {
  if (!deferredPrompt) {
    console.log('Can not show install prompt');
    return;
  }
  
  // Tampilkan prompt instalasi
  deferredPrompt.prompt();
  
  // Tunggu pengguna merespons prompt
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to install prompt: ${outcome}`);
  
  // Tidak bisa menggunakan prompt ini lagi, harus menunggu event baru
  deferredPrompt = null;
  
  // Sembunyikan UI promosi
  hideInstallPromotion();
};

// Fungsi untuk membuat banner instalasi
const createInstallBanner = () => {
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="pwa-install-content">
      <div class="pwa-install-icon">
        <img src="./icons/web-app-manifest-192x192.png" alt="Story Share App Icon">
      </div>
      <div class="pwa-install-text">
        <h3>Install Story Share App</h3>
        <p>Install aplikasi ini untuk pengalaman yang lebih baik</p>
      </div>
      <button id="pwa-install-button" class="pwa-install-btn">Install</button>
      <button id="pwa-close-button" class="pwa-close-btn">&times;</button>
    </div>
  `;
  
  // Tambahkan CSS untuk banner
  const style = document.createElement('style');
  style.textContent = `
    #pwa-install-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: white;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      padding: 10px;
      z-index: 1000;
      display: none;
    }
    
    .pwa-install-content {
      display: flex;
      align-items: center;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .pwa-install-icon img {
      width: 48px;
      height: 48px;
      margin-right: 15px;
    }
    
    .pwa-install-text {
      flex-grow: 1;
    }
    
    .pwa-install-text h3 {
      margin: 0;
      font-size: 18px;
    }
    
    .pwa-install-text p {
      margin: 5px 0 0;
      font-size: 14px;
      color: #666;
    }
    
    .pwa-install-btn {
      background-color: #2196f3;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      margin-left: 15px;
      cursor: pointer;
    }
    
    .pwa-close-btn {
      background: none;
      border: none;
      color: #666;
      font-size: 24px;
      margin-left: 10px;
      cursor: pointer;
    }
  `;
  
  // Tambahkan elemen ke DOM
  document.head.appendChild(style);
  document.body.appendChild(banner);
  
  // Tambahkan event listener pada tombol close
  const closeButton = document.getElementById('pwa-close-button');
  if (closeButton) {
    closeButton.addEventListener('click', hideInstallPromotion);
  }
  
  // Tambahkan event listener pada tombol install
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.addEventListener('click', showInstallPrompt);
  }
  
  // Tampilkan banner
  banner.style.display = 'flex';
};