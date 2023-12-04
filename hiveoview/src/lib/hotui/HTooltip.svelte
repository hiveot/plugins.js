<script lang="ts" context="module">
	// import type { IMenuType } from "../../lib/components/HPopup.svelte";
</script>

<script lang="ts">
	import type { PopupSettings } from '@skeletonlabs/skeleton';

	/**
	 * Tooltip component for displaying tooltips on
	 * @param placement of the tooltip
	 */
	export let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';
</script>

<span
	role="tooltip"
	class="tooltip absolute z-10 inline-block bg-gray-900 font-medium shadow-sm text-white py-2 px-3 text-sm rounded-lg opacity-0 invisible"
	data-popper-reference-hidden=""
	data-popper-escaped=""
	data-popper-placement="top"
	style="position: absolute; inset: auto auto 0px 0px; margin: 0px; transform: translate3d(918px, 449px, 0px);"
>
	<div
		class="tooltip-arrow"
		data-popper-arrow=""
		style="position: absolute; left: 0px; transform: translate3d(54px, 0px, 0px);"
	></div>
	<slot />
</span>
