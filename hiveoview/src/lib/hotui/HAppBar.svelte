<script lang="ts">
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger } from 'flowbite-svelte';
	import HTabGroup from './HTabGroup.svelte';
	import HTab from './HTab.svelte';
	/**
	 * Application bar spanning the full width of the view
	 */

	/**
	 * Path to image with application logo
	 * @param {string} logo
	 */
	export let logo: string;

	/**
	 * Application title
	 * @param {string} title
	 */
	export let title: string;

	/**
	 * @param height of bar in tailwind units: 10=40px, 12=48px,...
	 */
	export let height: string = '12';
</script>

<Navbar fluid class="p-1 ">
	<!-- Icon and title on the left -->
	<NavBrand class="mr-3 gap-1 h-{height}">
		<img src={logo} alt="logo" class="mr-3 h-9" />
		<span class="self-center whitespace-nowrap text-xl font-semibold sm:block hidden">{title}</span>
	</NavBrand>

	<!-- Show tabs for dashboard pages, if room available and dashboard is visible -->
	<NavUl
		divClass="md:block hidden"
		ulClass="p-0 flex flex-row space-x-4 lg:space-x-8 md:mt-0 md:text-sm md:font-medium"
	>
		<NavLi class="">pagina 1</NavLi>
		<NavLi>pagina 2</NavLi>
	</NavUl>
	<!-- <HTabGroup>
		<HTab title="Page1"></HTab>
		<HTab title="Page2"></HTab>
	</HTabGroup> -->

	<!-- Separated by remaining space -->
	<span class="grow" />

	<!-- Closing with status and menu icons -->
	<slot name="trail" />
</Navbar>
