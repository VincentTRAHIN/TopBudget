const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const loginEndpoint = `${API_BASE_URL}/auth/login`;
export const registerEndpoint = `${API_BASE_URL}/auth/register`;
export const meEndpoint = `${API_BASE_URL}/auth/me`;
export const depensesEndpoint = `${API_BASE_URL}/depenses`;
export const categoriesEndpoint = `${API_BASE_URL}/categories`;
export const statistiquesEndpoint = `${API_BASE_URL}/statistiques`;
