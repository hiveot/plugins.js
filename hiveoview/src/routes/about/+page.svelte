<script lang="ts">
	import Hcard from '@lib/hotui/HCard.svelte';
	import LicenseIcon from '~icons/mdi/license';
	import TextBoxIcon from '~icons/mdi/text-box-outline';

	const version = '0.5-alpha';
	const licenseURL =
		'https://github.com/hiveot/hiveot.github.io/blob/81f41a781dfd37d82a5e37bf9ac905199161ee85/LICENSE';
	const hiveotSiteURL = 'https://hiveot.github.io/';
</script>

<div class="about grid place-content-center">
	<Hcard>
		<h3 class="text-center mb-5">HiveOView</h3>

		<card horizontal padding="none" class="mb-5 border-0">
			<img src="./logo.svg" alt="logo" class="h-20" />

			<div class="mb-3">
				<p class="mb-6">
					The HiveOT Hub Viewer presents information of IoT Things connected to the Hub.
				</p>
				<p>Version {version}</p>
			</div>
		</card>

		<footer class="flex justify-between">
			<a class="flex" href={licenseURL} target="_blank">
				<LicenseIcon class="mr-2" />
				MIT License</a
			>
			<a class="flex" href={hiveotSiteURL} target="_blank">
				<TextBoxIcon class="mr-2" />
				Overview
			</a>
		</footer>
	</Hcard>
</div>

<style>
	.about {
		padding-bottom: 40px;
		height: 100%;
	}

	p {
		margin-bottom: 6px;
	}
</style>
