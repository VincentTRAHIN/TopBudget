export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const loginEndpoint = `${API_BASE_URL}/auth/connexion`;
export const registerEndpoint = `${API_BASE_URL}/auth/inscription`;
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
export const searchUserEndpoint = `${API_BASE_URL}/users/search`;
export const syntheseMensuelleEndpoint = `${API_BASE_URL}/statistiques/synthese-mensuelle`;
export const revenusEndpoint = `${API_BASE_URL}/revenus`;
export const soldeMensuelEndpoint = `${API_BASE_URL}/statistiques/solde-mensuel`;
export const importRevenusEndpoint = `${API_BASE_URL}/revenus/import`;
export const categoriesRevenuEndpoint = `${API_BASE_URL}/categories-revenu`;
export const statistiquesRevenusParCategorieEndpoint = `${API_BASE_URL}/statistiques/revenus-par-categorie`;
export const importEndpoint = `${API_BASE_URL}/import`;
