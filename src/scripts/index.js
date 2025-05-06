import '../styles/styles.css';
import '../styles/responsive.css';

import App from './pages/app';
import { registerServiceWorker, initInstallPromotion } from './utils/sw-register';
import syncManager from './utils/sync-manager';
import NotificationHelper from './utils/notification-helper';

document.addEventListener('DOMContentLoaded', async () => {
  // Register service worker
  await registerServiceWorker();
  
  // Initialize sync manager for offline data
  syncManager.init();
  
  // Initialize install promotion
  initInstallPromotion();
  
  // DO NOT automatically request notification permission on page load
  // This was causing page refresh loops when permission was denied
  
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  const skipToContentLink = document.querySelector('.skip-to-content');
  const mainContent = document.querySelector('#main-content');

  if (skipToContentLink && mainContent) {
    skipToContentLink.addEventListener('click', (e) => {
      e.preventDefault();
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    });
  }
});