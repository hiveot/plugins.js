import { NewHubClient } from '@hivelib/hubclient/HubClient';
import { ConnectionStatus } from '@hivelib/hubclient/transports/IHubTransport';
import type { ServerLoadEvent } from '@sveltejs/kit';

// import { writable } from 'svelte/store';
// export const isConnected = writable(false);

// start the app by attempting to connect to the hub, if an ID and auth token are available


/** @type {import("../../.svelte-kit/types/src/routes").LayoutServerLoad} */
export async function load(ev: ServerLoadEvent) {
	const loginID = ev.cookies?.get('loginID') || '';
	const authToken = ev.cookies?.get('authToken') || '';
	const serializedKey = ev.cookies?.get('key') || '';
	const caCertPem = ev.cookies?.get('caCertPEM') || '';
	const isConnected = ev.cookies?.get('isConnected') || false;
	const core = ev.cookies?.get('core') || '';

	const hc = NewHubClient("", loginID, caCertPem, core)
	const kp = hc.createKeyPair()
	if (serializedKey) {
		kp.importPrivate(serializedKey)
	}

	if (isConnected) {
		await hc.connectWithToken(kp, authToken);
		// refresh the token
		if (hc.connStatus == ConnectionStatus.Connected) {
			//todo
		}
	}

	// if (refreshToken) {
	// 	const newRefresh = await hapi.loginRefresh(loginID, refreshToken);
	// 	ev.cookies.set('refreshToken', newRefresh);
	// }

	// login with a refresh token
	console.info('constat=', hc.connStatus);
	return { loginID: loginID, hc: hc };
}
