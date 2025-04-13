// URLs de base
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

// Endpoints Auth
export const loginUser = `${API_URL}/auth/login`;
export const registerUser = `${API_URL}/auth/register`;
export const getMeEndpoint = `${API_URL}/auth/me`;

// Endpoints Dépenses
export const depensesEndpoint = `${API_URL}/depenses`;

// Endpoints Catégories
export const categoriesEndpoint = `${API_URL}/categories`;

// Endpoints Statistiques
export const statistiquesEndpoint = `${API_URL}/statistiques`;
