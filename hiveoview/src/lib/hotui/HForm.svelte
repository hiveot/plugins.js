<script lang="ts">
	import { Button, Card, Hr } from 'flowbite-svelte';

	/**
	 * Form container
	 */

	/**
	 * @param {string} title title shown at the top of the form
	 */
	export let title: string;

	/**
	 * @param {string} cancelText text on the cancel button
	 */
	export let cancelText = 'Cancel';
	export let showCancel = true;

	/**
	 * @param {string} submitText text on submit button
	 */
	export let submitText = 'Submit';
	export let showSubmit = true;
	export let submitDisabled = false;

	/**
	 * Align the form in the center (default false)
	 * @param {boolean} center
	 */
	export let center = false;
	$: centerClass = center ? 'self-center justify-self-center' : '';

	/**
	 * @param closeText
	 */
	export let closeText = 'Close';
	$: showClose = !showCancel && !showSubmit;
</script>

<div class="space-y-3 rounded w-10/12 md:w-96 {centerClass}">
	{#if title}
		<h2 class="text-center">{title}</h2>
	{/if}

	<form class="gap-6 grid mb-6 border-l-blue-100" method="post" action="?/submit">
		<slot />
	</form>

	<Hr />
	<div class="w-full">
		{#if showCancel || showSubmit}
			<Button class="bg-blue-500">{cancelText}</Button>
		{/if}
		<span class="grow" />
		{#if showSubmit}
			<Button type="submit" disabled={submitDisabled}>{submitText}</Button>
		{/if}
		{#if showClose}
			<Button>{closeText}</Button>
		{/if}
	</div>
</div>
