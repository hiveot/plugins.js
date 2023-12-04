<script lang="js">
	/**
	 * Checkbox with label
	 * @param checked: boolean
	 */
	export let checked = false;
</script>

<label class="flex items-center space-x-2">
	<input class="checkbox" type="checkbox" checked={checked ? true : false} />
	<slot />
</label>
