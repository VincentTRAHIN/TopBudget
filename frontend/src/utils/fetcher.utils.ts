const fetcher = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const isAuthMeEndpoint = url.includes('/auth/me');

  if (!isAuthMeEndpoint) {
   
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
          
        } else {
          

          if (!isAuthMeEndpoint && token) {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('authToken');
              setTimeout(() => {
                window.location.href = '/auth/login';
              }, 100);
            }
          }
        }
      } else {
        
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
    }
    throw error;
  }
};

interface APIError extends Error {
  status?: number;
  info?: unknown;
  message: string;
}

/**
 * Wrapper autour de useSWR qui gère les erreurs 404 et les données manquantes de manière cohérente
 */
export const createSafeDataFetcher = <T>(
  defaultValue: T,
  errorHandler?: (error: APIError) => void,
) => {
  return async (url: string) => {
    try {
      const result = await fetcher<T>(url);
      return result || defaultValue;
    } catch (error) {
      const apiError = error as APIError;

      if (errorHandler) {
        errorHandler(apiError);
      }

      if (apiError.status === 404) {
        return defaultValue;
      }

      throw apiError;
    }
  };
};

export default fetcher;
