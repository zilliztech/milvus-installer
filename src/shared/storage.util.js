export const setStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const checkStorage = (key) => {
  const item = localStorage.getItem(key);
  return item !== null;
};

export const getStorage = (key) => {
  const savedItem = localStorage.getItem(key);
  if (savedItem) {
    try {
      const value = JSON.parse(savedItem);
      return value;
    } catch (err) {
      throw err;
    }
  }
};
