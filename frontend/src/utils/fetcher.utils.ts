const fetcher = async (url: string, options: RequestInit = {}) => {
  // Récupérer le token depuis localStorage au moment de l'appel
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const isAuthMeEndpoint = url.includes('/auth/me');

  // Préparer les headers
  // Ne pas réutiliser options.headers directement car Headers est immutable
  const headers = new Headers();

  // Ajouter Content-Type par défaut si un body est présent et Content-Type n'est pas déjà défini
  if (
    options.body &&
    !(
      options.headers instanceof Headers && options.headers.has('Content-Type')
    ) &&
    !(typeof options.headers === 'object' && 'Content-Type' in options.headers)
  ) {
    headers.append('Content-Type', 'application/json');
  }
  // Copier les headers existants passés en option
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (value) headers.append(key, value);
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
        if (isAuthMeEndpoint && !token) {
          // C'est un check initial normal, on peut juste logguer en info ou debug, ou pas du tout
          console.log(
            `fetcher: Tentative d'accès à ${url} sans token (normal si non connecté). Statut: ${response.status}`,
          );
        } else {
          // C'est un 401 potentiellement problématique (token expiré/invalide ou accès interdit)
          console.error(
            `fetcher: Accès non autorisé (401) sur ${url}. Token présent: ${!!token}`,
          );
        }
      } else {
        // Logguer les autres erreurs HTTP
        console.error(
          `fetcher: Erreur HTTP ${response.status} sur ${url}: ${errorMessage}`,
        );
      }

      // Créer une erreur pour SWR ou le code appelant
      const error: Error & { status?: number; info?: unknown } = new Error(
        errorMessage,
      );
      error.status = response.status; // Attacher le statut à l'erreur
      error.info = errorData; // Attacher les détails de l'erreur du backend
      throw error;
    }

    // Gérer les réponses sans contenu (ex: 204 No Content pour un DELETE réussi)
    if (
      response.status === 204 ||
      response.headers.get('content-length') === '0'
    ) {
      return undefined; // Retourner undefined ou null pour indiquer l'absence de corps
    }
    return response.json();
  } catch (error) {
    // Log général si fetch échoue (ex: réseau) ou si une erreur est re-lancée
    if (!(error instanceof Error && (error as { status?: number }).status === 401 && isAuthMeEndpoint && !token)) {
      console.error(`Erreur lors du fetch vers ${url}:`, error);
   }
   throw error; // Toujours relancer pour SWR
  }
};

export default fetcher;
