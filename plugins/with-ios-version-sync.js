const { IOSConfig, withInfoPlist, withXcodeProject } = require('expo/config-plugins');

function getIosVersion(config) {
  return config.ios?.version || config.version || '1.0.0';
}

function getIosBuildNumber(config) {
  return config.ios?.buildNumber || '1';
}

function withIosVersionSync(config) {
  const marketingVersion = getIosVersion(config);
  const buildNumber = getIosBuildNumber(config);

  config = withInfoPlist(config, (config) => {
    config.modResults.CFBundleShortVersionString = '$(MARKETING_VERSION)';
    config.modResults.CFBundleVersion = '$(CURRENT_PROJECT_VERSION)';
    return config;
  });

  return withXcodeProject(config, (config) => {
    const [, nativeTarget] = IOSConfig.Target.findFirstNativeTarget(config.modResults);
    const buildConfigurations = IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
      config.modResults,
      nativeTarget.buildConfigurationList,
    );

    for (const [, buildConfiguration] of buildConfigurations) {
      buildConfiguration.buildSettings.MARKETING_VERSION = marketingVersion;
      buildConfiguration.buildSettings.CURRENT_PROJECT_VERSION = buildNumber;
    }

    return config;
  });
}

module.exports = withIosVersionSync;
