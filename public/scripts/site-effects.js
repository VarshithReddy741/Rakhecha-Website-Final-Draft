// Remaining page-level vanilla behaviors ported from the legacy main.js.
// Header's own toggles, founder-card rendering, and mission/vision
// rendering are now owned by their respective Astro components — this
// file only keeps the generic, page-agnostic behaviors those components
// don't own: horizontally auto-scrolling carousels, the mobile
// founder-carousel arrow buttons, and the "Our Businesses" reveal-on-scroll
// animation. Loaded only on pages that use these classes/attributes.

// Seamless CSS-animation card marquees (.marquee-track, paired with the
// @keyframes/utility classes in global.css). Pauses on hover, touch, and
// mousedown/drag alike — one class toggle drives all three, so it behaves
// the same on desktop and mobile.
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".marquee-track").forEach((track) => {
    const wrapper = track.parentElement;
    if (!wrapper) return;

    const pause = () => track.classList.add("marquee-paused");
    const resume = () => track.classList.remove("marquee-paused");

    wrapper.addEventListener("mouseenter", pause);
    wrapper.addEventListener("mouseleave", resume);
    wrapper.addEventListener("touchstart", pause, { passive: true });
    wrapper.addEventListener("touchend", resume, { passive: true });
    wrapper.addEventListener("touchcancel", resume, { passive: true });
    wrapper.addEventListener("mousedown", pause);
    wrapper.addEventListener("mouseup", resume);
  });
});

// Slow auto-scroll for horizontally-scrolling card carousels (.auto-scroll-x).
// Loops back to the start once it reaches the end. On breakpoints where a
// carousel becomes a static grid (no overflow), incrementing scrollLeft is
// simply a no-op, so this is safe to run unconditionally on every element.
document.addEventListener("DOMContentLoaded", () => {
  const SPEED_PX_PER_FRAME = 0.6;
  const RESUME_DELAY_MS = 2500;

  document.querySelectorAll(".auto-scroll-x").forEach((el) => {
    let paused = false;
    let resumeTimer = null;
    const hoverPause = el.classList.contains("auto-scroll-x-hover-pause");

    const pause = () => {
      paused = true;
      if (resumeTimer) clearTimeout(resumeTimer);
    };
    const resumeNow = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      paused = false;
    };
    const resumeSoon = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        paused = false;
      }, RESUME_DELAY_MS);
    };

    if (hoverPause) {
      el.addEventListener("mouseenter", pause);
      el.addEventListener("mouseleave", resumeNow);
      el.addEventListener("touchstart", pause, { passive: true });
      el.addEventListener("touchend", resumeNow, { passive: true });
    } else {
      el.addEventListener("touchstart", pause, { passive: true });
      el.addEventListener("touchend", resumeSoon, { passive: true });
      el.addEventListener("mousedown", pause);
      el.addEventListener("mouseup", resumeSoon);
      el.addEventListener("wheel", () => { pause(); resumeSoon(); }, { passive: true });
    }

    function step() {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (!paused && maxScroll > 0) {
        if (el.scrollLeft >= maxScroll - 1) {
          el.scrollLeft = 0;
        } else {
          el.scrollLeft += SPEED_PX_PER_FRAME;
        }
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
});

// Arrow buttons for the (manually, not auto-) scrollable founder-card
// carousels on mobile. Each click scrolls by roughly one card width.
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".founder-scroll-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.scrollTarget);
      if (!target) return;
      const dir = Number(btn.dataset.scrollDir) || 1;
      target.scrollBy({ left: dir * target.clientWidth * 0.85, behavior: "smooth" });
    });
  });
});

// Reveal-on-scroll: any element with class "hero-card-anim" (the Home
// Page's "Our Businesses" cards) fades/slides in the first time it enters
// the viewport, rather than animating immediately on page load where it'd
// likely be missed if the element starts below the fold.
document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll(".hero-card-anim");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  targets.forEach((el) => observer.observe(el));
});
