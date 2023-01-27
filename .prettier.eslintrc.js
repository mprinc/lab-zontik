// importing `prettier` rules
const pretierrcObj = require("./.prettierrc");

module.exports = {
	// https://github.com/prettier/eslint-plugin-prettier
	// not necessary if we are using `eslint-config-prettier` as it will enable the plugin
	plugins: ["prettier"],
	extends: [
		// NOTE: Prettier should be THE LATEST as it disables eslint rules
		// https://github.com/prettier/eslint-config-prettier
		// 1. enables prettier (https://github.com/prettier/eslint-plugin-prettier),
		// 2. sets prettier/prettier rule to error,
		// 3. Turns off all rules that are unnecessary or might conflict with Prettier
		"plugin:prettier/recommended",
		// Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
		"prettier/@typescript-eslint",
		"@vue/prettier",
		"@vue/prettier/@typescript-eslint",
	],
	rules: {
		// setting `prettier` rules, will be used with vue cli
		// should not be necessary, but still safer because of different tools using (VSC, Vue CLI, ESLint CLI, ...)
		"prettier/prettier": ["warn", pretierrcObj],
	}
};
