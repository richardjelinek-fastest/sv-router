<script lang="ts">
	import { queryParams } from '../App.svelte';

	// @ts-expect-error TODO: typesafe queryParams
	const { id } = queryParams();
</script>

<h1>A post with the slug {id}</h1>
