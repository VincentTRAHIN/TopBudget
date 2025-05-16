export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const loginEndpoint = `${API_BASE_URL}/auth/login`;
export const registerEndpoint = `${API_BASE_URL}/auth/register`;
export const meEndpoint = `${API_BASE_URL}/auth/me`;
export const depensesEndpoint = `${API_BASE_URL}/depenses`;
export const categoriesEndpoint = `${API_BASE_URL}/categories`;
export const statistiquesEndpoint = `${API_BASE_URL}/statistiques`;
export const importDepensesEndpoint = `${API_BASE_URL}/depenses/import`;
export const evolutionMensuelleEndpoint = `${API_BASE_URL}/statistiques/evolution-mensuelle`;
export const comparaisonMoisEndpoint = `${API_BASE_URL}/statistiques/comparaison-mois`;
export const statistiquesParCategorieEndpoint = `${API_BASE_URL}/statistiques/par-categorie`;
export const totalMensuelEndpoint = `${API_BASE_URL}/statistiques/total-mensuel`;
export const profileAvatarEndpoint = `${API_BASE_URL}/profile/avatar`;
export const profileChangePasswordEndpoint = `${API_BASE_URL}/profile/me/change-password`;
export const profileUpdateEndpoint = `${API_BASE_URL}/profile`;
