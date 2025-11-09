// forge.config.js
const path = require('path');

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
  packagerConfig: {
    name: 'course-player',

    asar: true,
    icon: path.resolve(__dirname, 'public', 'favicon.ico'),
    extraResource: ['./build'],
    ignore: [
      '^/src($|/)',
      '\\.gitignore',
      'README\\.md',
      '\\.map$',
      'node_modules/(electron|electron-packager|electron-rebuild|electron-forge)',
    ],
  },

  makers: [
    {
      name: '@felixrieseberg/electron-forge-maker-nsis',
      config: {
        getAppBuilderConfig: async () => ({
          appId: 'com.dannsb.courseplayer',


          productName: 'course-player',

          win: {
            icon: path.resolve(__dirname, 'public', 'favicon.ico'),
          },

          nsis: {
            oneClick: false,
            perMachine: false,
            allowToChangeInstallationDirectory: true,

            createDesktopShortcut: true,
            createStartMenuShortcut: true,

            shortcutName: 'Course Player',

            installerIcon: path.resolve(__dirname, 'public', 'favicon.ico'),
            uninstallerIcon: path.resolve(__dirname, 'public', 'favicon.ico'),
            installerHeaderIcon: path.resolve(__dirname, 'public', 'favicon.ico'),
          },
        }),
      },
    },
  ],

  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'dannsb',
          name: 'course-player',
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
};
