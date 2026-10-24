export class StepForm {
    constructor(formId, totalSteps = 2) {
        this.form = document.getElementById(formId);
        this.currentStep = 1;
        this.totalSteps = totalSteps;
        this.steps = [];
        this.init();
    }

    init() {
        this.setupSteps();
        this.showStep(1);
    }

    setupSteps() {
        for (let i = 1; i <= this.totalSteps; i++) {
            const step = this.form.querySelector(`[data-step="${i}"]`);
            if (step) {
                this.steps.push(step);
            }
        }
    }

    showStep(stepNumber) {
        this.currentStep = stepNumber;
        
        this.steps.forEach((step, index) => {
            if (step) {
                if (index + 1 === stepNumber) {
                    step.classList.remove('hidden');
                    step.classList.add('login-animate-fade-in-up');
                } else {
                    step.classList.add('hidden');
                    step.classList.remove('login-animate-fade-in-up');
                }
            }
        });

        this.updateButtons();
        this.updateStepIndicators();
        this.updateStepDescription();
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.showStep(this.currentStep + 1);
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }

    updateButtons() {
        const nextBtn = this.form.querySelector('[data-action="next"]');
        const prevBtn = this.form.querySelector('[data-action="prev"]');
        const submitBtn = this.form.querySelector('[data-action="submit"]');
        const previewBtn = this.form.querySelector('[data-action="preview"]');

        if (nextBtn) {
            nextBtn.classList.toggle('hidden', this.currentStep === this.totalSteps);
        }

        if (prevBtn) {
            prevBtn.classList.toggle('hidden', this.currentStep === 1);
        }

        if (submitBtn) {
            submitBtn.classList.toggle('hidden', this.currentStep !== this.totalSteps);
        }

        if (previewBtn) {
            previewBtn.classList.toggle('hidden', this.currentStep !== this.totalSteps);
        }
    }

    updateStepIndicators() {
        const indicators = this.form.querySelectorAll('[data-step-indicator]');
        indicators.forEach((indicator, index) => {
            if (index + 1 === this.currentStep) {
                indicator.classList.remove('bg-gray-300', 'text-gray-600');
                indicator.classList.add('bg-green-700', 'text-white');
            } else if (index + 1 < this.currentStep) {
                indicator.classList.remove('bg-gray-300', 'text-gray-600');
                indicator.classList.add('bg-green-500', 'text-white');
            } else {
                indicator.classList.remove('bg-green-700', 'bg-green-500', 'text-white');
                indicator.classList.add('bg-gray-300', 'text-gray-600');
            }
        });
    }

    updateStepDescription() {
        const descriptionElement = document.getElementById('stepDescription');
        if (descriptionElement) {
            const descriptions = {
                1: 'Basic Information',
                2: this.totalSteps === 2 ? 'Password & Role' : 'Department & Role',
                3: 'Profile & Password'
            };
            descriptionElement.textContent = descriptions[this.currentStep] || '';
        }
    }

    getCurrentStep() {
        return this.currentStep;
    }
}

export function initStepForm(formId, totalSteps = 2, onNextCallback, onPrevCallback, onPreviewCallback) {
    const stepForm = new StepForm(formId, totalSteps);
    
    const nextBtn = stepForm.form.querySelector('[data-action="next"]');
    const prevBtn = stepForm.form.querySelector('[data-action="prev"]');
    const previewBtn = stepForm.form.querySelector('[data-action="preview"]');

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (onNextCallback) {
                onNextCallback(() => stepForm.nextStep());
            } else {
                stepForm.nextStep();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (onPrevCallback) {
                onPrevCallback();
            }
            stepForm.prevStep();
        });
    }

    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            if (onPreviewCallback) {
                onPreviewCallback();
            }
        });
    }

    return stepForm;
}
