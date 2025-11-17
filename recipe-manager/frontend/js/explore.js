const API_URL = 'http://localhost:3000/api';
let currentUser = null;

// Verificar autenticación
document.addEventListener('DOMContentLoaded', async () => {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    window.location.href = 'index.html';
    return;
  }
  
  currentUser = JSON.parse(userStr);
  
  // Inicializar i18n
  await i18n.init();
  
  // Actualizar bienvenida
  document.getElementById('userWelcome').textContent = `👋 ${currentUser.username}`;
  
  // Language selector
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      i18n.changeLanguage(btn.dataset.lang);
      loadPublicRecipes();
    });
  });
  
  // Set active language button
  const currentLang = i18n.getCurrentLang();
  document.querySelector(`[data-lang="${currentLang}"]`).classList.add('active');
  
  // Setup event listeners
  setupEventListeners();
  
  // Cargar recetas públicas
  await loadPublicRecipes();
});

function setupEventListeners() {
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });
  
  // Tab navigation
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      
      // Update active tab button
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active tab content
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.getElementById(tabName).classList.add('active');
    });
  });
  
  // User search
  document.getElementById('userSearchBtn').addEventListener('click', searchUsers);
  document.getElementById('userSearchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchUsers();
    }
  });
}

// Cargar recetas públicas
async function loadPublicRecipes() {
  try {
    const response = await fetch(`${API_URL}/users/feed/public`);
    const recipes = await response.json();
    renderPublicRecipes(recipes);
  } catch (error) {
    console.error('Error al cargar recetas públicas:', error);
  }
}

// Renderizar recetas públicas
function renderPublicRecipes(recipes) {
  const container = document.getElementById('publicRecipesContainer');
  
  if (recipes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🍳</div>
        <p class="empty-state-text">No hay recetas públicas aún</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = recipes.map(recipe => `
    <div class="recipe-card">
      ${recipe.image_url ? 
        `<img src="${recipe.image_url}" alt="${recipe.title}" class="recipe-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">` :
        `<div class="recipe-image"></div>`
      }
      <div class="recipe-content">
        <div class="recipe-author">
          <div class="recipe-author-avatar">${recipe.username.charAt(0).toUpperCase()}</div>
          <span>${i18n.t('recipe.by')} <strong>${recipe.username}</strong></span>
        </div>
        <h3 class="recipe-title">${recipe.title}</h3>
        <span class="recipe-category">${i18n.t(`categories.${recipe.category}`)}</span>
        <p class="recipe-description">${recipe.description || ''}</p>
        <div class="recipe-meta">
          ${recipe.servings ? `<span>👥 ${recipe.servings} ${recipe.servings === 1 ? 'porción' : 'porciones'}</span>` : ''}
          ${recipe.prep_time ? `<span>⏱️ ${recipe.prep_time} min prep</span>` : ''}
          ${recipe.cook_time ? `<span>🔥 ${recipe.cook_time} min cocción</span>` : ''}
        </div>
        <div class="recipe-actions">
          <button class="btn btn-secondary btn-sm" onclick="viewRecipeDetail(${recipe.id}, ${recipe.user_id})">
            Ver Detalle
          </button>
          <button class="btn btn-primary btn-sm" onclick="viewUserProfile(${recipe.user_id})">
            ${i18n.t('users.viewProfile')}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Buscar usuarios
async function searchUsers() {
  const query = document.getElementById('userSearchInput').value.trim();
  const resultsDiv = document.getElementById('userSearchResults');
  
  if (query.length < 2) {
    resultsDiv.innerHTML = `<p style="text-align: center; color: var(--gray-color);">Ingresa al menos 2 caracteres para buscar</p>`;
    return;
  }
  
  resultsDiv.innerHTML = '<p style="text-align: center;">Buscando...</p>';
  
  try {
    const response = await fetch(`${API_URL}/users/search?query=${encodeURIComponent(query)}`);
    const users = await response.json();
    renderUsers(users);
  } catch (error) {
    resultsDiv.innerHTML = `<p style="text-align: center; color: var(--danger-color);">Error al buscar usuarios</p>`;
  }
}

// Renderizar usuarios
function renderUsers(users) {
  const container = document.getElementById('userSearchResults');
  
  if (users.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <p class="empty-state-text" data-i18n="users.noResults">${i18n.t('users.noResults')}</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = users.map(user => `
    <div class="user-card" onclick="viewUserProfile(${user.id})">
      <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
      <div class="user-name">${user.username}</div>
      ${user.bio ? `<div class="user-bio">${user.bio}</div>` : ''}
      <button class="btn btn-primary btn-sm" data-i18n="users.viewProfile">
        ${i18n.t('users.viewProfile')}
      </button>
    </div>
  `).join('');
}

// Ver perfil de usuario
function viewUserProfile(userId) {
  window.location.href = `user-profile.html?id=${userId}`;
}

// Ver detalle de receta
function viewRecipeDetail(recipeId, userId) {
  window.location.href = `user-profile.html?id=${userId}&recipe=${recipeId}`;
}