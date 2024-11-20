import { type Component } from "svelte";
import { matchRoute } from "./match-route";

export type Routes = {
  [key: `/${string}`]: Component | Routes;
  "*"?: Component;
  layout?: Component<any>;
};

let routes: Routes;
let routeComponent = $state<Component>();
let paramsStore = $state({});

export function createRouter(r: Routes) {
  routes = r;

  return {
    get component() {
      return routeComponent;
    },
    typedPath(path: string) {
      return path;
    },
    params() {
      let readonly = $derived(paramsStore);
      return readonly;
    },
    setup() {
      $effect(() => {
        onNavigate();

        window.addEventListener("popstate", onNavigate);
        window.addEventListener("click", onClick);

        return () => {
          window.removeEventListener("popstate", onNavigate);
          window.removeEventListener("click", onClick);
        };
      });
    },
  };
}

function onNavigate() {
  const { match, params } = matchRoute(window.location.pathname, routes);
  if (match) {
    routeComponent = match;
    paramsStore = params;
  }
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
