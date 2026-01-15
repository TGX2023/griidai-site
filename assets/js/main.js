// GriidAi Landing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
  initMobileNav();
  initSmoothScroll();
  initCaptcha();
  initForm();
});

// Mobile Navigation
function initMobileNav() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const menuIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function() {
      const isOpen = mobileNav.classList.toggle('active');
      menuIcon.classList.toggle('hidden', isOpen);
      closeIcon.classList.toggle('hidden', !isOpen);
    });

    // Close menu when clicking a link
    mobileNav.querySelectorAll('button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        mobileNav.classList.remove('active');
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
      });
    });
  }
}

// Smooth Scroll
function initSmoothScroll() {
  document.querySelectorAll('[data-scroll-to]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('data-scroll-to');
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// Captcha
let captchaNum1, captchaNum2, captchaAnswer;

function initCaptcha() {
  generateCaptcha();
  
  const refreshBtn = document.getElementById('refresh-captcha');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', generateCaptcha);
  }
}

function generateCaptcha() {
  captchaNum1 = Math.floor(Math.random() * 9) + 1;
  captchaNum2 = Math.floor(Math.random() * 9) + 1;
  captchaAnswer = captchaNum1 + captchaNum2;
  
  const captchaText = document.getElementById('captcha-text');
  if (captchaText) {
    captchaText.textContent = 'What is ' + captchaNum1 + ' + ' + captchaNum2 + '?';
  }
  
  const captchaInput = document.getElementById('captcha-answer');
  if (captchaInput) {
    captchaInput.value = '';
  }
  
  clearError('captcha-answer');
}

function validateCaptcha() {
  const input = document.getElementById('captcha-answer');
  const userAnswer = parseInt(input.value, 10);
  
  if (isNaN(userAnswer)) {
    showError('captcha-answer', 'Please answer the security question');
    return false;
  }
  
  if (userAnswer !== captchaAnswer) {
    showError('captcha-answer', 'Incorrect answer. Please try again.');
    generateCaptcha();
    return false;
  }
  
  return true;
}

// Form Handling
function initForm() {
  const form = document.getElementById('early-access-form');
  const gisUsageInput = document.getElementById('gis-usage');
  
  if (gisUsageInput) {
    gisUsageInput.addEventListener('input', updateWordCount);
  }
  
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(function(word) {
    return word.length > 0;
  }).length;
}

function updateWordCount() {
  const textarea = document.getElementById('gis-usage');
  const countEl = document.getElementById('word-count');
  const limitEl = document.getElementById('word-limit-warning');
  
  if (textarea && countEl) {
    const words = countWords(textarea.value);
    countEl.textContent = words + '/50 words';
    
    if (words > 50) {
      countEl.classList.add('error');
      if (limitEl) limitEl.classList.remove('hidden');
    } else {
      countEl.classList.remove('error');
      if (limitEl) limitEl.classList.add('hidden');
    }
  }
}

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + '-error');
  
  if (field) {
    field.style.borderColor = 'hsl(0, 72%, 48%)';
  }
  
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }
}

function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + '-error');
  
  if (field) {
    field.style.borderColor = '';
  }
  
  if (errorEl) {
    errorEl.classList.add('hidden');
  }
}

function clearAllErrors() {
  const errorEls = document.querySelectorAll('.form-error');
  errorEls.forEach(function(el) {
    el.classList.add('hidden');
  });
  
  const inputs = document.querySelectorAll('.form-input, .form-textarea');
  inputs.forEach(function(input) {
    input.style.borderColor = '';
  });
}

function validateForm() {
  let isValid = true;
  clearAllErrors();
  
  // Full Name (required)
  const fullName = document.getElementById('full-name');
  if (!fullName.value.trim()) {
    showError('full-name', 'Full name is required');
    isValid = false;
  }
  
  // Email (required)
  const email = document.getElementById('email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim()) {
    showError('email', 'Email address is required');
    isValid = false;
  } else if (!emailRegex.test(email.value)) {
    showError('email', 'Please enter a valid email address');
    isValid = false;
  }
  
  // GIS Usage word limit
  const gisUsage = document.getElementById('gis-usage');
  if (gisUsage && countWords(gisUsage.value) > 50) {
    showError('gis-usage', 'Please limit to 50 words');
    isValid = false;
  }
  
  // Captcha validation
  if (!validateCaptcha()) {
    isValid = false;
  }
  
  return isValid;
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  // Check honeypot
  const honeypot = document.getElementById('website');
  if (honeypot && honeypot.value) {
    // Bot detected, silently fail
    showSuccessState();
    return;
  }
  
  if (!validateForm()) {
    return;
  }
  
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');
  
  // Show loading state
  submitBtn.disabled = true;
  btnText.textContent = 'Submitting...';
  btnSpinner.classList.remove('hidden');
  
  // Collect form data
  const formData = {
    fullName: document.getElementById('full-name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    city: document.getElementById('city').value.trim(),
    country: document.getElementById('country').value.trim(),
    organization: document.getElementById('organization').value.trim(),
    role: document.getElementById('role').value.trim(),
    linkedin: document.getElementById('linkedin').value.trim(),
    gisUsage: document.getElementById('gis-usage').value.trim(),
    timestamp: new Date().toISOString()
  };
  
// Google Apps Script integration
//const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_DQVoka8Ng6l9N0phVPdWPNQGeIcnVzpxnjgfjSPXMZybS1QHhm1C1BgKo4Qbtpq6/exec';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzPdqBc2O02PDhgsugcN8YIyEZUDdzO8j7zuXD8LjXrldvOl8cwURAsIwSaAbOC0Ddg/exec';
  
  
  // Uncomment this when you have your Google Apps Script URL:
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
  })
  .then(function() {
    showSuccessState();
  })
  .catch(function(error) {
    alert('Submission failed. Please try again.');
    console.error('Error:', error);
  })
  .finally(function() {
    submitBtn.disabled = false;
    btnText.textContent = 'Join the Waitlist';
    btnSpinner.classList.add('hidden');
  });
  
}

function showSuccessState() {
  const formContainer = document.getElementById('form-container');
  const successContainer = document.getElementById('success-container');
  
  if (formContainer && successContainer) {
    formContainer.classList.add('hidden');
    successContainer.classList.remove('hidden');
  }
}

function resetForm() {
  const formContainer = document.getElementById('form-container');
  const successContainer = document.getElementById('success-container');
  const form = document.getElementById('early-access-form');
  
  if (formContainer && successContainer) {
    successContainer.classList.add('hidden');
    formContainer.classList.remove('hidden');
  }
  
  if (form) {
    form.reset();
    updateWordCount();
  }
  
  generateCaptcha();
  clearAllErrors();
}
