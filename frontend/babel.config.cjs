/**
 * babel.config.cjs — Babel configuration used by Jest for transpiling JSX in tests.
 * Vite uses its own transpilation for the actual build; this is only for Jest.
 */
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};
