<script lang="ts">
	import type { HubClient } from '@hivelib/hubclient/HubClient';
	import '../app.postcss';

	// activate stores for use in modal, light switch, etc
	// import { initializeStores, getModeUserPrefers } from '@skeletonlabs/skeleton';
	// initializeStores();

	// for popups such as tooltips and menus: https://www.skeleton.dev/utilities/popups
	// import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	// import { storePopup } from '@skeletonlabs/skeleton';
	// storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

	// app layout
	import AppHead from './app/AppHead.svelte';
	import HApp from '@lib/hotui/HApp.svelte';

	// data exported by layout.ts load()
	export let data;

	let hc: HubClient;

	$: loginID = data.loginID;
	$: hc = data.hc;
</script>

<!-- <svelte:window bind:innerWidth={width} /> -->
<HApp>
	<AppHead {hc} />

	<!-- Router Slot -->
	<slot />

	<p>connected as {loginID}: {hc.connStatus}</p>

	<!--	<svelte:fragment slot="footer">Footer</svelte:fragment>-->
</HApp>
