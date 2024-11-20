<script lang="ts">
  import { params } from "../App.svelte";

  // @ts-expect-error TODO: typesage params
  const { id } = params();
</script>

<h1>A post with the slug {id}</h1>
