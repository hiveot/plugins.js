<script lang="ts">
	import HThingTable from '@lib/hotui/HThingTable.svelte';

	let titles = ['name'];
	let data = [{ name: 'test' }];
</script>

<div class="flex flex-col space-y-2">
	<h3 class="text-center">Discovered Things</h3>
	<HThingTable {titles} {data} />
</div>
