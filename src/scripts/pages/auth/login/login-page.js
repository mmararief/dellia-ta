import Api from '../../../data/api';
import { sleep } from '../../../utils';
import LoginPresenter from './login-presenter';

export default class LoginPage {
  #presenter;
  #loginStatus;
  #loginButton;

  constructor() {
    // The page itself acts as the view for the presenter
    this.#presenter = new LoginPresenter(Api, this);
  }
  
  async render() {
    return `
      <section id="page-content" class="login-page container">
        <h1>Login</h1>
        
        <form id="login-form" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          
          <div class="form-actions">
            <button type="submit" id="login-button" class="btn-submit">
              Masuk
            </button>
          </div>
        </form>
        
        <div id="login-status" class="login-status" style="display:none;"></div>
        
        <div class="register-link">
          <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._initElements();
    this._initLoginForm();
  }
  
  _initElements() {
    this.#loginStatus = document.getElementById('login-status');
    this.#loginButton = document.getElementById('login-button');
  }

  _initLoginForm() {
    const form = document.getElementById('login-form');
    
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      
      this.#loginButton.disabled = true;
      this.#loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
      
      // Delegate login handling to the presenter
      await this.#presenter.login(emailInput.value, passwordInput.value);
    });
  }

  // View methods that will be called by the presenter
  showSuccessMessage(userData) {
    this.#loginStatus.style.display = 'block';
    this.#loginStatus.innerHTML = `
      <div class="success-message">
        <h3>Login berhasil!</h3>
        <p>Selamat datang, ${userData.name}. Mengalihkan ke halaman utama...</p>
      </div>
    `;
  }

  showErrorMessage(error) {
    this.#loginStatus.style.display = 'block';
    this.#loginStatus.innerHTML = `
      <div class="error-message">
        <h3>Login gagal</h3>
        <p>${error.message || 'Silakan periksa email dan password Anda'}</p>
      </div>
    `;
    
    this.#loginButton.disabled = false;
    this.#loginButton.innerHTML = 'Masuk';
  }

  async redirectAfterDelay(delay, route) {
    await sleep(delay);
    window.location.hash = route;
  }
}