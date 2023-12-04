<script lang="ts" context="module">
	// import type { IMenuType } from "../../lib/components/HDropDown.svelte";
</script>

<script lang="ts">
	import ConnectedIcon from '~icons/mdi/account-network';
	// import DisconnectedIcon from '~icons/mdi/close-network-outline';
	import DisconnectedIcon from '~icons/mdi/account-network-off-outline';

	import { ConnectionStatus } from '@hivelib/hubclient/transports/IHubTransport';
	import type { HubClient } from '@hivelib/hubclient/HubClient';
	import HTooltip from '@lib/hotui/HTooltip.svelte';
	import HButton from '@lib/hotui/HButton.svelte';
	import HSpace from '@lib/hotui/HSpace.svelte';
	import HTab from '@lib/hotui/HTab.svelte';
	import HTabGroup from '@lib/hotui/HTabGroup.svelte';
	import HTheme from '@lib/hotui/HTheme.svelte';
	import HDarkmode from '@lib/hotui/HDarkmode.svelte';
	import AppMenu from './AppMenu.svelte';
	import HAppBar from '@lib/hotui/HAppBar.svelte';
	import { NavHamburger, Toggle } from 'flowbite-svelte';
	//

	/**
	 * The AppHead component shows the persistent header that has two presentation modes,
	 * In unauthenticated mode the header shows the logo, title, dark mode and connection status button.
	 * In authenticated mode the dashboard pages, edit mode, and dropdown menu are shown as well.
	 * Authentication mode is controlled by the hubClient connection status.
	 */

	/**
	 * @param hc (HubClient) with the hub connection status.
	 */
	export let hc: HubClient;

	/**
	 * editMode controls
	 */

	// dashboard edit mode for editing/adding/moving tiles,
	// controlled through this header.
	export let editMode = false;
	// @param show the dashboard edit toggle button
	export let showDashboardEdit = true;

	//--- Derived properties

	// connection status
	$: connStat = hc ? hc.connStatus : 'unknown';

	$: isConnected = hc?.connStatus == 'connected' || false;

	// connIcon connection indicator
	$: connIcon = hc.connStatus === ConnectionStatus.Connected ? ConnectedIcon : DisconnectedIcon;
</script>

<!--Utilize the full width-->
<HAppBar logo="./logo.svg" title="HiveOT" height="12">
	<!-- Show hamburger menu on small screens instead of the page tabs -->
	<!-- <NavHamburger /> -->
	<!-- page tabs-->
	<!-- <NavHamburger />
	<svelte:fragment slot="menu">
		<HTabGroup>
			<HTab>Page1</HTab>
			<HTab>Page2</HTab>
		</HTabGroup>
	</svelte:fragment> -->

	<!-- <div class="flex gap-0 text-gray-900 dark:text-gray-100"> -->
	<svelte:fragment slot="trail">
		<span class="flex space-x-2">
			<!-- dashboard edit toggle -->
			{#if isConnected}
				<span class="flex {showDashboardEdit ? 'visible' : 'invisible'}">
					<Toggle name="slide" size="small" bind:checked={editMode}>
						<HTooltip placement="bottom">Toggle dashboard edit mode</HTooltip>
					</Toggle>
				</span>
			{/if}

			<!-- One button to rule the night-->
			<HDarkmode tooltip="Toggle day/night mode" />
			<!-- <HToolTip placement="bottom">Toggle day/night mode</HToolTip> -->

			<!-- connection status -->
			<HButton icon={connIcon} />

			<!-- <HToolTip placement="bottom">{hc.connInfo}</HToolTip> -->

			<!-- Last, the menu dropdown-->
			{#if isConnected}
				<AppMenu bind:editMode />
			{/if}
		</span>
	</svelte:fragment>
</HAppBar>
