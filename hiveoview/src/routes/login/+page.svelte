<script lang="ts">
	import { enhance } from '$app/forms'; // magic???
	import { get } from 'svelte/store';
	import { onMount, tick } from 'svelte';
	import { Button, Input, Label, Toggle } from 'flowbite-svelte';
	import HForm from '@lib/hotui/HForm.svelte';

	export let data;
	export let form;

	// reactive properties
	// start with an empty account record
	let rememberMe = true; //data.rememberMe == 'true';
	let password = '';
	$: isDisabled = data.loginID == '' || password == '';

	// onMount(async () => {
	//   // load the form data after the parent has mounted to load account
	//   await tick();
	//   accountData = get(defaultAccount);
	// });
</script>

<div class="h-full flex flex-col justify-center">
	<HForm title="Login to the Hub" center showSubmit>
		<!-- Login ID and password input -->
		<div>
			<Label class="mb-2">Login email</Label>
			<Input
				id="loginID"
				title="Email"
				type="text"
				bind:value={data.loginID}
				required
				autocomplete="off"
			/>
		</div>
		<div>
			<Label class="mb-2">Password</Label>
			<Input
				id="password"
				title="Password"
				type="password"
				placehold="•••••••••"
				bind:value={password}
				required
				autocomplete="off"
			/>
		</div>
		<!-- Remember the login info between sessions -->
		<div class="flex flex-row gap-2 place-content-end w-full">
			Remember Me
			<Toggle classDiv="mr-0" name="rememberMe" bind:checked={rememberMe} />
		</div>
	</HForm>
</div>
