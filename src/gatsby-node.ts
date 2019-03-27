const CSS_PATTERN = /\.css$/;
const MODULE_CSS_PATTERN = /\.module\.css$/;
const isCssRules = rule => rule.test &&
    (rule.test.toString() === CSS_PATTERN.toString() ||
        rule.test.toString() === MODULE_CSS_PATTERN.toString());
const findCssRules = config => config.module.rules.find(rule => Array.isArray(rule.oneOf) && rule.oneOf.every(isCssRules));
/**
 * See documentation here: https://www.gatsbyjs.org/docs/add-custom-webpack-config/
 * Unfortunately, adding to the default css setup has to be hacky because
 * setWebpackConfig doesn't handle every edge case. The hacks required to get this
 * working were inspired by:
 * https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby-plugin-postcss/src/gatsby-node.js
 *
 * @param getConfig
 * @param stage
 * @param actions
 * @param loaders
 * @param rules
 */
exports.onCreateWebpackConfig = ({ getConfig, stage, actions, loaders, rules }) => {
    if (stage == 'build-html') return;
    const config = getConfig();
    const cssRules = findCssRules(config);
    const typingLoader = {
        loader: 'typings-for-css-modules-loader',
        options: {
            modules: true,
            importLoaders: 1,
            localIndentName: '[path]___[name]__[local]___[hash:base64:5]',
            namedExport: true,
            camelCase: true
        }
    };

    //If css rules already exist we need to find the css loader and replace it since typings-for-css-modules-loader
    //is a REPLACEMENT for css-loader
    if (cssRules) {
        cssRules.oneOf.forEach((statement) => {
            const index = statement.use.findIndex(({ loader }) => loader.match(/\/css-loader\//))
            if (index) {
                statement.use[index] = typingLoader
            }
            //If we didn't find a css-loader we can push the typingLoader onto the use statement
            else {
                statement.use.push(typingLoader)
            }
        });

        actions.replaceWebpackConfig(config);
    }
    //If there aren't any existing css rules, add one
    else {
        actions.setWebpackConfig({
            module : {
                rules : [{
                    oneOf: [
                        {
                            test: CSS_PATTERN,
                            use: typingLoader
                        },
                        {
                            test: MODULE_CSS_PATTERN,
                            use: typingLoader
                        }
                    ]
                }]
            }
        });
    }
};
