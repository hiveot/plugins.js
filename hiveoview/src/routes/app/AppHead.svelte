<script lang="ts" context="module">
	// import type { IMenuType } from "../../lib/components/HDropDown.svelte";
</script>

<script lang="ts">
	import { Checkbox, DarkMode, Navbar, NavBrand, Toggle, Tooltip } from 'flowbite-svelte';

	import DashboardIcon from '~icons/mdi/view-dashboard';
	import ConnectedIcon from '~icons/mdi/account-network';
	import DisconnectedIcon from '~icons/mdi/close-network-outline';
	import RadarIcon from '~icons/mdi/radar';
	import AboutIcon from '~icons/mdi/information';
	import ThingsIcon from '~icons/mdi/robot-vacuum';

	import HDropDown from '@lib/components/HDropDown.svelte';
	import { ConnectionStatus } from '@hivelib/hubclient/transports/IHubTransport';
	import type { HubClient } from '@hivelib/hubclient/HubClient';
	//

	// component properties to be passed in:
	// @param hc (HubClient) with the hub connection is provided by the parent
	export let hc: HubClient;
	// dashboard edit mode for editing/adding/moving tiles,
	// controlled through this header.
	export let editMode = false;

	// connection status
	$: connStat = hc ? hc.connStatus : 'unknown';

	//

	function handleAction(menuItem: any): void {
		console.log('action: ' + menuItem.label);
	}

	function setEditMode(): void {
		editMode = !editMode;
		console.log('setEditMode to ', editMode);
	}

	// connIcon is derived for display
	$: connIcon = hc.connStatus === ConnectionStatus.Connected ? ConnectedIcon : DisconnectedIcon;

	// the menu must be reactive to show the current edit mode
	$: menuItems = [
		{ icon: DashboardIcon, label: 'Dashboard', href: '/dashboard' },
		{},
		{
			icon: Checkbox,
			label: 'Edit Mode',
			attr: { checked: editMode },
			onClick: setEditMode
		},
		// { label: "Add Dashboard"},
		{},
		{ icon: ThingsIcon, label: 'Things', href: '/things' },
		{ icon: AboutIcon, label: 'About', href: '/about' }
	];
</script>

<!--Utilize the full width-->
<Navbar navDivClass="mx:auto flex flex-wrap w-full max-w-none justify-between items-center">
	<NavBrand href="/">
		<img src="./logo.svg" alt="logo" class="logo" height="42" />
		<strong class="text-xl uppercase">HiveOT</strong>
	</NavBrand>

	<!-- page tabs-->
	<span class="grow" />
	<!--    Edit button-->
	<Toggle disabled size="small" checked={false}>Edit</Toggle>
	<Tooltip placement="bottom">Toggle dashboard edit mode</Tooltip>

	<!-- One button to rule the night-->
	<DarkMode />
	<Tooltip placement="bottom">Hive at night</Tooltip>

	<!-- network/settings status-->
	<a href="/login">
		<svelte:component
			this={connIcon}
			class="h-5 transition duration-1000 delay-150
        {hc.connStatus === ConnectionStatus.Connecting ? 'animate-spin' : ''}
        {hc.connStatus === ConnectionStatus.Connected ? 'dark:text-green-400 text-green-400' : ''}"
		/>
	</a>
	<Tooltip placement="bottom">{hc.connInfo}</Tooltip>

	<!-- Last, the menu dropdown-->
	<HDropDown
		menu={menuItems}
		onClick={(item) => {
			handleAction(item);
		}}
	/>
</Navbar>

<style>
	.logo {
		height: 32px;
	}
</style>
