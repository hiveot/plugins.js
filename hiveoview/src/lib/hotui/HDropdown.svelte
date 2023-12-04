<!--Data driven dropdown menu  -->
<script lang="ts" context="module">
	import MenuIcon from '~icons/mdi/menu';
	// import MenuIcon from 'svelte-materialdesign-icons/Menu.svelte';

	export type IMenuItem = {
		label?: string;
		href?: string;
		icon?: any; // optional icon or other component
		attr?: any;
		onClick?: (ev: IMenuItem) => void;
	};
</script>

<script lang="ts">
	import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';

	//@param list of dropdown menu items
	export let menu: IMenuItem[] = [];
	//@param title {string}
	export let label = '';
	//@param dropdown {Icon}
	export let icon = MenuIcon;

	export let onClick: (item: IMenuItem) => void | undefined;
</script>

<Button>{icon} {label}</Button>
<Dropdown>
	{#each [...menu] as item}
		{#if item.label}
			<DropdownItem>
				<a
					href={item.href}
					class="flex"
					on:click={() => {
						// debugger;
						if (item.onClick) item.onClick(item);
						if (onClick) onClick(item);
					}}
				>
					<div class="flex mr-2 w-5 h-5 items-center">
						<svelte:component this={item.icon} {...item.attr} />
					</div>
					<span class="whitespace-nowrap">{item.label}</span>
				</a>
			</DropdownItem>
		{:else}
			<div class="divide-solid" />
		{/if}
	{/each}
</Dropdown>
