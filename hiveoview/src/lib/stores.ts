// https://nicobachner.com/sveltekit-theme-switch
import { writable } from 'svelte/store'
import { browser } from '$app/environment';

type Theme = string

// // initialize default theme with the last value from localstorage
let themeStartValue: Theme
if (typeof window !== "undefined") {
    themeStartValue = localStorage.getItem('data-theme') as Theme || "skeleton"
} else {
    themeStartValue = "system"
}
const currentTheme = writable<Theme>(themeStartValue)

// update localstorage and theme document on changes
currentTheme.subscribe(value => {
    if (typeof window !== "undefined") {
        console.log('changing theme to ' + value)
        localStorage.setItem('data-theme', value)
        if (browser) {
            // document.body.setAttribute('data-theme', value);
        }
    }
})


export { currentTheme }
