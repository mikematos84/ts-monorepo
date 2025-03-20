export default function configureWebpackForSass(config) {
  // Remove existing SCSS rules to avoid conflicts
  config.module.rules = config.module.rules.filter(
    (rule) => !(rule.test && rule.test.toString().includes("scss"))
  );

  // SCSS Modules (for files ending in .module.scss)
  config.module.rules.push({
    test: /\.module\.scss$/,
    use: [
      "style-loader",
      {
        loader: "css-loader",
        options: {
          modules: {
            localIdentName: "[name]__[local]__[hash:base64:5]", // Ensure unique class names
          },
          sourceMap: true,
          importLoaders: 1,
          esModule: false,
        },
      },
      "sass-loader",
    ],
    include: /\.module\.scss$/,
  });

  // Global SCSS (for regular .scss files)
  config.module.rules.push({
    test: /\.scss$/,
    exclude: /\.module\.scss$/,
    use: ["style-loader", "css-loader", "sass-loader"],
  });

  return config;
}
