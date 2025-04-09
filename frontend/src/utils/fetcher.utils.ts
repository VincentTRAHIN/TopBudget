const fetcher = async (url: string) => {
    const response = await fetch(url, {
      credentials: "include",
    });
  
    if (!response.ok) {
      const error = new Error('Une erreur est survenue lors du fetch.');
      throw error;
    }
  
    return response.json();
  };
  
  export default fetcher;
  