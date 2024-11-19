<script lang="ts">
  import { params } from "../params.svelte";

  const { id } = params();
</script>

<h1>A post with the slug {id}</h1>
