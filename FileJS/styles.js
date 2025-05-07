// Scroll-to-top functionality
function scrollToTop() {
window.scrollTo({
    top: 0,
    behavior: 'smooth'
});
}

function toggleMenu() {
    const menu = document.getElementById('menuContent');
    menu.classList.toggle('open');
}