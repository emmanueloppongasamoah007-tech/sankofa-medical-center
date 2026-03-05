/* ============================================================
   booking.js — Appointment Booking Form Interactivity
   Hospital Booking System
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------
     1. DOM References
  ------------------------------------------------------------------ */
  const form           = document.getElementById('booking-form');
  const confirmationBox = document.getElementById('confirmation-box');

  if (!form) return; // Guard — only run on booking page

  // Field elements
  const fullNameInput  = document.getElementById('full-name');
  const emailInput     = document.getElementById('email');
  const phoneInput     = document.getElementById('phone');
  const deptSelect     = document.getElementById('department');
  const dateInput      = document.getElementById('appt-date');
  const timeInput      = document.getElementById('appt-time');
  const notesInput     = document.getElementById('notes');

  // Error span elements (one per field)
  const fullNameError  = document.getElementById('full-name-error');
  const emailError     = document.getElementById('email-error');
  const phoneError     = document.getElementById('phone-error');
  const deptError      = document.getElementById('dept-error');
  const dateError      = document.getElementById('date-error');
  const timeError      = document.getElementById('time-error');

  // Confirmation display elements
  const confirmName    = document.getElementById('confirm-name');
  const confirmDept    = document.getElementById('confirm-dept');
  const confirmDate    = document.getElementById('confirm-date');
  const confirmTime    = document.getElementById('confirm-time');
  const confirmRef     = document.getElementById('confirm-ref');

  /* ------------------------------------------------------------------
     2. Set minimum date on the date picker (no past dates)
  ------------------------------------------------------------------ */
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate()).padStart(2, '0');
  dateInput.setAttribute('min', `${yyyy}-${mm}-${dd}`);

  /* ------------------------------------------------------------------
     3. Attach live (real-time) validation to each field
  ------------------------------------------------------------------ */
  const { attachLiveValidation, validateField } = window.Validators;

  attachLiveValidation(fullNameInput, fullNameError, {
    required: true,
    minLength: 2,
    emptyMessage: 'Please enter your full name.',
  });

  attachLiveValidation(emailInput, emailError, {
    required: true,
    type: 'email',
    emptyMessage: 'Please enter your email address.',
  });

  attachLiveValidation(phoneInput, phoneError, {
    required: true,
    type: 'phone',
    emptyMessage: 'Please enter your phone number.',
  });

  attachLiveValidation(deptSelect, deptError, {
    required: true,
    emptyMessage: 'Please select a department.',
  });

  attachLiveValidation(dateInput, dateError, {
    required: true,
    type: 'date',
    emptyMessage: 'Please choose a preferred date.',
  });

  attachLiveValidation(timeInput, timeError, {
    required: true,
    emptyMessage: 'Please choose a preferred time.',
  });

  /* ------------------------------------------------------------------
     4. Department select — show a dynamic "available hours" note
  ------------------------------------------------------------------ */
  const deptHoursNote = document.getElementById('dept-hours-note');

  const deptHours = {
    'general-medicine': 'Mon – Fri: 8 AM – 6 PM  |  Sat: 9 AM – 1 PM',
    'pediatrics':       'Mon – Fri: 9 AM – 5 PM  |  Sat: 10 AM – 12 PM',
    'cardiology':       'Mon – Thu: 8 AM – 4 PM',
    'orthopedics':      'Mon – Fri: 8 AM – 5 PM',
    'gynecology':       'Mon – Fri: 9 AM – 5 PM  |  Sat: 9 AM – 12 PM',
    'dentistry':        'Mon – Sat: 8 AM – 6 PM',
  };

  if (deptHoursNote) {
    deptSelect.addEventListener('change', () => {
      const val = deptSelect.value;
      if (val && deptHours[val]) {
        deptHoursNote.textContent = '🕒 ' + deptHours[val];
        deptHoursNote.style.display = 'block';
      } else {
        deptHoursNote.style.display = 'none';
      }
    });
  }

  /* ------------------------------------------------------------------
     5. Full form validation on submit
  ------------------------------------------------------------------ */
  function validateAll() {
    const { validateField } = window.Validators;
    let isValid = true;

    // Validate every required field and collect results
    const checks = [
      validateField(fullNameInput, fullNameError, { required: true, minLength: 2, emptyMessage: 'Please enter your full name.' }),
      validateField(emailInput,    emailError,    { required: true, type: 'email', emptyMessage: 'Please enter your email address.' }),
      validateField(phoneInput,    phoneError,    { required: true, type: 'phone', emptyMessage: 'Please enter your phone number.' }),
      validateField(deptSelect,    deptError,     { required: true, emptyMessage: 'Please select a department.' }),
      validateField(dateInput,     dateError,     { required: true, type: 'date', emptyMessage: 'Please choose a preferred date.' }),
      validateField(timeInput,     timeError,     { required: true, emptyMessage: 'Please choose a preferred time.' }),
    ];

    isValid = checks.every(Boolean);
    return isValid;
  }

  /* ------------------------------------------------------------------
     6. Save appointment to localStorage
  ------------------------------------------------------------------ */
  function saveAppointment(data) {
    // Retrieve existing appointments or start fresh
    const existing = JSON.parse(localStorage.getItem('hb_appointments') || '[]');
    existing.push(data);
    localStorage.setItem('hb_appointments', JSON.stringify(existing));
  }

  /* ------------------------------------------------------------------
     7. Show confirmation card
  ------------------------------------------------------------------ */
  function showConfirmation(data) {
    const { formatDate, formatTime } = window.Validators;

    // Populate confirmation summary
    if (confirmName) confirmName.textContent = data.fullName;
    if (confirmDept) confirmDept.textContent = data.departmentLabel;
    if (confirmDate) confirmDate.textContent = formatDate(data.date);
    if (confirmTime) confirmTime.textContent = formatTime(data.time);
    if (confirmRef)  confirmRef.textContent  = data.ref;

    // Hide form, reveal confirmation
    form.style.display        = 'none';
    confirmationBox.style.display = 'block';

    // Smooth scroll to confirmation
    confirmationBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ------------------------------------------------------------------
     8. Form submit handler
  ------------------------------------------------------------------ */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Run full validation
    if (!validateAll()) {
      // Scroll to first visible error
      const firstError = form.querySelector('.error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Build appointment object
    const deptLabel = deptSelect.options[deptSelect.selectedIndex]?.text || deptSelect.value;
    const appointment = {
      id:             Date.now(),
      ref:            window.Validators.generateRef(),
      fullName:       fullNameInput.value.trim(),
      email:          emailInput.value.trim(),
      phone:          phoneInput.value.trim(),
      department:     deptSelect.value,
      departmentLabel: deptLabel,
      date:           dateInput.value,
      time:           timeInput.value,
      notes:          notesInput ? notesInput.value.trim() : '',
      bookedAt:       new Date().toISOString(),
    };

    // Persist to localStorage
    saveAppointment(appointment);

    // Display confirmation
    showConfirmation(appointment);
  });

  /* ------------------------------------------------------------------
     9. "Book Another Appointment" button — reset form
  ------------------------------------------------------------------ */
  const resetBtn = document.getElementById('book-another-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      form.style.display       = 'block';
      confirmationBox.style.display = 'none';

      // Re-set min date (in case the page was left open past midnight)
      const n  = new Date();
      const y2 = n.getFullYear();
      const m2 = String(n.getMonth() + 1).padStart(2, '0');
      const d2 = String(n.getDate()).padStart(2, '0');
      dateInput.setAttribute('min', `${y2}-${m2}-${d2}`);

      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ------------------------------------------------------------------
     10. Animate form fields on focus (slight lift effect)
  ------------------------------------------------------------------ */
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('focus', () => {
      el.closest('.form-group')?.classList.add('focused');
    });
    el.addEventListener('blur', () => {
      el.closest('.form-group')?.classList.remove('focused');
    });
  });

});
