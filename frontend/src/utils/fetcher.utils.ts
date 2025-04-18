const fetcher = async (url: string, options: RequestInit = {}) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const isAuthMeEndpoint = url.includes('/auth/me');

  const headers = new Headers();

  if (
    options.body &&
    !(
      options.headers instanceof Headers && options.headers.has('Content-Type')
    ) &&
    !(typeof options.headers === 'object' && 'Content-Type' in options.headers)
  ) {
    headers.append('Content-Type', 'application/json');
  }

  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (value) headers.append(key, value);
    });
  }

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'omit',
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}`;
      let errorData = null;
      try {
        errorData = await response.json();
        errorMessage = errorData.message || JSON.stringify(errorData);
      } catch {
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }

      if (response.status === 401) {
        if (isAuthMeEndpoint && !token) {
          console.log(
            `fetcher: Tentative d'accès à ${url} sans token (normal si non connecté). Statut: ${response.status}`,
          );
        } else {
          console.error(
            `fetcher: Accès non autorisé (401) sur ${url}. Token présent: ${!!token}`,
          );
        }
      } else {
        console.error(
          `fetcher: Erreur HTTP ${response.status} sur ${url}: ${errorMessage}`,
        );
      }

      const error: Error & { status?: number; info?: unknown } = new Error(
        errorMessage,
      );
      error.status = response.status;
      error.info = errorData;
      throw error;
    }

    if (
      response.status === 204 ||
      response.headers.get('content-length') === '0'
    ) {
      return undefined;
    }
    return response.json();
  } catch (error) {
    if (!(error instanceof Error && (error as { status?: number }).status === 401 && isAuthMeEndpoint && !token)) {
      console.error(`Erreur lors du fetch vers ${url}:`, error);
   }
   throw error;
  }
};

export default fetcher;
