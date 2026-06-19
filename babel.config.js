module.exports = function (api) {
  const isTest = api.env('test')
  api.cache(() => isTest)
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          // In the Jest environment react-native-reanimated is mocked via
          // setup.ts, so skip the Babel plugin that requires
          // react-native-worklets (not installed as a standalone package).
          reanimated: !isTest,
        },
      ],
    ],
    plugins: [
      // Reanimated plugin requires react-native-worklets at build time;
      // skip it in the Jest environment where it is mocked via setup.ts.
      ...(isTest ? [] : ['react-native-reanimated/plugin']),
    ],
  }
}
