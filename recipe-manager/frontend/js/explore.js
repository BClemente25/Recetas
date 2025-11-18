const API_URL = 'http://localhost:3000/api';
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Proteger la ruta y obtener el usuario
  currentUser = JSON.parse(localStorage.getItem('user'));
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }

  // Inicializar i18n
  await i18n.init();

  // Configurar bienvenida y logout
  document.getElementById('userWelcome').textContent = `👋 ${currentUser.username}`;
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });

  // Configurar selector de idioma
  setupLanguageSelector();

  // Configurar pestañas de navegación
  setupTabs();

  // Cargar recetas públicas por defecto
  loadPublicRecipes();

  // Configurar búsqueda de usuarios
  document.getElementById('userSearchBtn').addEventListener('click', searchUsers);
  document.getElementById('userSearchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchUsers();
    }
  });
});

function setupLanguageSelector() {
  const currentLang = i18n.getCurrentLang();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.dataset.lang === currentLang) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      i18n.changeLanguage(btn.dataset.lang);
    });
  });
}

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === button.dataset.tab) {
          content.classList.add('active');
        }
      });
    });
  });
}

async function loadPublicRecipes() {
  const container = document.getElementById('publicRecipesContainer');
  container.innerHTML = 'Cargando recetas...';

  try {
    // Usamos la ruta del feed que creaste en user.js
    const response = await fetch(`${API_URL}/user/feed/public`);
    if (!response.ok) throw new Error('Error al cargar recetas públicas');

    const recipes = await response.json();

    if (recipes.length === 0) {
      container.innerHTML = `<p>${i18n.t('recipe.noRecipes')}</p>`;
      return;
    }

    container.innerHTML = ''; // Limpiar el contenedor
    recipes.forEach(recipe => {
      const recipeCard = document.createElement('div');
      recipeCard.className = 'recipe-card';
      recipeCard.innerHTML = `
        <div class="recipe-card-image" style="background-image: url('${recipe.image_url || './assets/placeholder.png'}')"></div>
        <div class="recipe-card-content">
          <h3>${recipe.title}</h3>
          <p class="recipe-author">${i18n.t('recipe.by')} <a href="user-profile.html?id=${recipe.user_id}">${recipe.username}</a></p>
        </div>
      `;
      // Opcional: hacer que la tarjeta sea clickeable para ver detalles
      // recipeCard.addEventListener('click', () => showRecipeDetail(recipe.id));
      container.appendChild(recipeCard);
    });
  } catch (error) {
    container.innerHTML = `<p class="alert alert-error">${error.message}</p>`;
  }
}

async function searchUsers() {
  const query = document.getElementById('userSearchInput').value;
  const resultsContainer = document.getElementById('userSearchResults');

  if (query.length < 2) {
    resultsContainer.innerHTML = `<p>${i18n.t('users.noResults')}</p>`;
    return;
  }

  try {
    const response = await fetch(`${API_URL}/user/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Error al buscar usuarios');

    const users = await response.json();
    resultsContainer.innerHTML = '';

    if (users.length === 0) {
      resultsContainer.innerHTML = `<p>${i18n.t('users.noResults')}</p>`;
      return;
    }

    users.forEach(user => {
      const userCard = document.createElement('a');
      userCard.href = `user-profile.html?id=${user.id}`;
      userCard.className = 'user-card';
      userCard.innerHTML = `
        <div class="user-avatar" style="background-image: url('${user.avatar_url || './assets/default-avatar.png'}')"></div>
        <div class="user-info">
          <h4>${user.username}</h4>
        </div>
      `;
      resultsContainer.appendChild(userCard);
    });
  } catch (error) {
    resultsContainer.innerHTML = `<p class="alert alert-error">${error.message}</p>`;
  }
}