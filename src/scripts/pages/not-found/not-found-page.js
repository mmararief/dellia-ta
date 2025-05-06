export default class NotFoundPage {
  async render() {
    return `
      <section id="page-content" class="not-found-page container">
        <div class="error-container">
          <h1 class="error-code">404</h1>
          <h2 class="error-title">Halaman Tidak Ditemukan</h2>
          <p class="error-message">Maaf, halaman yang Anda cari tidak ditemukan.</p>
          <p class="error-suggestion">Mungkin halaman telah dipindahkan atau URL yang Anda masukkan salah.</p>
          <a href="#/" class="btn-primary">Kembali ke Beranda</a>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // No special action needed after render
  }
} 