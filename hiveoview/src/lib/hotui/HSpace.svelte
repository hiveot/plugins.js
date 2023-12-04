<script lang="ts">
	/**
	 * Component that takes up space, optionlly growing to take up available space.
	 * Set grow to the amount of space to grow.
	 * Grow can be a size, "10 pt", "horizontal" for available horizontal space,
	 * or "vertical for available vertical space.
	 *
	 * @param {string} size: string with size, or "grow" for available space.
	 */
	export let size: string | 'grow';

	$growClass: size == 'grow' ? 'grow' : 'w-' + size;
</script>

<span class={size} />
