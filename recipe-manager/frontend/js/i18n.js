class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('language') || 'es';
    this.translations = {};
  }

  async init() {
    await this.loadLanguage(this.currentLang);
  }

  async loadLanguage(lang) {
    try {
      const response = await fetch(`./locales/${lang}.json`);
      this.translations = await response.json();
      this.currentLang = lang;
      localStorage.setItem('language', lang);
      this.updatePage();
    } catch (error) {
      console.error('Error cargando idioma:', error);
    }
  }

  t(key) {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      value = value[k];
      if (value === undefined) return key;
    }
    
    return value;
  }

  updatePage() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });
  }

  changeLanguage(lang) {
    this.loadLanguage(lang);
  }

  getCurrentLang() {
    return this.currentLang;
  }
}

const i18n = new I18n();