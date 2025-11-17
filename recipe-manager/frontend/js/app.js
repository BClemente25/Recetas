const API_URL = 'http://localhost:3000/api';
//const NUTRITION_API = 'https://api.edamam.com/api/nutrition-data';
//const NUTRITION_APP_ID = 'cf1bf272'; // Demo App ID
//const NUTRITION_APP_KEY = '645cada1dc89d2ee5ccf008ec99c026d'; // Demo API Key

let currentUser = null;
let recipes = [];
let editingRecipeId = null;

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
      loadRecipes(); // Recargar recetas para actualizar categorías
    });
  });
  
  // Set active language button
  const currentLang = i18n.getCurrentLang();
  document.querySelector(`[data-lang="${currentLang}"]`).classList.add('active');
  
  // Cargar recetas
  await loadRecipes();
  
  // Event listeners
  setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });
  
  // Add recipe button
  document.getElementById('addRecipeBtn').addEventListener('click', () => {
    openModal();
  });
  
  // Close modal
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  
  // Recipe form submit
  document.getElementById('recipeForm').addEventListener('submit', handleRecipeSubmit);
  
  // Nutrition search
  document.getElementById('searchNutritionBtn').addEventListener('click', searchNutrition);
  document.getElementById('nutritionSearch').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchNutrition();
    }
  });
  
  // Close modal when clicking outside
  document.getElementById('recipeModal').addEventListener('click', (e) => {
    if (e.target.id === 'recipeModal') {
      closeModal();
    }
  });
}

// Cargar recetas del usuario
async function loadRecipes() {
  try {
    const response = await fetch(`${API_URL}/recipes/${currentUser.id}`);
    recipes = await response.json();
    renderRecipes();
  } catch (error) {
    showError(i18n.t('messages.error'));
  }
}

// Renderizar recetas
function renderRecipes() {
  const container = document.getElementById('recipesContainer');
  
  if (recipes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🍳</div>
        <p class="empty-state-text" data-i18n="recipe.noRecipes">${i18n.t('recipe.noRecipes')}</p>
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
        <h3 class="recipe-title">${recipe.title}</h3>
        <h3 class="recipe-title">
        ${recipe.title}
        ${recipe.is_public ? '<span class="public-badge">🌍 Público</span>' : '<span class="private-badge">🔒 Privado</span>'}
        </h3>
        <span class="recipe-category">${i18n.t(`categories.${recipe.category}`)}</span>
        <p class="recipe-description">${recipe.description || ''}</p>
        <div class="recipe-meta">
          ${recipe.servings ? `<span>👥 ${recipe.servings} ${recipe.servings === 1 ? 'porción' : 'porciones'}</span>` : ''}
          ${recipe.prep_time ? `<span>⏱️ ${recipe.prep_time} min prep</span>` : ''}
          ${recipe.cook_time ? `<span>🔥 ${recipe.cook_time} min cocción</span>` : ''}
        </div>
        <div class="recipe-actions">
          <button class="btn btn-secondary btn-sm" onclick="editRecipe(${recipe.id})" data-i18n="recipe.edit">
            ${i18n.t('recipe.edit')}
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteRecipe(${recipe.id})" data-i18n="recipe.delete">
            ${i18n.t('recipe.delete')}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Abrir modal
function openModal(recipe = null) {
  document.getElementById('recipeIsPublic').checked = recipe ? recipe.is_public : true;
  const modal = document.getElementById('recipeModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('recipeForm');
  
  if (recipe) {
    // Editar receta
    editingRecipeId = recipe.id;
    modalTitle.textContent = i18n.t('recipe.editRecipe');
    document.getElementById('recipeId').value = recipe.id;
    document.getElementById('recipeTitle').value = recipe.title;
    document.getElementById('recipeCategory').value = recipe.category;
    document.getElementById('recipeDescription').value = recipe.description || '';
    document.getElementById('recipeIngredients').value = recipe.ingredients;
    document.getElementById('recipeInstructions').value = recipe.instructions;
    document.getElementById('recipeServings').value = recipe.servings || 1;
    document.getElementById('recipePrepTime').value = recipe.prep_time || '';
    document.getElementById('recipeCookTime').value = recipe.cook_time || '';
    document.getElementById('recipeImageUrl').value = recipe.image_url || '';
  } else {
    // Nueva receta
    editingRecipeId = null;
    modalTitle.textContent = i18n.t('recipe.addRecipe');
    form.reset();
    document.getElementById('recipeId').value = '';
  }
  
  modal.classList.add('active');
}

// Cerrar modal
function closeModal() {
  const modal = document.getElementById('recipeModal');
  modal.classList.remove('active');
  editingRecipeId = null;
}

// Manejar envío de formulario
async function handleRecipeSubmit(e) {
  e.preventDefault();
  
  const recipeData = {
    user_id: currentUser.id,
    title: document.getElementById('recipeTitle').value,
    category: document.getElementById('recipeCategory').value,
    description: document.getElementById('recipeDescription').value,
    ingredients: document.getElementById('recipeIngredients').value,
    instructions: document.getElementById('recipeInstructions').value,
    servings: parseInt(document.getElementById('recipeServings').value) || 1,
    prep_time: parseInt(document.getElementById('recipePrepTime').value) || null,
    cook_time: parseInt(document.getElementById('recipeCookTime').value) || null,
    image_url: document.getElementById('recipeImageUrl').value,
    is_public: document.getElementById('recipeIsPublic').checked ? 1 : 0
  };
  
  try {
    let response;
    
    if (editingRecipeId) {
      // Actualizar receta existente
      response = await fetch(`${API_URL}/recipes/${editingRecipeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recipeData)
      });
      
      if (response.ok) {
        showSuccess(i18n.t('messages.recipeUpdated'));
      }
    } else {
      // Crear nueva receta
      response = await fetch(`${API_URL}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recipeData)
      });
      
      if (response.ok) {
        showSuccess(i18n.t('messages.recipeCreated'));
      }
    }
    
    if (response.ok) {
      closeModal();
      await loadRecipes();
    } else {
      const data = await response.json();
      showError(data.error);
    }
  } catch (error) {
    showError(i18n.t('messages.error'));
  }
}

// Editar receta
function editRecipe(id) {
  const recipe = recipes.find(r => r.id === id);
  if (recipe) {
    openModal(recipe);
  }
}

// Eliminar receta
async function deleteRecipe(id) {
  if (!confirm(i18n.t('recipe.confirmDelete'))) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/recipes/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showSuccess(i18n.t('messages.recipeDeleted'));
      await loadRecipes();
    } else {
      showError(i18n.t('messages.error'));
    }
  } catch (error) {
    showError(i18n.t('messages.error'));
  }
}

// Buscar información nutricional
// Buscar información nutricional con API Ninjas
async function searchNutrition() {
  const ingredient = document.getElementById('nutritionSearch').value.trim();
  
  if (!ingredient) {
    return;
  }
  
  const resultsDiv = document.getElementById('nutritionResults');
  resultsDiv.innerHTML = '<p style="text-align: center;">Buscando...</p>';
  
  try {
    const API_KEY = '3mUSVcY17efu4hshJZjSkg==D9C6O8zmA3IUS7vn'; // Obtener de https://api-ninjas.com/api/nutrition
    const url = `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(ingredient)}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error('Error en la API');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const food = data[0];
      
      resultsDiv.innerHTML = `
        <div class="nutrition-card">
          <div class="nutrition-label" data-i18n="nutrition.calories">${i18n.t('nutrition.calories')}</div>
          <div class="nutrition-value">${Math.round(food.calories || 0)}</div>
          <div class="nutrition-label">por ${food.serving_size_g}g</div>
        </div>
        <div class="nutrition-card">
          <div class="nutrition-label" data-i18n="nutrition.protein">${i18n.t('nutrition.protein')}</div>
          <div class="nutrition-value">${Math.round(food.protein_g || 0)}g</div>
        </div>
        <div class="nutrition-card">
          <div class="nutrition-label" data-i18n="nutrition.carbs">${i18n.t('nutrition.carbs')}</div>
          <div class="nutrition-value">${Math.round(food.carbohydrates_total_g || 0)}g</div>
        </div>
        <div class="nutrition-card">
          <div class="nutrition-label" data-i18n="nutrition.fat">${i18n.t('nutrition.fat')}</div>
          <div class="nutrition-value">${Math.round(food.fat_total_g || 0)}g</div>
        </div>
        <div class="nutrition-card">
          <div class="nutrition-label" data-i18n="nutrition.fiber">${i18n.t('nutrition.fiber')}</div>
          <div class="nutrition-value">${Math.round(food.fiber_g || 0)}g</div>
        </div>
      `;
    } else {
      resultsDiv.innerHTML = `
        <p style="text-align: center; color: var(--gray-color);">
          No se encontró información nutricional para "${ingredient}". 
          <br>Intenta con: "apple", "chicken breast", "1 cup rice"
        </p>`;
    }
  } catch (error) {
    console.error('Error:', error);
    resultsDiv.innerHTML = `
      <p style="text-align: center; color: var(--danger-color);">
        Error al buscar información nutricional.
      </p>`;
  }
}

// Mostrar mensaje de éxito
function showSuccess(message) {
  const alert = document.getElementById('successAlert');
  alert.textContent = message;
  alert.classList.add('show');
  setTimeout(() => {
    alert.classList.remove('show');
  }, 3000);
}

// Mostrar mensaje de error
function showError(message) {
  const alert = document.getElementById('errorAlert');
  alert.textContent = message;
  alert.classList.add('show');
  setTimeout(() => {
    alert.classList.remove('show');
  }, 3000);
}