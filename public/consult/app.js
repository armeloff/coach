document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Navigation & Hamburger Morph
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    
    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', () => {
            mobileNav.classList.toggle('is-open');
            const isOpen = mobileNav.classList.contains('is-open');
            const lines = hamburger.querySelectorAll('span');
            
            if (isOpen) {
                // Morph to 'X'
                lines[0].style.transform = 'translateY(6px) rotate(45deg)';
                lines[1].style.opacity = '0';
                lines[2].style.transform = 'translateY(-6px) rotate(-45deg)';
                
                // Stagger transition on links
                mobileLinks.forEach((link, idx) => {
                    link.style.transitionDelay = `${idx * 80 + 100}ms`;
                    link.style.opacity = '1';
                    link.style.transform = 'translateY(0)';
                });
            } else {
                // Restore lines
                lines[0].style.transform = 'none';
                lines[1].style.opacity = '1';
                lines[2].style.transform = 'none';
                
                // Hide links
                mobileLinks.forEach(link => {
                    link.style.transitionDelay = '0ms';
                    link.style.opacity = '0';
                    link.style.transform = 'translateY(20px)';
                });
            }
        });
        
        // Close menu on clicking links
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('is-open');
                const lines = hamburger.querySelectorAll('span');
                lines[0].style.transform = 'none';
                lines[1].style.opacity = '1';
                lines[2].style.transform = 'none';
                
                mobileLinks.forEach(l => {
                    l.style.transitionDelay = '0ms';
                    l.style.opacity = '0';
                    l.style.transform = 'translateY(20px)';
                });
            });
        });
    }

    // 2. GPU-Accelerated Scroll Entry Reveal (IntersectionObserver)
    const revealElements = document.querySelectorAll('.reveal');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Once revealed, no need to watch anymore
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    // 3. Clean Accordion behavior for FAQ
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionRow = item.querySelector('.faq-question-row');
        const answer = item.querySelector('.faq-answer');
        
        if (questionRow && answer) {
            questionRow.addEventListener('click', () => {
                const isOpen = item.classList.contains('is-open');
                
                // Close all other items for a clean single-open layout
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('is-open');
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        if (otherAnswer) {
                            otherAnswer.style.maxHeight = '0px';
                        }
                    }
                });
                
                if (isOpen) {
                    item.classList.remove('is-open');
                    answer.style.maxHeight = '0px';
                } else {
                    item.classList.add('is-open');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            });
        }
    });

    // 4. Subtle Ambient Magnetic effect for premium CTA buttons
    const premiumButtons = document.querySelectorAll('.btn-premium');
    premiumButtons.forEach(btn => {
        btn.addEventListener('mousedown', () => {
            btn.style.transform = 'scale(0.96)';
        });
        btn.addEventListener('mouseup', () => {
            btn.style.transform = 'scale(1)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'none';
        });
    });

    // 5. Magnetic Cursor Trail & Card Glow Effect
    const cursor = document.getElementById('customCursor');
    let mouse = { x: 0, y: 0 };
    let cursorPosition = { x: 0, y: 0 };
    
    // Only enable custom cursor on non-touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (cursor && !isTouchDevice) {
        document.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        
        // Custom cursor spring interpolation
        const updateCursor = () => {
            const dx = mouse.x - cursorPosition.x;
            const dy = mouse.y - cursorPosition.y;
            cursorPosition.x += dx * 0.15;
            cursorPosition.y += dy * 0.15;
            cursor.style.transform = `translate3d(${cursorPosition.x}px, ${cursorPosition.y}px, 0)`;
            requestAnimationFrame(updateCursor);
        };
        updateCursor();
        
        // Hover reactions for magnetic buttons & interactive elements
        const hoverables = document.querySelectorAll('.btn-premium, .btn-secondary, .bezel-outer, .nav-link, .faq-item');
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('is-hovering');
                if (el.classList.contains('btn-premium') || el.classList.contains('btn-secondary')) {
                    cursor.classList.add('is-magnetic');
                }
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('is-hovering', 'is-magnetic');
            });
        });
    }

    // 6. Interactive Accent Glow on Bento Cards
    const bentoCards = document.querySelectorAll('.bezel-outer');
    bentoCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
});
