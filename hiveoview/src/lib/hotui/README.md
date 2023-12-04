# hotui - The Hive of Things UI component library

## Status

Just starting so not much here. Just enough to make HiveOView work.

## Objectives 

The objective of this library is to provide an easy to use set of components for building HiveOT user interfaces, without the css gobbly goop.

The main tenet is that the application UI is defined using components without any css. Layout and behavior is directed through component attributes that use terminology that makes sense to the layout design. Css is limited to the components themselves.

Rant/In today's web UI development, one of the biggest challenges as an occasional UI developer is the swamp of css and html tags the developer has to wade through to build a user interface. There is little cognitive relationship between what is on the screen and what is coded up. Come back a month later and you spend hours figuring out what does what. Most of the time and effort involved has little to do with working on the problem the application is intended to solve. In addition, the swamp is inhabited with pitfalls from a build, test and debug environment that is more complicated than many applications that are build with it./Rant

This library is intended to bring back some level of sanity to building an IoT application user interface using the HiveOT IoT platform. While this implies limiting choice it does make life much easier with good results. 

Styling is important of course but handled separately through component themes. Once the application is in place, component styling customization is used to adjust the look and feel of the application. There is little to no styling in the application itself other than arranging the components!. This is a core tenet of this library.

This is the objective and it will take a bit of time to get there. Some help is appreciated.

The ideal design choice would be to use html with golang, because golang is simple, powerful, and a joy to work with, and html is easy to understand. Now back to reality...

The current design choices are:
1. Typescript, because using types catches many bugs at build time. Javascript with jsdoc has become pretty good in type checking so maybe this will be a future step. Not performing transpiling is faster and helps with testing/debugging without the need for source maps. Just google sourcemap problems and the 1 million results explains what I mean.
2. Svelte, because there is less cognitive load to map the code to the visual representation, compared to vue, react, etc. This would appeal to declarative code thinkers but hopefully the code generators among us won't mind too much. Languages such as angular, vue and react can also be made to work, but we're trying to keep things simple and a choice has to be made.
3. Svelte-kit, because svelte without it is painful, like webpack. It mostly just works using vite and esbuild, supports server side rendering, and is supported by vscode and jetbrains dev tools. If you're the type of person that prefers emacs as IDE then I salute your perseverance and edictive memory but you might not be the target audience.
4. tailwindcss. As far as css is concerned, this is the cat's miaow that tries to maintain some level of sanity and great for building components. It is mostly logical and consistent and supports theming. As long as the application developer doesn't have to use it, its all good. The best tool are not in your way after all.
5. Flowbite-svelte with Skeleton as a runner up, Flowbite seems a bit more complete. has props but includes layout in components, while Skeleton is layout clean and has themes. Maybe use both?

## Getting Started

Todo... yep .. get started!
