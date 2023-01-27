/**
 * IMPORTANT: You still need JS, TS and PRETTIER speciffic files
 */
module.exports = {
	root: true,
	env: {
		node: true,
	},
	// TODO: Understand more, but it seems, not necessary, unless other parser is explicitly set
	// in that case we enable this, and put the other parser in `parserOptions.parser`
	// parser: "vue-eslint-parser",
	extends: [
		// eslint-plugin-vue - Official ESLint plugin for Vue.js
		// https://github.com/vuejs/eslint-plugin-vue
		// https://www.npmjs.com/package/eslint-plugin-vue
		// configures ESLint to use some default best-practice rules like getters always need to return a value (full list here: https://eslint.org/docs/rules/)
		"plugin:vue/base",
		// also (but cannot make it loading)
		// "plugin:vue/vue3-recommended",
		/**
		 * https://www.npmjs.com/package/@vue/eslint-config-typescript
		 * it also **turns off** several conflicting rules in 
		 * the `eslint:recommended` ruleset
		 * so when used alongside other **sharable configs**, this config 
		 * should be placed **at the end** of the `extends` array.
		 */
		"@vue/typescript/recommended",

		/**
		 * eslint-config-prettier for Vue CLI
		 * @vue/eslint-config-prettier
		 * https://www.npmjs.com/package/@vue/eslint-config-prettier
		 * Uses: 
		 * + eslint-config-prettier/vue
		 */
		"@vue/prettier",

		/**
		* 
		* https://github.com/vuejs/eslint-config-prettier/blob/master/%40typescript-eslint.js
		* Uses:
		* + eslint-config-prettier/@typescript-eslint
		 */
		"@vue/prettier/@typescript-eslint",
	],
	rules: {
	},
	overrides: [
		{
			files: ["**/__tests__/*.{j,t}s?(x)", "**/tests/unit/**/*.spec.{j,t}s?(x)"],
			env: {
				jest: true,
			},
		},
	],
};
