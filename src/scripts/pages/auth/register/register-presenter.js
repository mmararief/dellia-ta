export default class RegisterPresenter {
  #view;
  #model;

  constructor(model, view) {
    this.#model = model;
    this.#view = view;
  }

  async register(name, email, password) {
    try {
      const response = await this.#model.register(name, email, password);
      this.#view.showSuccessMessage();
      
      // Redirect to login page after successful registration
      await this.#view.redirectAfterDelay(2000, '#/login');
    } catch (error) {
      this.#view.showErrorMessage(error);
    }
  }
}