<script lang="ts">
	/**
	 *  TODO: Theme switcher component
	 *  Credits: https://nicobachner.com/sveltekit-theme-switch
	 */
	import { currentTheme } from '$lib/stores';
	import { Select } from 'flowbite-svelte';

	let themes = [
		{ value: 'system', name: 'System' },
		{ value: 'skeleton', name: 'Skeleton' },
		{ value: 'wintry', name: 'Wintry' },
		{ value: 'modern', name: 'Modern' },
		{ value: 'vintage', name: 'Vintage' }
	];
</script>

<Select
	items={themes}
	bind:value={$currentTheme}
	class="bg-transparent  selection:bg-transparent text-inherit"
></Select>
