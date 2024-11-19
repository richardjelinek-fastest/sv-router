export let paramsStore = $state({});

export function params() {
  let readonly = $derived(paramsStore);
  return readonly;
}
