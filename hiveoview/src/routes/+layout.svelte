<script lang="ts">
	import type { HubClient } from '@hivelib/hubclient/HubClient';
	import '../app.postcss';

	import AppHead from './app/AppHead.svelte';
	import { onMount } from 'svelte';

	// import type { PageData } from '../../.svelte-kit/types/src/routes';

	// data exported by layout.ts load()
	/** @type {import("../../.svelte-kit/types/src/routes").PageData} */
	export let data;

	let hc: HubClient;

	$: loginID = data.loginID;
	$: hc = data.hc;

	// console.info("onMount. data=", data);
	onMount(async () => {
		console.info('onMount. data=', data);
	});
</script>

<div class="flex flex-col max-auto w-full h-full">
	<!--  <AppHead connectionStatus="{data.conStat}"></AppHead>-->
	<AppHead {loginID} {hc} } />

	<!-- Router Slot -->
	<slot />
	<p>connected as {loginID}: {hc.connStatus}</p>

	<!--	<svelte:fragment slot="footer">Footer</svelte:fragment>-->
</div>
