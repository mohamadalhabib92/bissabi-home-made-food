const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === '@stripe/stripe-react-native') {
    return { type: 'sourceFile', filePath: path.resolve(__dirname, 'src/lib/stripeNativeStub.tsx') };
  }
  if (typeof upstream === 'function') return upstream(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
