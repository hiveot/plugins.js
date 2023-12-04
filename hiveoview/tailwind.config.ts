/** @type {import('tailwindcss').Config} */
export default {
	// 2. Opt for dark mode to be handled via the class method
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
	],
	theme: {
		// tailwind colors
		// colors: {
		// 	'blue': '#1fb6ff',
		// 	'purple': '#7e5bef',
		// 	'pink': '#ff49db',
		// 	'orange': '#ff7849',
		// 	'green': '#13ce66',
		// 	'yellow': '#ffc82c',
		// 	'gray-dark': '#273444',
		// 	'gray': '#8492a6',
		// 	'gray-light': '#d3dce6',
		// },
		// fontFamily: {
		// 	sans: ['Graphik', 'sans-serif'],
		// 	serif: ['Merriweather', 'serif'],
		// },
		extend: {
			colors: {}
		},
	},
	plugins: [
		//  tailwind forms?
		require("@tailwindcss/forms"),
		//  Install the flowbite plugin
		require('flowbite/plugin'),
		// c. Append the Skeleton plugin (after other plugins)
		// skeleton({
		// 	themes: { preset: ["skeleton", "wintry", "modern", "vintage"] }
		// })
	]
}

