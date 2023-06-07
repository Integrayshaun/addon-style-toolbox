import { PackageJson } from "@storybook/types";
import * as t from "@babel/types";

import { hasDependency } from "../utils/dependencies.utils";
import {
  SUPPORTED_BUILDERS,
  SUPPORTED_STYLING_TOOLS,
  ToolConfigurationStrategy,
} from "../types";
import { addImports, stringToNode } from "../utils/babel.utils";

const projectHasSass = (packageJson: PackageJson) =>
  hasDependency(packageJson, "sass");

export const sassStrategy: ToolConfigurationStrategy = {
  name: SUPPORTED_STYLING_TOOLS.MATERIAL_UI,
  predicate: projectHasSass,
  main: (mainConfig, packageJson, builder, { logger, colors }) => {
    if (builder === SUPPORTED_BUILDERS.VITE) {
      // Vite does not require extra configuration
      logger.plain(`  • No changes required.`);
      return;
    }

    logger.plain(`  • Configuring ${colors.green("postcss")}.`);

    const [addonConfigNode] = stringToNode`({
        name: "@storybook/addon-styling",
        options: {
          sass: {
            implementation: require.resolve("sass")
          }
        }
      })`;

    console.log(addonConfigNode);

    const addonsNodePath = ["addons"];
    let addonsArrayNode = mainConfig.getFieldNode(addonsNodePath);

    if (!addonsArrayNode) {
      mainConfig.setFieldNode(addonsNodePath, t.arrayExpression());
      addonsArrayNode = mainConfig.getFieldNode(addonsNodePath);
    }

    // @ts-expect-error
    addonsArrayNode.elements.push(addonConfigNode);
  },
  preview: (previewConfig, packageJson, builder, { logger, colors }) => {
    logger.plain(
      `  • Adding imports for ${colors.green(SUPPORTED_STYLING_TOOLS.SASS)}`
    );

    const importsNode = stringToNode`
    import { withThemeByClassName } from '@storybook/addon-styling';

    // TODO: update import for your sass stylesheet
    import '../path/to/styles.sass';`;

    addImports(previewConfig._ast, importsNode);

    logger.plain(
      `  • Adding ${colors.blue("withThemeByClassName")} decorator to config`
    );
    const [
      decoratorNode,
    ] = stringToNode`// Uncomment to add theme switching support.
    // withThemeByClassName({
     // themes: {
     // // Provide the classes for your themes
     //   light: "light-mode",
     //   dark: "dark-mode",
     // },
     // defaultTheme: 'light',
})`;

    const decoratorNodePath = ["decorators"];
    let decoratorArrayNode = previewConfig.getFieldNode(decoratorNodePath);

    if (!decoratorArrayNode) {
      previewConfig.setFieldNode(decoratorNodePath, t.arrayExpression());
      decoratorArrayNode = previewConfig.getFieldNode(decoratorNodePath);
    }

    // @ts-expect-error
    decoratorArrayNode.elements.push(decoratorNode);
  },
};