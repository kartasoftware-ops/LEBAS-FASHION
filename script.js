document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // Footer Year
    // ==========================================
    const yearSpan = document.getElementById("year");
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // ==========================================
    // Mobile Navigation Toggle
    // ==========================================
    const mobileMenu = document.getElementById("mobile-menu");
    const navLinks = document.getElementById("nav-links");

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            const bars = mobileMenu.querySelectorAll(".bar");
            if (navLinks.classList.contains("active")) {
                bars[0].style.transform = "rotate(45deg) translate(5px, 5px)";
                bars[1].style.opacity = "0";
                bars[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
            } else {
                bars[0].style.transform = "none";
                bars[1].style.opacity = "1";
                bars[2].style.transform = "none";
            }
        });
    }

    // Close mobile menu on link click
    document.querySelectorAll(".nav-links li a").forEach(item => {
        item.addEventListener("click", () => {
            if (navLinks && navLinks.classList.contains("active")) {
                navLinks.classList.remove("active");
                const bars = mobileMenu.querySelectorAll(".bar");
                bars[0].style.transform = "none";
                bars[1].style.opacity = "1";
                bars[2].style.transform = "none";
            }
        });
    });

    // ==========================================
    // Navbar Scroll Effect
    // ==========================================
    const navbar = document.getElementById("navbar");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });

    // ==========================================
    // Contact Form Handler
    // ==========================================
    const contactForm = document.getElementById("contact-form");
    const formSuccess = document.getElementById("form-success");

    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            const formData = new FormData(contactForm);

            fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            })
            .then(async (response) => {
                let json = await response.json();
                if (response.status == 200) {
                    contactForm.style.display = "none";
                    if (formSuccess) {
                        formSuccess.style.display = "block";
                        if (typeof gsap !== "undefined") {
                            gsap.from(formSuccess, {
                                scale: 0.8,
                                opacity: 0,
                                duration: 0.6,
                                ease: "back.out(1.7)"
                            });
                        }
                    }
                } else {
                    console.error("Web3Forms Error:", json);
                    alert("Something went wrong! Please check your configuration and try again.");
                }
            })
            .catch(error => {
                console.error("Fetch Error:", error);
                alert("Something went wrong! Please check your internet connection.");
            })
            .finally(() => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                contactForm.reset();
            });
        });
    }

    // ==========================================
    // GSAP Animations
    // ==========================================
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.warn("GSAP or ScrollTrigger not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // --- 1. Hero Entrance Animation ---
    const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

    heroTl
        .from(".hero-tag", { y: 20, opacity: 0, duration: 0.6 })
        .from(".hero-title", { y: 60, opacity: 0, duration: 1 }, "-=0.3")
        .from(".hero-subtitle", { y: 30, opacity: 0, duration: 0.8 }, "-=0.6")
        .from(".hero-buttons .btn", { y: 20, opacity: 0, stagger: 0.2, duration: 0.6 }, "-=0.4")
        .from(".hero-img-pillar", { y: 40, opacity: 0, stagger: 0.2, duration: 0.8 }, "-=0.4");

    // Hero Image Grid Continuous Floating Animation
    gsap.to(".pillar-down", { y: "+=20", duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".pillar-up", { y: "-=20", duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" });

    // Floating background shapes
    gsap.to(".shape-1", { x: 30, y: -20, duration: 6, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".shape-2", { x: -20, y: 25, duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".shape-3", { x: 15, y: -15, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" });

    // --- 2. About Section ---
    gsap.from(".about .scroll-reveal", {
        scrollTrigger: { trigger: ".about", start: "top 80%" },
        y: 50, opacity: 0, duration: 1, ease: "power3.out"
    });
    gsap.from(".about .scroll-reveal-right", {
        scrollTrigger: { trigger: ".about", start: "top 75%" },
        x: 80, opacity: 0, duration: 1.2, ease: "power3.out"
    });
    gsap.from(".experience-badge", {
        scrollTrigger: { trigger: ".about", start: "top 70%" },
        scale: 0, opacity: 0, duration: 0.8, ease: "back.out(2)", delay: 0.4
    });

    // --- 3. Core Values Cards (Staggered) ---
    gsap.from(".staggered-card", {
        scrollTrigger: { trigger: ".values-grid", start: "top 85%" },
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "back.out(1.4)",
        onComplete: function() {
            document.querySelectorAll(".staggered-card").forEach(card => {
                card.style.opacity = "1";
                card.style.visibility = "visible";
                card.style.transform = "none";
            });
        }
    });

    // --- 4. Expanding Panels Carousel (Industries) ---
    const panels = document.querySelectorAll(".panel");
    let autoPlayInterval = null;
    let currentIndex = 0;

    function activatePanel(panel) {
        // Remove active from all
        panels.forEach(p => p.classList.remove("active"));
        // Set new active
        panel.classList.add("active");
        // Update current index
        currentIndex = Array.from(panels).indexOf(panel);
    }

    // Click to expand
    panels.forEach(panel => {
        panel.addEventListener("click", () => {
            activatePanel(panel);
            // Restart auto-play timer
            restartAutoPlay();
        });
    });

    // Auto-rotate through panels
    function autoRotate() {
        currentIndex = (currentIndex + 1) % panels.length;
        activatePanel(panels[currentIndex]);
    }

    function restartAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(autoRotate, 3000);
    }

    // Start auto-play when the carousel scrolls into view
    ScrollTrigger.create({
        trigger: ".carousel-wrapper",
        start: "top 85%",
        onEnter: () => {
            restartAutoPlay();
        }
    });

    // Pause auto-play on hover
    const carouselEl = document.getElementById("carousel-panels");
    if (carouselEl) {
        carouselEl.addEventListener("mouseenter", () => {
            if (autoPlayInterval) clearInterval(autoPlayInterval);
        });
        carouselEl.addEventListener("mouseleave", () => {
            restartAutoPlay();
        });
    }

    // GSAP entrance animation for the panels
    gsap.from(".panel", {
        scrollTrigger: { trigger: ".carousel-wrapper", start: "top 85%" },
        y: 60,
        opacity: 0,
        duration: 0.6,
        stagger: 0.07,
        ease: "power3.out"
    });

    // --- 5. Why Choose Us Section ---
    gsap.from(".why-us .scroll-reveal-left", {
        scrollTrigger: { trigger: ".why-us", start: "top 80%" },
        x: -80, opacity: 0, duration: 1.2, ease: "power3.out"
    });
    gsap.from(".why-us .scroll-reveal", {
        scrollTrigger: { trigger: ".why-us", start: "top 80%" },
        y: 50, opacity: 0, duration: 1, ease: "power3.out"
    });
    gsap.from(".feature-list li", {
        scrollTrigger: { trigger: ".feature-list", start: "top 85%" },
        x: 40, opacity: 0, duration: 0.6, stagger: 0.12, ease: "power2.out"
    });

    // --- 6. Contact Section ---
    const contactCards = document.querySelectorAll(".bounce-in");
    contactCards.forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: { trigger: ".contact", start: "top 80%" },
            scale: 0.92,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.15,
            ease: "back.out(1.4)"
        });
    });

    // --- 7. Section Tags & Titles Reveal ---
    document.querySelectorAll(".section-tag").forEach(tag => {
        gsap.from(tag, {
            scrollTrigger: { trigger: tag, start: "top 90%" },
            y: 15, opacity: 0, duration: 0.5, ease: "power2.out"
        });
    });
    document.querySelectorAll(".section-title").forEach(title => {
        gsap.from(title, {
            scrollTrigger: { trigger: title, start: "top 90%" },
            y: 25, opacity: 0, duration: 0.7, ease: "power2.out"
        });
    });

});
