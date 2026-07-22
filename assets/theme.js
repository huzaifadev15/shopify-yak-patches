// Mobile sidebar
const openBtn = document.getElementById('mobileMenuOpen');
const closeBtn = document.getElementById('mobileMenuClose');
const sidebar = document.getElementById('mobileSidebar');
const overlay = document.getElementById('sidebarOverlay');

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

if (openBtn) openBtn.addEventListener('click', openSidebar);
if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
if (overlay) overlay.addEventListener('click', closeSidebar);

// Gallery slider: match React timing (1px every 30ms with halfway reset)
const track = document.getElementById('galleryTrack');
const trackScroller = track ? track.parentElement : null;
if (track && trackScroller && track.children.length > 0 && !track.dataset.scrollInit) {
  track.dataset.scrollInit = '1';
  let scrollAmount = 0;
  const scrollSpeed = 1;

  window.setInterval(() => {
    scrollAmount += scrollSpeed;
    if (scrollAmount >= trackScroller.scrollWidth / 2) {
      scrollAmount = 0;
    }
    trackScroller.scrollLeft = scrollAmount;
  }, 30);
}

// Capsule tabs scroll arrow
const capsuleScroll = document.getElementById('capsuleTabsScroll');
const capsuleArrow = document.getElementById('capsuleTabArrow');
if (capsuleArrow && capsuleScroll) {
  let capsuleDragStartX = 0;
  let capsuleDragStartScroll = 0;
  let capsuleIsDragging = false;
  let capsuleDidDrag = false;
  const activeCapsuleTab = capsuleScroll.querySelector('.capsule-tab.is-active');

  const stopCapsuleDrag = () => {
    capsuleIsDragging = false;
    capsuleScroll.classList.remove('is-dragging');
  };

  capsuleScroll.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') return;

    capsuleDragStartX = event.clientX;
    capsuleDragStartScroll = capsuleScroll.scrollLeft;
    capsuleIsDragging = true;
    capsuleDidDrag = false;
    capsuleScroll.classList.add('is-dragging');
  });

  capsuleScroll.addEventListener('pointermove', (event) => {
    if (!capsuleIsDragging) return;

    const dragDistance = event.clientX - capsuleDragStartX;
    if (Math.abs(dragDistance) > 12) {
      capsuleDidDrag = true;
      event.preventDefault();
    }

    capsuleScroll.scrollLeft = capsuleDragStartScroll - (dragDistance * 2.4);
  });

  capsuleScroll.addEventListener('pointerup', stopCapsuleDrag);
  capsuleScroll.addEventListener('pointercancel', stopCapsuleDrag);
  capsuleScroll.addEventListener('click', (event) => {
    if (!capsuleDidDrag) return;

    event.preventDefault();
    capsuleDidDrag = false;
  }, true);

  if (activeCapsuleTab) {
    window.requestAnimationFrame(() => {
      activeCapsuleTab.scrollIntoView({ inline: 'center', block: 'nearest' });
    });
  }

  capsuleArrow.addEventListener('click', () => {
    capsuleScroll.scrollBy({ left: 320, behavior: 'smooth' });
  });
}
