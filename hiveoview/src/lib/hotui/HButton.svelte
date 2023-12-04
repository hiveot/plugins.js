<script lang="ts">
	export let icon: any;
	export let label: string | undefined = undefined;
</script>

<button class="btn">
	{#if icon}
		<svelte:component this={icon} />
	{/if}
	{#if label}
		<span>{label}</span>
	{/if}
</button>
