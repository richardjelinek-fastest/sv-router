<script lang="ts" module>
  import { createRouter } from "svr";
  import Home from "./routes/Home.svelte";
  import Posts from "./routes/Posts.svelte";
  import DynamicPost from "./routes/DynamicPost.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import Layout from "./Layout.svelte";
  import About from "./routes/About.svelte";
  import StaticPost from "./routes/StaticPost.svelte";

  let router = createRouter({
    "/": Home,
    "/about": About,
    "/posts": {
      "/": Posts,
      "/static": StaticPost,
      "/:id": DynamicPost,
      layout: Layout,
    },
    "*": NotFound,
  });

  export const p = router.typedPath;
  export const params = router.params;
</script>

<script lang="ts">
  router.setup();
</script>

<a href={p("/")}>Home</a>
<a href={p("/about")}>About</a>
<a href={p("/posts")}>Posts</a>
<router.component />
