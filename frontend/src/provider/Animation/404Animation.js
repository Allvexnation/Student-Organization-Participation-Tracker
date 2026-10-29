export function init404Animation() {
    if (document.getElementById('404-animation-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = '404-animation-styles';
    style.textContent = `
        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        @keyframes fadeInLeft {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes fadeInRight {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes imageZoomIn {
            from {
                opacity: 0;
                transform: scale(0.8);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
        }

        .card-animate {
            animation: fadeInScale 0.4s ease-out forwards;
        }

        .logo-animate {
            animation: imageZoomIn 0.5s ease-out forwards;
        }

        .heading-animate {
            animation: fadeIn 0.5s ease-out forwards;
        }

        .text-animate {
            animation: fadeInUp 0.4s ease-out forwards;
        }

        .button-animate {
            animation: fadeInUp 0.4s ease-out forwards;
        }

        .footer-animate {
            animation: fadeInUp 0.3s ease-out forwards;
        }

        .pulse-effect {
            animation: pulse 2s ease-in-out infinite;
        }

        .button-hover-effect {
            transition: all 0.2s ease;
        }

        .button-hover-effect:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .button-hover-effect:active {
            transform: scale(0.98);
        }
    `;
    document.head.appendChild(style);
}

export function animate404Elements() {
    init404Animation();

    const card = document.querySelector('.bg-white.rounded-2xl');
    const logo = card?.querySelector('img');
    const heading = card?.querySelector('h1');
    const paragraphs = card?.querySelectorAll('p');
    const button = card?.querySelector('button');
    const footer = card?.querySelector('.border-t');

    if (card) {
        card.classList.add('card-animate');
    }

    if (logo) {
        logo.classList.add('logo-animate');
        logo.style.animationDelay = '0.1s';
    }

    if (heading) {
        heading.classList.add('heading-animate');
        heading.style.animationDelay = '0.2s';
    }

    if (paragraphs) {
        paragraphs.forEach((p, index) => {
            p.classList.add('text-animate');
            p.style.animationDelay = `${0.3 + index * 0.1}s`;
        });
    }

    if (button) {
        button.classList.add('button-animate', 'button-hover-effect');
        button.style.animationDelay = '0.5s';
    }

    if (footer) {
        footer.classList.add('footer-animate');
        footer.style.animationDelay = '0.6s';
    }
}
