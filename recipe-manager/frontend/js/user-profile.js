const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let viewingUserId = null;
let userRecipes = [];
let isFollowing = false;

document.addEventListener('DOMContentLoaded', async () => {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    window.location.href = 'index.html';
    return;
  }
  
  currentUser = JSON.parse(userStr);
  
  const urlParams = new URLSearchParams(window.location.search);
  viewingUserId = urlParams.get('id');
  const recipeId = urlParams.get('recipe');
  
  if (!viewingUserId) {
    window.location.href = 'explore.html';
    return;
  }
  
  await i18n.init();
  
  document.getElementById('userWelcome').textContent = `👋 ${currentUser.username}`;
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      i18n.changeLanguage(btn.dataset.lang);
      renderUserRecipes();
    });
  });
  
  const currentLang = i18n.getCurrentLang();
  document.querySelector(`[data-lang="${currentLang}"]`).classList.add('active');
  
  setupEventListeners();
  
  await loadUserProfile();
  await loadUserRecipes();
  await loadFollowData();
  
  if (recipeId) {
    const recipe = userRecipes.find(r => r.id === parseInt(recipeId));
    if (recipe) {
      openRecipeDetail(recipe);
    }
  }
});

function setupEventListeners() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });
  
  document.getElementById('closeDetailModalBtn').addEventListener('click', closeRecipeDetail);
  document.getElementById('closeDetailBtn').addEventListener('click', closeRecipeDetail);
  
  document.getElementById('recipeDetailModal').addEventListener('click', (e) => {
    if (e.target.id === 'recipeDetailModal') {
      closeRecipeDetail();
    }
  });
}

async function loadUserProfile() {
  try {
    const response = await fetch(`${API_URL}/user/${viewingUserId}`);
    const user = await response.json();
    
    document.getElementById('profileAvatar').style.backgroundImage = `url('${user.avatar_url || 'https://via.placeholder.com/100?text=' + user.username.charAt(0)}')`;
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileBio').textContent = user.bio || i18n.t('users.noBio');
    
    document.getElementById('recipesTitle').textContent = `${i18n.t('users.recipesFrom')} ${user.username}`;
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    alert('Error al cargar el perfil del usuario');
    window.location.href = 'explore.html';
  }
}

async function loadUserRecipes() {
  try {
    const response = await fetch(`${API_URL}/user/${viewingUserId}/recipes`);
    userRecipes = await response.json();
    renderUserRecipes();
  } catch (error) {
    console.error('Error al cargar recetas:', error);
  }
}

async function loadFollowData() {
  // No mostrar botón de seguir en nuestro propio perfil
  if (currentUser.id === parseInt(viewingUserId)) {
    document.getElementById('followActionContainer').style.display = 'none';
  } else {
    // Verificar si el usuario actual ya sigue a este perfil
    const statusRes = await fetch(`${API_URL}/user/${viewingUserId}/follow-status/${currentUser.id}`);
    const statusData = await statusRes.json();
    isFollowing = statusData.isFollowing;
    renderFollowButton();
  }

  // Cargar contadores
  const followersRes = await fetch(`${API_URL}/user/${viewingUserId}/followers`);
  const followersData = await followersRes.json();
  document.getElementById('followersCount').textContent = followersData.length;

  const followingRes = await fetch(`${API_URL}/user/${viewingUserId}/following`);
  const followingData = await followingRes.json();
  document.getElementById('followingCount').textContent = followingData.length;
}

function renderFollowButton() {
  const container = document.getElementById('followActionContainer');
  if (isFollowing) {
    container.innerHTML = `<button class="btn btn-secondary" id="followBtn">${i18n.t('users.unfollow') || 'Dejar de Seguir'}</button>`;
    document.getElementById('followBtn').addEventListener('click', handleUnfollow);
  } else {
    container.innerHTML = `<button class="btn btn-primary" id="followBtn">${i18n.t('users.follow') || 'Seguir'}</button>`;
    document.getElementById('followBtn').addEventListener('click', handleFollow);
  }
}

async function handleFollow() {
  try {
    const response = await fetch(`${API_URL}/user/${viewingUserId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId: currentUser.id })
    });
    if (!response.ok) throw new Error('Error al seguir');
    
    isFollowing = true;
    renderFollowButton();
    // Actualizar contador de seguidores
    const followersCountEl = document.getElementById('followersCount');
    followersCountEl.textContent = parseInt(followersCountEl.textContent) + 1;
  } catch (error) {
    alert(error.message);
  }
}

async function handleUnfollow() {
  try {
    const response = await fetch(`${API_URL}/user/${viewingUserId}/unfollow`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId: currentUser.id })
    });
    if (!response.ok) throw new Error('Error al dejar de seguir');

    isFollowing = false;
    renderFollowButton();
    // Actualizar contador de seguidores
    const followersCountEl = document.getElementById('followersCount');
    followersCountEl.textContent = parseInt(followersCountEl.textContent) - 1;
  } catch (error) {
    alert(error.message);
  }
}

function renderUserRecipes() {
  const container = document.getElementById('userRecipesContainer');
  
  if (userRecipes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🍳</div>
        <p class="empty-state-text">${i18n.t('recipe.noPublicRecipes') || 'Este usuario no tiene recetas públicas.'}</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = userRecipes.map(recipe => `
    <div class="recipe-card">
      ${recipe.image_url ? 
        `<div class="recipe-card-image" style="background-image: url('${recipe.image_url}')"></div>` :
        `<div class="recipe-card-image" style="background-image: url('https://via.placeholder.com/300x200?text=Receta')"></div>`
      }
      <div class="recipe-content">
        <h3 class="recipe-title">${recipe.title}</h3>
        <span class="recipe-category">${i18n.t(`categories.${recipe.category}`)}</span>
        <p class="recipe-description">${recipe.description || ''}</p>
        <div class="recipe-meta">
          ${recipe.servings ? `<span>👥 ${recipe.servings} ${recipe.servings === 1 ? i18n.t('recipe.serving') : i18n.t('recipe.servingsPlural')}</span>` : ''}
          ${recipe.prepTime ? `<span>⏱️ ${recipe.prepTime} ${i18n.t('recipe.prepTimeSuffix')}</span>` : ''}
          ${recipe.cookTime ? `<span>🔥 ${recipe.cookTime} ${i18n.t('recipe.cookTimeSuffix')}</span>` : ''}
        </div>
        <div class="recipe-actions">
          <button class="btn btn-primary btn-sm" onclick="openRecipeDetailById(${recipe.id})">
            ${i18n.t('recipe.viewDetail') || 'Ver Detalle'}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function openRecipeDetailById(recipeId) {
  const recipe = userRecipes.find(r => r.id === recipeId);
  if (recipe) {
    openRecipeDetail(recipe);
  }
}

function openRecipeDetail(recipe) {
  const modal = document.getElementById('recipeDetailModal');
  const title = document.getElementById('recipeDetailTitle');
  const content = document.getElementById('recipeDetailContent');
  
  title.textContent = recipe.title;
  
  const ingredientsList = recipe.ingredients.split('\n').filter(i => i.trim()).map(i => `<li>${i}</li>`).join('');
  const instructionsList = recipe.instructions.split('\n').filter(i => i.trim()).map(i => `<li>${i}</li>`).join('');
  
  content.innerHTML = `
    ${recipe.image_url ? `<div class="recipe-card-image" style="height: 250px; background-image: url('${recipe.image_url}'); margin-bottom: 1.5rem;"></div>` : ''}
    
    <div style="margin-bottom: 1.5rem;">
      <span class="recipe-category">${i18n.t(`categories.${recipe.category}`)}</span>
      ${recipe.description ? `<p style="margin-top: 1rem; color: var(--gray-color);">${recipe.description}</p>` : ''}
    </div>
    
    <div class="recipe-meta" style="margin-bottom: 2rem;">
      ${recipe.servings ? `<span>👥 ${recipe.servings} ${recipe.servings === 1 ? i18n.t('recipe.serving') : i18n.t('recipe.servingsPlural')}</span>` : ''}
      ${recipe.prepTime ? `<span>⏱️ ${recipe.prepTime} ${i18n.t('recipe.prepTimeSuffix')}</span>` : ''}
      ${recipe.cookTime ? `<span>🔥 ${recipe.cookTime} ${i18n.t('recipe.cookTimeSuffix')}</span>` : ''}
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

function closeRecipeDetail() {
  const modal = document.getElementById('recipeDetailModal');
  modal.classList.remove('active');
}