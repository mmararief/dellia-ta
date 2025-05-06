import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import NotFoundPage from './not-found/not-found-page';
import NotificationHelper from '../utils/notification-helper';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #currentPage = null;
  #notFoundPage = new NotFoundPage();
  #isPageTransitioning = false;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      })
    });
  }

  async renderPage() {
    // Set transitioning flag to prevent notification requests
    this.#isPageTransitioning = true;
    
    // Don't allow notification requests during page transitions
    if (NotificationHelper.isRequestingPermission()) {
      console.log('Page transition occurring during notification request, might be refreshing');
    }

    const url = getActiveRoute();
    const page = routes[url];
    
    if (!page) {
      if (document.startViewTransition) {
        document.startViewTransition(async () => {
          this.#content.innerHTML = await this.#notFoundPage.render();
          await this.#notFoundPage.afterRender();
          this.#isPageTransitioning = false;
        });
      } else {
        this.#content.innerHTML = await this.#notFoundPage.render();
        await this.#notFoundPage.afterRender();
        this.#isPageTransitioning = false;
      }
      
      this.#currentPage = this.#notFoundPage;
      return;
    }

    if (this.#currentPage && typeof this.#currentPage._onUnmount === 'function') {
      await this.#currentPage._onUnmount();
    }
    
    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        this.#content.innerHTML = await page.render();
        await page.afterRender();
        this.#isPageTransitioning = false;
      });
    } else {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
      this.#isPageTransitioning = false;
    }
    
    this.#currentPage = page;
  }
}

export default App;