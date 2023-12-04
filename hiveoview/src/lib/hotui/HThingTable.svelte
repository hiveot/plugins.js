<script lang="ts">
	import { Table, tableMapperValues } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	// table with discovered things

	// todo: use TDs and values
	export let data: {}[];

	export let titles: string[];

	let tableData: TableSource;
	$: tableData = ((titles: string[], data: {}[]): TableSource => {
		let ts: TableSource = {
			head: titles,
			body: tableMapperValues(data, titles),
			// meta: tableMapperValues(),
			foot: []
		};
		return ts;
	})(titles, data);
</script>

<Table source={tableData}></Table>
