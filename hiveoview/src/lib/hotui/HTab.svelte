<script>
	import { TabItem } from 'flowbite-svelte';

	export let title = 'title';
</script>

<TabItem {title}>
	<slot />
</TabItem>
