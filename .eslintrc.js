module.exports = {
	root: true,
	env: {
		node: true,
		// ES2020 global variables
		es2020: true,
	},
	plugins: ["@typescript-eslint"],
	extends: [
		/**
		 * enables a subset of core rules that report common problems, which have a
		 * **check mark**  on the rules page.
		 * https://eslint.org/docs/user-guide/configuring#using-eslintrecommended
		 * */
		"eslint:recommended",
		// @typescript-eslint/eslint-plugin
		// adds recommended TS rules
		"plugin:@typescript-eslint/recommended",
		// add our (local) vue configuration
		"./.vue.eslintrc",
		// add our (local) prettier configuration
		"./.prettier.eslintrc",
	],
	// default parser
	// shouldn't be used when using vue, or placed under `parserOptions`
	// parser: "esprima",
	parserOptions: {
		// ECMA Syntax to support (es5, es6, 2020, ...)
		ecmaVersion: 2020,
		// TODO: might not be necessary, but most likely it is
		parser: "@typescript-eslint/parser",
		// code is in ECMAScript modules
		sourceType: "module",
		ecmaFeatures: {
			//  enable global [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
			impliedStrict: true,
		},
	},
	rules: {
		"no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
		"no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
		// semi: ["error", "never"],
		// quotes: [2, "double"],
		"@typescript-eslint/explicit-module-boundary-types": ["error"],
		"@typescript-eslint/camelcase": ["off"],
		"@typescript-eslint/no-inferrable-types": ["off"],
		"@typescript-eslint/interface-name-prefix": ["off"],
	},
	overrides: [
		{
			// match the test files
			files: ["**/__tests__/*.{j,t}s?(x)", "**/tests/unit/**/*.spec.{j,t}s?(x)"],
			env: {
				// adds jes global variables for the test files
				jest: true,
			},
		},
	],
};
