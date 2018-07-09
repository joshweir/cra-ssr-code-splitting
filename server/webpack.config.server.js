const nodeExternals = require('webpack-node-externals');
const path = require('path');

const env = process.env.NODE_ENV === 'development' ? 'dev' : 'prod';
const craConfig =
require(path.resolve(`node_modules/react-scripts/config/webpack.config.${env}.js`));

const isLoader = inLoaders => searchLoader => {
  let is = false;
  const loaders = inLoaders instanceof Array ? inLoaders : [inLoaders];
  let search;
  if (typeof searchLoader === 'string') {
    search = searchLoader;
  } else if (searchLoader.hasOwnProperty('use')) {
    search = searchLoader.use;
  } else if (searchLoader.hasOwnProperty('loader')) {
    search = searchLoader.loader;
  } else {
    throw new Error('loader is not a string or an object with "use" ' +
      'or "loader" property');
  }
  loaders.map(loader => {
    if (search.includes(`/node_modules/${loader}/`)) is = true;
  })
  return is;
};

const makeIncludeEmitFileOptForKnownLoaders =
  knownLoaders => emitFileLoaders => (rule) => {
    if (isLoader(emitFileLoaders)(rule)) {
      return {
        ...rule,
        options: {
          ...rule.options,
          emitFile: false
        }
      };
    } else if (isLoader(knownLoaders)(rule)) {
      return rule;
    } else throw new Error(`Unrecognized loader for rule: ${JSON.stringify(rule)}`);
  };
const emitFileLoaders = ['url-loader', 'file-loader'];
const knownLoaders = ['babel-loader', 'eslint-loader'].concat(emitFileLoaders);
const includeEmitFileOptForKnownLoaders =
  makeIncludeEmitFileOptForKnownLoaders(knownLoaders)(emitFileLoaders);

const includeServerDirForBabelLoader = rule => {
  if (isLoader('babel-loader')(rule)) {
    return {
      ...rule,
      include: rule.include instanceof Array
        ? rule.include.concat(path.resolve(__dirname))
        : [rule.include, path.resolve(__dirname)]
    };
  } else {
    return rule;
  }
};

const preventEmitFileWithLoaderProp = loaderProp => rule => {
  if (rule[loaderProp] instanceof Array) {
    const [ firstLoader ] = rule[loaderProp];
    if (isLoader(['style-loader', 'extract-text-webpack-plugin'])(firstLoader)) {
      return {
        ...rule,
        [loaderProp]: 'css-loader/locals'
      }
    } else {
      return rule;
    }
  } else {
    return includeServerDirForBabelLoader(includeEmitFileOptForKnownLoaders(rule));
  }
};

const preventEmitFile = rule => {
  if (rule.use) {
    return preventEmitFileWithLoaderProp('use')(rule);
  } else if (rule.loader) {
    return preventEmitFileWithLoaderProp('loader')(rule);
  } else {
    return rule;
  }
}

const updateRulePreventEmitFile = rule => {
  //if rule has oneOf property then map those
  if (rule.oneOf) {
    return {
      ...rule,
      oneOf: rule.oneOf.map(updateRulePreventEmitFile)
    }
  } else {
    return preventEmitFile(rule)
  }
};

const config = {
  ...craConfig,
  target: 'node',
  externals: [nodeExternals()],
  entry: path.resolve(__dirname, './server.js'),
  output: {
    ...craConfig.output,
    filename: 'server.js',
    library: 'app',
    libraryTarget: 'commonjs2'
  },
  module: {
    ...craConfig.module,
    rules: craConfig.module.rules.map(updateRulePreventEmitFile)
  }
};

module.exports = config;
