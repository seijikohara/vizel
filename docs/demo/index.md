# Demo

Try the demos for each framework:

<div class="demo-links">
  <a href="/vizel/demo/react/" target="_blank" class="demo-link">
    <img src="../public/react.svg" alt="React" class="demo-icon" />
    <span class="demo-name">React 19</span>
  </a>
  <a href="/vizel/demo/vue/" target="_blank" class="demo-link">
    <img src="../public/vue.svg" alt="Vue" class="demo-icon" />
    <span class="demo-name">Vue 3</span>
  </a>
  <a href="/vizel/demo/svelte/" target="_blank" class="demo-link">
    <img src="../public/svelte.svg" alt="Svelte" class="demo-icon" />
    <span class="demo-name">Svelte 5</span>
  </a>
</div>

All frameworks share the same core extensions and features from `@vizel/core`.

<style>
.demo-links {
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
}

.demo-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 2rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
  flex: 1;
}

.demo-link:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
}

.demo-icon {
  width: 48px;
  height: 48px;
}

.demo-name {
  font-weight: 600;
  color: var(--vp-c-text-1);
}
</style>
