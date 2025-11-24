const API_URL = 'http://localhost:3000/api';

let currentUser = null;
let recipes = [];
let editingRecipeId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    window.location.href = 'index.html';
    return;
  }
  
  currentUser = JSON.parse(userStr);
  
  await i18n.init();
  
  document.getElementById('userWelcome').textContent = `👋 ${currentUser.username}`;
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      i18n.changeLanguage(btn.dataset.lang);
      loadRecipes();
    });
  });
  
  const currentLang = i18n.getCurrentLang();
  document.querySelector(`[data-lang="${currentLang}"]`).classList.add('active');
  
  await loadRecipes();
  
  setupEventListeners();
  loadUserStats();
  loadUserAvatar();
});

function setupEventListeners() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });
  
  document.getElementById('addRecipeBtn').addEventListener('click', () => {
    openModal();
  });
  
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  
  document.getElementById('recipeForm').addEventListener('submit', handleRecipeSubmit);
  
  document.getElementById('searchNutritionBtn').addEventListener('click', searchNutrition);
  document.getElementById('nutritionSearch').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchNutrition();
    }
  });
  
  document.getElementById('recipeModal').addEventListener('click', (e) => {
    if (e.target.id === 'recipeModal') {
      closeModal();
    }
  });

  document.getElementById('editAvatarBtn').addEventListener('click', () => {
    document.getElementById('avatarUploadInput').click();
  });
  document.getElementById('avatarUploadInput').addEventListener('change', (e) => {
    handleAvatarUpload(e.target.files[0]);
  });
}

async function loadRecipes() {
  try {
    const response = await fetch(`${API_URL}/recipes/${currentUser.id}`);
    recipes = await response.json();
    renderRecipes();
  } catch (error) {
    showError(i18n.t('messages.error'));
  }
}

async function loadUserStats() {
  try {
    const followersRes = await fetch(`${API_URL}/user/${currentUser.id}/followers`);
    const followersData = await followersRes.json();
    document.getElementById('followersCount').textContent = followersData.length;

    const followingRes = await fetch(`${API_URL}/user/${currentUser.id}/following`);
    const followingData = await followingRes.json();
    document.getElementById('followingCount').textContent = followingData.length;
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

function loadUserAvatar() {
  const avatarUrl = currentUser.avatar_url;
  const avatarElement = document.getElementById('dashboardAvatar');
  avatarElement.style.backgroundImage = `url('${avatarUrl || 'https://via.placeholder.com/100?text=' + currentUser.username.charAt(0)}')`;
}

async function handleAvatarUpload(file) {
  if (!file) return;

  const formData = new FormData();
  formData.append('recipeImage', file); // Reutilizamos el nombre del campo de la API de subida

  try {
    // 1. Subir la imagen
    const uploadResponse = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!uploadResponse.ok) throw new Error('Error al subir la imagen.');
    const uploadData = await uploadResponse.json();
    const newAvatarUrl = `http://localhost:3000${uploadData.imageUrl}`;

    // 2. Actualizar la URL del avatar en el perfil del usuario
    const updateUserResponse = await fetch(`${API_URL}/user/${currentUser.id}/avatar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: newAvatarUrl })
    });
    if (!updateUserResponse.ok) throw new Error('Error al actualizar el perfil.');

    // 3. Actualizar localmente
    currentUser.avatar_url = newAvatarUrl;
    localStorage.setItem('user', JSON.stringify(currentUser));
    loadUserAvatar();
    showSuccess('Avatar actualizado exitosamente.');
  } catch (error) {
    showError(error.message);
  }
}

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
          ${recipe.servings ? `<span>👥 ${recipe.servings} ${recipe.servings === 1 ? i18n.t('recipe.serving') : i18n.t('recipe.servingsPlural')}</span>` : ''}
          ${recipe.prepTime ? `<span>⏱️ ${recipe.prepTime} ${i18n.t('recipe.prepTimeSuffix')}</span>` : ''}
          ${recipe.cookTime ? `<span>🔥 ${recipe.cookTime} ${i18n.t('recipe.cookTimeSuffix')}</span>` : ''}
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

function openModal(recipe = null) {
  document.getElementById('recipeIsPublic').checked = recipe ? recipe.is_public : true;
  const modal = document.getElementById('recipeModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('recipeForm');
  
  if (recipe) {
    editingRecipeId = recipe.id;
    modalTitle.textContent = i18n.t('recipe.editRecipe');
    document.getElementById('recipeId').value = recipe.id;
    document.getElementById('recipeTitle').value = recipe.title;
    document.getElementById('recipeCategory').value = recipe.category;
    document.getElementById('recipeDescription').value = recipe.description || '';
    document.getElementById('recipeIngredients').value = recipe.ingredients;
    document.getElementById('recipeInstructions').value = recipe.instructions;
    document.getElementById('recipeServings').value = recipe.servings || 1;
    document.getElementById('recipePrepTime').value = recipe.prepTime || '';
    document.getElementById('recipeCookTime').value = recipe.cookTime || '';
    document.getElementById('recipeImageFile').value = ''; // Limpiar el input de archivo
    document.getElementById('recipeImageUrl').value = recipe.image_url || ''; // Guardar la URL existente
  } else {
    editingRecipeId = null;
    modalTitle.textContent = i18n.t('recipe.addRecipe');
    form.reset();
    document.getElementById('recipeId').value = '';
  }
  
  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('recipeModal');
  modal.classList.remove('active');
  editingRecipeId = null;
}

async function handleRecipeSubmit(e) {
  e.preventDefault();
  
  const imageFile = document.getElementById('recipeImageFile').files[0];
  let imageUrl = document.getElementById('recipeImageUrl').value;

  // 1. Si hay un archivo nuevo, subirlo primero
  if (imageFile) {
    const formData = new FormData();
    formData.append('recipeImage', imageFile);

    try {
      const uploadResponse = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir la imagen.');
      }

      const uploadData = await uploadResponse.json();
      imageUrl = `http://localhost:3000${uploadData.imageUrl}`; // Guardar la URL completa
    } catch (error) {
      showError(error.message);
      return; // Detener si la subida falla
    }
  }

  const recipeData = {
    user_id: currentUser.id,
    title: document.getElementById('recipeTitle').value,
    category: document.getElementById('recipeCategory').value,
    description: document.getElementById('recipeDescription').value,
    ingredients: document.getElementById('recipeIngredients').value,
    instructions: document.getElementById('recipeInstructions').value,
    servings: parseInt(document.getElementById('recipeServings').value) || 1,
    prepTime: parseInt(document.getElementById('recipePrepTime').value) || null,
    cookTime: parseInt(document.getElementById('recipeCookTime').value) || null,
    image_url: imageUrl, // Usar la URL de la imagen (nueva o existente)
    is_public: document.getElementById('recipeIsPublic').checked ? 1 : 0
  };
  
  try {
    let response;
    
    if (editingRecipeId) {
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

function editRecipe(id) {
  const recipe = recipes.find(r => r.id === id);
  if (recipe) {
    openModal(recipe);
  }
}

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

async function searchNutrition() {
  const ingredient = document.getElementById('nutritionSearch').value.trim();
  
  if (!ingredient) {
    return;
  }
  
  const resultsDiv = document.getElementById('nutritionResults');
  resultsDiv.innerHTML = '<p style="text-align: center;">Buscando...</p>';
  
  try {
    const API_KEY = '3mUSVcY17efu4hshJZjSkg==D9C6O8zmA3IUS7vn';
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

function showSuccess(message) {
  const alert = document.getElementById('successAlert');
  alert.textContent = message;
  alert.classList.add('show');
  setTimeout(() => {
    alert.classList.remove('show');
  }, 3000);
}

function showError(message) {
  const alert = document.getElementById('errorAlert');
  alert.textContent = message;
  alert.classList.add('show');
  setTimeout(() => {
    alert.classList.remove('show');
  }, 3000);
}