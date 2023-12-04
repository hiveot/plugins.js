<script lang="ts">
	import Hdropdown from '@lib/hotui/HDropdown.svelte';
	import DashboardIcon from '~icons/mdi/view-dashboard';
	import AboutIcon from '~icons/mdi/information';
	import ThingsIcon from '~icons/mdi/robot-vacuum';
	import Hcheckbox from '@lib/hotui/HCheckbox.svelte';

	/**
	 * @param {Boolean} editMode
	 * Show/modify the dashboard edit mode
	 */
	export let editMode = false;

	function handleAction(menuItem: any): void {
		console.log('action: ' + menuItem.label);
	}
	function toggleEditMode(): void {
		editMode = !editMode;
		console.log('setEditMode to ', editMode);
	}

	// the menu must be reactive to show the current edit mode
	$: menuItems = [
		{ icon: DashboardIcon, label: 'Dashboard', href: '/dashboard' },
		{},
		{
			icon: Hcheckbox,
			label: 'Edit Mode',
			attr: { checked: editMode },
			onClick: toggleEditMode
		},
		// { label: "Add Dashboard"},
		{},
		{ icon: ThingsIcon, label: 'Things', href: '/things' },
		{ icon: AboutIcon, label: 'About', href: '/about' }
	];
</script>

<Hdropdown
	menu={menuItems}
	onClick={(item) => {
		handleAction(item);
	}}
/>
