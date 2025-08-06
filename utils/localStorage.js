export const getSafeLocalStorage = (key) => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const storedValue = localStorage.getItem(key);
  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`Error parsing JSON from localStorage for key: ${key}`, error);
    return null;
  }
}; 