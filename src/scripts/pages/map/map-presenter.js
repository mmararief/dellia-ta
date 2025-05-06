export default class MapPresenter {
    #view;
    #model;
  
    constructor(model, view) {
      this.#model = model;
      this.#view = view;
    }
  
    async loadStoriesWithLocation() {
      try {
        const stories = await this.#model.getStoriesWithLocation();
        this.#view.renderMap(stories);
      } catch (error) {
        this.#view.showError(error);
      }
    }
  }