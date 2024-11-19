<script lang="ts">
  import Home from "./routes/Home.svelte";
  import Posts from "./routes/Posts.svelte";
  import Post from "./routes/Post.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import type { Component } from "svelte";
  import { paramsStore } from "./params.svelte";
  import type { Action } from "svelte/action";

  const routes = {
    "/": Home,
    "/posts": Posts,
    "/posts/:id": Post,
    404: NotFound,
  };

  let CurrentRoute = $state<Component>();

  function onNavigate() {
    const currentRoute = window.location.pathname;
    if (currentRoute in routes) {
      CurrentRoute = routes[currentRoute];
      return;
    }

    const dynamicRoutes = Object.keys(routes).filter((route) =>
      route.includes(":")
    );
    for (const route of dynamicRoutes) {
      const routeParts = route.split("/");
      const currentRouteParts = currentRoute.split("/");
      if (routeParts.length !== currentRouteParts.length) continue;

      const params = {};
      let isMatch = true;
      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(":")) {
          params[routeParts[i].slice(1)] = currentRouteParts[i];
          continue;
        }

        if (routeParts[i] !== currentRouteParts[i]) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        CurrentRoute = routes[route];
        Object.assign(paramsStore, params);
        return;
      }
    }

    CurrentRoute = undefined;
  }

  function onClick(event: MouseEvent) {
    const anchor = (event.target as HTMLElement).closest("a");
    if (!anchor) return;

    const url = new URL(anchor.href);
    const currentOrigin = window.location.origin;
    if (url.origin !== currentOrigin) return;

    event.preventDefault();
    window.history.pushState({}, "", anchor.href);
    onNavigate();
  }

  $effect(() => {
    onNavigate();

    window.addEventListener("popstate", onNavigate);
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("popstate", onNavigate);
      window.removeEventListener("click", onClick);
    };
  });

  function href(url: string) {
    return url;
  }
</script>

<a href={href("/")}>Home</a>
<a href={href("/posts")}>Posts</a>
{#if CurrentRoute}
  <CurrentRoute />
{:else if routes[404]}
  {@const NotFoundRoute = routes[404]}
  <NotFoundRoute />
{/if}
