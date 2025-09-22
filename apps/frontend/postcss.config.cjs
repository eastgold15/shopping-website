// postcss.config.cjs
module.exports = {
  plugins: {
    "postcss-preset-env": {
      stage: 1,
      browsers: [
        "Android 4.4",
        "iOS >= 9",
        "Chrome >= 49",
        "Firefox >= 31",
        "Safari >= 9.1",
        "Edge >= 13",
        "Opera >= 36"
      ]
      // 自动按需降级，无需手动指定 features
    }
  }
};