module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          browsers: [
            ">0.2%",
            "not dead",
            "not op_mini all",
            "not safari < 10",
            "not chrome < 51",
            "not android < 5",
            "not ie < 12"
          ]
        },
        modules: "commonjs",
        useBuiltIns: "usage",
        corejs: 3
      }
    ]
  ],
  plugins: [
    ["module-resolver", {
      "root": ["./src"],
      "alias": {
        "src": "./src"
      }
    }]
  ]
};
