// Layout initialization: Direction-aware sticky right sidebar

export function initLayout() {
  // Direction-Aware (Bidirectional) Sticky Scrolling for Right Sidebar (.right-widgets)
  const rightWidgets = document.querySelector(".right-widgets");
  const searchBar = document.querySelector(".right .sticky");

  if (rightWidgets) {
    let lastScrollY = window.scrollY;
    let currentTop = 0;
    let isTicking = false;

    const updateStickyPosition = () => {
      const scrollY = window.scrollY;
      const deltaY = scrollY - lastScrollY;
      lastScrollY = scrollY;

      const windowHeight = window.innerHeight;
      const widgetsHeight = rightWidgets.offsetHeight;
      const searchBarHeight = searchBar ? searchBar.offsetHeight : 50;

      if (widgetsHeight + searchBarHeight <= windowHeight) {
        rightWidgets.style.position = "sticky";
        rightWidgets.style.top = searchBarHeight + "px";
        isTicking = false;
        return;
      }

      const minTop = windowHeight - widgetsHeight;
      const maxTop = searchBarHeight;

      currentTop = currentTop - deltaY;
      currentTop = Math.max(minTop, Math.min(maxTop, currentTop));

      rightWidgets.style.position = "sticky";
      rightWidgets.style.top = currentTop + "px";
      isTicking = false;
    };

    const handleScroll = () => {
      if (!isTicking) {
        requestAnimationFrame(updateStickyPosition);
        isTicking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    updateStickyPosition();
  }
}
