// ===== COMPOSANTS BLOCKS SGQ =====

document.addEventListener('alpine:init', () => {
    // Composant réutilisable pour les blocks SGQ
    Alpine.data('sgqBlock', (initialOpen = true) => ({
        isOpen: initialOpen,
        toggle() { this.isOpen = !this.isOpen; }
    }));
    
    // Directive personnalisée pour les transitions SGQ
    Alpine.directive('sgq-transitions', (el) => {
        el.setAttribute('x-show', 'isOpen');
        el.setAttribute('x-transition:enter', 'transition ease-out duration-300');
        el.setAttribute('x-transition:enter-start', 'opacity-0 transform -translate-y-4');
        el.setAttribute('x-transition:enter-end', 'opacity-100 transform translate-y-0');
        el.setAttribute('x-transition:leave', 'transition ease-in duration-200');
        el.setAttribute('x-transition:leave-start', 'opacity-100 transform translate-y-0');
        el.setAttribute('x-transition:leave-end', 'opacity-0 transform -translate-y-4');
    });
});