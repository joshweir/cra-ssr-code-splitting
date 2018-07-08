const nodeExternals = require('webpack-node-externals');
const path = require('path');

const env = process.env.NODE_ENV === 'development' ? 'dev' : 'prod';
const craConfig =
require(`node_modules/react-scripts/config/webpack.config.${env}.js`);

const makeIncludeEmitFileOptForKnownLoaders =
  knownLoaders => emitFileLoaders => (rule) => {
    const loader = rule[rule.use ? 'use' : 'loader'];
    if (emitFileLoaders.includes(loader)) {
      return {
        ...rule,
        options: {
          ...rule.options,
          emitFile: false
        }
      };
    } else if (knownLoaders.includes(loader)) {
      return rule;
    } else throw new Error(`Unrecognized loader: ${loader}`);
  };
const emitFileLoaders = ['url-loader', 'file-loader'];
const knownLoaders = ['babel-loader', 'eslint-loader'] + emitFileLoaders;
const includeEmitFileOptForKnownLoaders =
  makeIncludeEmitFileOptForKnownLoaders(knownLoaders)(emitFileLoaders);

const preventEmitFile = rule => {
  // if use property exists, if first element is style-loader
  // then replace entire use: property with css-loader/locals
  // else map the array of loaders
  if (rule.use) {
    if (rule.use instanceof Array) {
      const [ firstLoader ] = rule.use;
      if (firstLoader === 'style-loader') {
        return {
          ...rule,
          use: 'css-loader/locals'
        }
      }
    } else {
      return includeEmitFileOptForKnownLoaders(rule);
    }
  // else if loader property exists, update it
  } else if (rule.loader) {
    return includeEmitFileOptForKnownLoaders(rule);
  // else return the rule (even though it should always have a loader)
  } else {
    return rule;
  }
}

const updateRulePreventEmitFile = rule => {
  //if rule has oneOf property then map those
  if (rule.oneOf) {
    return {
      ...rule,
      oneOf: updateRule(rule.OneOf)
    }
  } else {
    return preventEmitFile(rule)
  }
};

const config = {
  ...craConfig,
  target: 'node',
  externals: [nodeExternals()],
  entry: path.resolve(__dirname, 'index.js'),
  output: {
    ...craConfig.output,
    filename: 'static/js/server.js',
    library: 'app',
    libraryTarget: 'commonjs2'
  },
  module: {
    ...craConfig.module,
    rules: craConfig.module.rules.map(updateRulePreventEmitFile)
  }
};

module.exports = config;
