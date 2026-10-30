/** Thêm URL scheme Google khi có OAuth client iOS; Android được native autolinking cấu hình. */
module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  if (!iosClientId) return config;

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        '@react-native-google-signin/google-signin',
        { iosUrlScheme: iosClientId.split('.').reverse().join('.') },
      ],
    ],
  };
};
