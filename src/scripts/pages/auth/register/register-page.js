import RegisterPresenter from './register-presenter.js';
import Api from '../../../data/api.js';
import { sleep } from '../../../utils';

export default class RegisterPage {
  #presenter;
  
  constructor() {
    // The page itself acts as the view for the presenter
    this.#presenter = new RegisterPresenter(Api, this);
  }

  async render() {
    return `
      <section id="page-content" class="register-page container">
        <h1>Daftar Akun</h1>
        
        <form id="register-form" class="register-form">
          <div class="form-group">
            <label for="name">Nama</label>
            <input type="text" id="name" name="name" required>
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required minlength="6">
            <small>Minimal 8 karakter</small>
          </div>
          
          <div class="form-actions">
            <button type="submit" id="register-button" class="btn-submit">
              Daftar
            </button>
          </div>
        </form>
        
        <div id="register-status" class="register-status" style="display:none;"></div>
        
        <div class="login-link">
          <p>Sudah punya akun? <a href="#/login">Masuk di sini</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._initRegisterForm();
  }
  
  _initRegisterForm() {
    const form = document.getElementById('register-form');
    
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      
      this._showLoadingState();
      
      // Let the presenter handle the registration logic
      await this.#presenter.register(
        nameInput.value,
        emailInput.value,
        passwordInput.value
      );
    });
  }
  
  _showLoadingState() {
    const registerButton = document.getElementById('register-button');
    registerButton.disabled = true;
    registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
  }
  
  _resetLoadingState() {
    const registerButton = document.getElementById('register-button');
    registerButton.disabled = false;
    registerButton.innerHTML = 'Daftar';
  }
  
  showSuccessMessage() {
    const registerStatus = document.getElementById('register-status');
    registerStatus.style.display = 'block';
    registerStatus.innerHTML = `
      <div class="success-message">
        <h3>Pendaftaran berhasil!</h3>
        <p>Silakan login dengan email dan password Anda. Mengalihkan ke halaman login...</p>
      </div>
    `;
  }
  
  showErrorMessage(error) {
    const registerStatus = document.getElementById('register-status');
    registerStatus.style.display = 'block';
    registerStatus.innerHTML = `
      <div class="error-message">
        <h3>Pendaftaran gagal</h3>
        <p>${error.message || 'Silakan coba dengan email lain'}</p>
      </div>
    `;
    
    this._resetLoadingState();
  }
  
  async redirectAfterDelay(delayMs, path) {
    await sleep(delayMs);
    window.location.hash = path;
  }
}