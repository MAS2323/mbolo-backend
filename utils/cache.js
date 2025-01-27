import cache from "memory-cache";

const getCachedData = (key) => {
  return cache.get(key);
};

const setCachedData = (key, value, duration) => {
  cache.put(key, value, duration);
};

export default {
  getCachedData,
  setCachedData,
};
