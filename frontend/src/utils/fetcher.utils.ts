
const fetcher = async (url: string, options: RequestInit = {}) => {
  // Récupérer le token depuis localStorage au moment de l'appel
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  // Préparer les headers
  // Ne pas réutiliser options.headers directement car Headers est immutable
  const headers = new Headers();

  // Ajouter Content-Type par défaut si un body est présent et Content-Type n'est pas déjà défini
  if (options.body && !(options.headers instanceof Headers && options.headers.has('Content-Type')) && !(typeof options.headers === 'object' && 'Content-Type' in options.headers)) {
    headers.append('Content-Type', 'application/json');
  }
  // Copier les headers existants passés en option
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
       if(value) headers.append(key, value);
    });
  }


  // Ajouter le token si trouvé
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  // Construire les options finales pour fetch
  const fetchOptions: RequestInit = {
    ...options, // Garde les options passées (ex: method, body)
    headers,
    // Important: Ne PAS envoyer 'include' si on gère le token manuellement via Authorization header.
    // 'omit' est la valeur par défaut et évite les conflits/erreurs CORS liées aux credentials.
    credentials: 'omit',
  };

  try {
      const response = await fetch(url, fetchOptions);

      // Gestion des erreurs HTTP
      if (!response.ok) {
        let errorMessage = `Erreur HTTP ${response.status}`;
        let errorData = null;
        try {
          // Essayer de lire le message d'erreur du backend
          errorData = await response.json();
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
          // Si le corps n'est pas du JSON ou est vide, utiliser le statusText
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }

        // Si 401 Unauthorized, log spécifique
        if (response.status === 401) {
           console.error("Accès non autorisé (401). Token invalide, manquant ou expiré?");
           // Ne pas déconnecter automatiquement ici, laisser SWR/useAuth gérer via onError
        }

        // Créer une erreur pour SWR ou le code appelant
        const error: Error & { status?: number; info?: unknown } = new Error(errorMessage);
        error.status = response.status; // Attacher le statut à l'erreur
        error.info = errorData; // Attacher les détails de l'erreur du backend
        throw error;
      }

      // Gérer les réponses sans contenu (ex: 204 No Content pour un DELETE réussi)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
         return undefined; // Retourner undefined ou null pour indiquer l'absence de corps
      }
      return response.json();

  } catch (error) {
      console.error(`Erreur lors du fetch vers ${url}:`, error);
      // Renvoyer l'erreur pour que SWR ou le .catch() puisse la traiter
      throw error;
  }
};

export default fetcher;