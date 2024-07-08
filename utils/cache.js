const cache = require("memory-cache");

const getCachedData = (key) => {
  return cache.get(key);
};

const setCachedData = (key, value, duration) => {
  cache.put(key, value, duration);
};

module.exports = {
  getCachedData,
  setCachedData,
};
