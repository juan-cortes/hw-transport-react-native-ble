const path = require('path');
const blacklist = require('metro-config/src/defaults/exclusionList');
const escape = require('escape-string-regexp');
const pak = require('../package.json');

const root = path.resolve(__dirname, '..');

const modules = Object.keys({
  ...pak.peerDependencies,
});

const extraNodeModules = modules.reduce(
  (acc, name) => {
    acc[name] = path.join(__dirname, 'node_modules', name);
    return acc;
  },
  {
    ...require('node-libs-react-native'),
    fs: require.resolve('react-native-level-fs'),
    net: require.resolve('react-native-tcp'),
  }
);

module.exports = {
  projectRoot: __dirname,
  watchFolders: [root],

  // We need to make sure that only one version is loaded for peerDependencies
  // So we blacklist them at the root, and alias them to the versions in example's node_modules
  resolver: {
    blacklistRE: blacklist(
      modules.map(
        (m) =>
          new RegExp(`^${escape(path.join(root, 'node_modules', m))}\\/.*$`)
      )
    ),

    extraNodeModules,

    // resolveRequest: (context, moduleName, platform) => {
    //   console.log(moduleName, platform)
    //   if (moduleName.startsWith('my-custom-resolver:')) {
    //     // Resolve file path logic...
    //     // NOTE: Throw an error if there is no resolution.
    //     return {
    //       filePath: "path/to/file",
    //       type: 'sourceFile',
    //     };
    //   }
    //   // Optionally, chain to the standard Metro resolver.
    //   return context.resolveRequest(context, moduleName, platform);
    // },

    sourceExts: ['tsx', 'ts', 'jsx', 'js', 'json', 'cjs'],
  },

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
