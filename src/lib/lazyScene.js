export function lazyScene(container, loader, options = {}) {
  let scene = null;
  let loading = false;
  let visible = false;

  const io = new IntersectionObserver(
    async ([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !scene && !loading) {
        loading = true;
        try {
          const mod = await loader();
          scene = await mod.createScene(container, options);
          container.classList.add('is-ready');
        } catch (err) {
          console.warn('[scene] failed to start, using fallback', err);
          container.classList.add('is-fallback');
          return;
        }
      }
      if (!scene) return;
      visible ? scene.start() : scene.stop();
    },
    { rootMargin: '200px 0px' }
  );
  io.observe(container);

  document.addEventListener('visibilitychange', () => {
    if (!scene) return;
    document.hidden ? scene.stop() : visible && scene.start();
  });

  return {
    get scene() {
      return scene;
    },
  };
}
