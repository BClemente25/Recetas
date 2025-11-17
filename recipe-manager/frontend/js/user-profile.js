const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let viewingUserId = null;
let userRecipes = [];

// Verificar autenticación y cargar perfil
document.addEventListener('DOMContentLoaded', async () => {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    window.location.href = 'index.html';
    return;
  }
  
  currentUser = JSON.parse(userStr);
  
  // Obtener ID del usuario a ver desde URL
  const urlParams = new URLSearchParams(window.location.search);
  viewingUserId = urlParams.get('id');
  const recipeId = urlParams.get('recipe');
  
  if (!viewingUserId) {
    window.location.href = 'explore.html';
    return;
  }
  
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
      renderUserRecipes();
    });
  });
  
  // Set active language button
  const currentLang = i18n.getCurrentLang();
  document.querySelector(`[data-lang="${currentLang}"]`).classList.add('active');
  
  // Setup event listeners
  setupEventListeners();
  
  // Cargar perfil y recetas
  await loadUserProfile();
  await loadUserRecipes();
  
  // Si hay un recipeId específico, abrir su detalle
  if (recipeId) {
    const recipe = userRecipes.find(r => r.id === parseInt(recipeId));
    if (recipe) {
      openRecipeDetail(recipe);
    }
  }
});

function setupEventListeners() {
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });
  
  // Close recipe detail modal
  document.getElementById('closeDetailModalBtn').addEventListener('click', closeRecipeDetail);
  document.getElementById('closeDetailBtn').addEventListener('click', closeRecipeDetail);
  
  // Close modal when clicking outside
  document.getElementById('recipeDetailModal').addEventListener('click', (e) => {
    if (e.target.id === 'recipeDetailModal') {
      closeRecipeDetail();
    }
  });
}

// Cargar perfil de usuario
async function loadUserProfile() {
  try {
    const response = await fetch(`${API_URL}/users/${viewingUserId}`);
    const user = await response.json();
    
    // Actualizar UI con información del usuario
    document.getElementById('profileAvatar').textContent = user.username.charAt(0).toUpperCase();
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileBio').textContent = user.bio || 'Sin biografía';
    
    // Actualizar título de recetas
    document.getElementById('recipesTitle').textContent = `${i18n.t('users.recipesFrom')} ${user.username}`;
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    alert('Error al cargar el perfil del usuario');
    window.location.href = 'explore.html';
  }
}

// Cargar recetas del usuario
async function loadUserRecipes() {
  try {
    const response = await fetch(`${API_URL}/users/${viewingUserId}/recipes`);
    userRecipes = await response.json();
    renderUserRecipes();
  } catch (error) {
    console.error('Error al cargar recetas:', error);
  }
}

// Renderizar recetas del usuario
function renderUserRecipes() {
  const container = document.getElementById('userRecipesContainer');
  
  if (userRecipes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🍳</div>
        <p class="empty-state-text">Este usuario no tiene recetas públicas</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = userRecipes.map(recipe => `
    <div class="recipe-card">
      ${recipe.image_url ? 
        `<img src="${recipe.image_url}" alt="${recipe.title}" class="recipe-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">` :
        `<div class="recipe-image"></div>`
      }
      <div class="recipe-content">
        <h3 class="recipe-title">${recipe.title}</h3>
        <span class="recipe-category">${i18n.t(`categories.${recipe.category}`)}</span>
        <p class="recipe-description">${recipe.description || ''}</p>
        <div class="recipe-meta">
          ${recipe.servings ? `<span>👥 ${recipe.servings} ${recipe.servings === 1 ? 'porción' : 'porciones'}</span>` : ''}
          ${recipe.prep_time ? `<span>⏱️ ${recipe.prep_time} min prep</span>` : ''}
          ${recipe.cook_time ? `<span>🔥 ${recipe.cook_time} min cocción</span>` : ''}
        </div>
        <div class="recipe-actions">
          <button class="btn btn-primary btn-sm" onclick="openRecipeDetailById(${recipe.id})">
            Ver Detalle
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Abrir detalle de receta por ID
function openRecipeDetailById(recipeId) {
  const recipe = userRecipes.find(r => r.id === recipeId);
  if (recipe) {
    openRecipeDetail(recipe);
  }
}

// Abrir modal con detalle de receta
function openRecipeDetail(recipe) {
  const modal = document.getElementById('recipeDetailModal');
  const title = document.getElementById('recipeDetailTitle');
  const content = document.getElementById('recipeDetailContent');
  
  title.textContent = recipe.title;
  
  const ingredientsList = recipe.ingredients.split('\n').filter(i => i.trim()).map(i => `<li>${i}</li>`).join('');
  const instructionsList = recipe.instructions.split('\n').filter(i => i.trim()).map(i => `<li>${i}</li>`).join('');
  
  content.innerHTML = `
    ${recipe.image_url ? `<img src="${recipe.image_url}" alt="${recipe.title}" style="width: 100%; border-radius: 10px; margin-bottom: 1.5rem;" onerror="this.style.display='none'">` : ''}
    
    <div style="margin-bottom: 1.5rem;">
      <span class="recipe-category">${i18n.t(`categories.${recipe.category}`)}</span>
      ${recipe.description ? `<p style="margin-top: 1rem; color: var(--gray-color);">${recipe.description}</p>` : ''}
    </div>
    
    <div class="recipe-meta" style="margin-bottom: 2rem;">
      ${recipe.servings ? `<span>👥 ${recipe.servings} ${recipe.servings === 1 ? 'porción' : 'porciones'}</span>` : ''}
      ${recipe.prep_time ? `<span>⏱️ ${recipe.prep_time} min preparación</span>` : ''}
      ${recipe.cook_time ? `<span>🔥 ${recipe.cook_time} min cocción</span>` : ''}
    </div>
    
    <div style="margin-bottom: 2rem;">
      <h3 style="color: var(--primary-color); margin-bottom: 1rem;">${i18n.t('recipe.ingredients')}</h3>
      <ul style="line-height: 2; padding-left: 1.5rem;">
        ${ingredientsList}
      </ul>
    </div>
    
    <div>
      <h3 style="color: var(--primary-color); margin-bottom: 1rem;">${i18n.t('recipe.instructions')}</h3>
      <ol style="line-height: 2; padding-left: 1.5rem;">
        ${instructionsList}
      </ol>
    </div>
  `;
  
  modal.classList.add('active');
}

// Cerrar modal de detalle
function closeRecipeDetail() {
  const modal = document.getElementById('recipeDetailModal');
  modal.classList.remove('active');
}