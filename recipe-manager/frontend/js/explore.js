const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let publicRecipes = []; // Guardar las recetas para el modal

// --- 1. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
  currentUser = JSON.parse(localStorage.getItem('user'));
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }
  await i18n.init();

  document.getElementById('userWelcome').textContent = `👋 ${currentUser.username}`;
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });

  // Configurar todos los event listeners de la página
  setupLanguageSelector();
  setupTabs();
  setupSearch();
  setupModal();
  
  // Cargar el contenido inicial
  loadPublicRecipes();
});

// --- 2. CONFIGURACIÓN DE EVENTOS ---
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
      // Podríamos recargar el contenido si tuviera texto dinámico
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

function setupSearch() {
  document.getElementById('userSearchBtn').addEventListener('click', searchUsers);
  document.getElementById('userSearchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchUsers();
    }
  });
}

function setupModal() {
  document.getElementById('closeDetailModalBtn').addEventListener('click', closeRecipeDetail);
  document.getElementById('closeDetailBtn').addEventListener('click', closeRecipeDetail);
  
  document.getElementById('recipeDetailModal').addEventListener('click', (e) => {
    if (e.target.id === 'recipeDetailModal') {
      closeRecipeDetail();
    }
  });
}

// --- 3. LÓGICA DE CARGA DE DATOS ---

/**
 * Carga y muestra todas las recetas públicas del feed.
 */
async function loadPublicRecipes() {
  const container = document.getElementById('publicRecipesContainer');
  container.innerHTML = `<p>${i18n.t('messages.loading') || 'Cargando...'}</p>`;

  try {
    const response = await fetch(`${API_URL}/user/feed/public`);
    if (!response.ok) throw new Error(i18n.t('messages.errorRecipes'));
    publicRecipes = await response.json(); // Guardar en la variable global
    if (publicRecipes.length === 0) {
      container.innerHTML = `<p>${i18n.t('recipe.noRecipes')}</p>`;
      return;
    }

    container.innerHTML = '';
    publicRecipes.forEach(recipe => {
      const recipeCard = document.createElement('div');
      recipeCard.className = 'recipe-card';
      recipeCard.innerHTML = `
        ${recipe.image_url ? 
          `<img src="${recipe.image_url}" alt="${recipe.title}" class="recipe-image" onerror="this.src='https://via.placeholder.com/300x200?text=Receta'">` :
          `<div class="recipe-image-placeholder">🍳</div>`
        }
        <div class="recipe-content">
          <h3>${recipe.title}</h3>
          <span class="recipe-category">${i18n.t(`categories.${recipe.category}`)}</span>          
          <div class="recipe-meta">
            ${recipe.prepTime ? `<span>⏱️ ${recipe.prepTime} min</span>` : ''}
            ${recipe.cookTime ? `<span>🔥 ${recipe.cookTime} min</span>` : ''}
          </div>
          <div class="recipe-author">
            <div class="author-avatar" style="background-image: url('${recipe.avatar_url || 'https://via.placeholder.com/100?text=' + recipe.username.charAt(0)}')"></div>
            <a href="user-profile.html?id=${recipe.user_id}">
              <span>${i18n.t('recipe.by')}</span>
              ${recipe.username}
            </a>
          </div>
          <div class="recipe-actions" style="margin-top: 1rem;">
            <button class="btn btn-primary btn-sm" onclick="openRecipeDetailById(${recipe.id})">${i18n.t('recipe.viewDetail')}</button>
          </div>
        </div>
      `;
      container.appendChild(recipeCard);
    });
  } catch (error) {
    container.innerHTML = `<p class="alert alert-error">${error.message}</p>`;
  }
}

/**
 * Busca usuarios por su nombre y muestra los resultados.
 */
async function searchUsers() {
  const query = document.getElementById('userSearchInput').value;
  const resultsContainer = document.getElementById('userSearchResults');

  if (query.length < 2) {
    resultsContainer.innerHTML = `<p>${i18n.t('users.searchHint') || 'Ingresa al menos 2 caracteres para buscar.'}</p>`;
    return;
  }

  try {
    const response = await fetch(`${API_URL}/user/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(i18n.t('messages.errorUsers'));

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
        <div class="user-avatar" style="background-image: url('${user.avatar_url || 'https://via.placeholder.com/100?text=' + user.username.charAt(0)}');"></div>
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

// --- 4. LÓGICA DEL MODAL ---

function openRecipeDetailById(recipeId) {
  const recipe = publicRecipes.find(r => r.id === recipeId);
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
    ${recipe.image_url ? `<img src="${recipe.image_url}" alt="${recipe.title}" style="width: 100%; border-radius: 10px; margin-bottom: 1.5rem;" onerror="this.style.display='none'">` : ''}
    
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