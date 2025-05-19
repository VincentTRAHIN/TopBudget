const fetcher = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const isAuthMeEndpoint = url.includes('/auth/me');

  if (!isAuthMeEndpoint) {
    console.log(
      `[DEBUG] Fetcher appelé pour ${url} avec token: ${token ? 'présent' : 'absent'}`,
    );
  }

  const headers = new Headers();

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !(
      options.headers instanceof Headers && options.headers.has('Content-Type')
    ) &&
    !(
      typeof options.headers === 'object' &&
      options.headers &&
      'Content-Type' in options.headers
    )
  ) {
    headers.append('Content-Type', 'application/json');
  }

  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (
        !(
          options.body instanceof FormData &&
          key.toLowerCase() === 'content-type'
        )
      ) {
        if (value) headers.append(key, value);
      }
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

          if (!isAuthMeEndpoint && token) {
            console.warn('Problème de token, tentative de nettoyage...');
            if (typeof window !== 'undefined') {
              localStorage.removeItem('authToken');
              setTimeout(() => {
                window.location.href = '/auth/login';
              }, 100);
            }
          }
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
      return undefined as T;
    }

    const responseData = await response.json();

    if (
      responseData &&
      responseData.success === true &&
      'data' in responseData
    ) {
      console.log(
        `[DEBUG] Extraction des données de la réponse encapsulée pour ${url}`,
      );
      return responseData.data as T;
    }

    return responseData;
  } catch (error) {
    if (
      !(
        error instanceof Error &&
        (error as { status?: number }).status === 401 &&
        isAuthMeEndpoint &&
        !token
      )
    ) {
      console.error(`Erreur lors du fetch vers ${url}:`, error);
    }
    throw error;
  }
};

/**
 * Wrapper autour de useSWR qui gère les erreurs 404 et les données manquantes de manière cohérente
 */
export const createSafeDataFetcher = <T>(
  defaultValue: T,
  errorHandler?: (error: any) => void,
) => {
  return async (url: string) => {
    try {
      const result = await fetcher(url);
      return result || defaultValue;
    } catch (error: any) {
      console.error(
        `Erreur lors du chargement des données depuis ${url}:`,
        error,
      );

      if (errorHandler) {
        errorHandler(error);
      }

      if (error.status === 404) {
        console.warn(
          `Route non trouvée (404) pour ${url} - utilisation de la valeur par défaut`,
          defaultValue,
        );
        return defaultValue;
      }

      throw error;
    }
  };
};

export default fetcher;
