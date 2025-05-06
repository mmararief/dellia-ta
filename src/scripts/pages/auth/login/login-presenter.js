export default class LoginPresenter {
    #view;
    #model;
  
    constructor(model, view) {
      this.#model = model;
      this.#view = view;
    }
  
    async login(email, password) {
      try {
        const userData = await this.#model.login(email, password);
        this.#view.showSuccessMessage(userData);
        
        // Redirect after successful login
        await this.#view.redirectAfterDelay(2000, '#/');
      } catch (error) {
        this.#view.showErrorMessage(error);
      }
    }
  }