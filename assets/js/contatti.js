    /* ===== Form candidatura: placeholder (senza backend) ===== */
    const jobForm = document.getElementById('jobForm');
    const jobStatus = document.getElementById('jobStatus');

    jobForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      jobStatus.textContent = 'Invio in corso…';

      // Qui puoi collegare un endpoint reale:
      // const formData = new FormData(jobForm);
      // const res = await fetch('/api/candidatura', { method:'POST', body: formData });
      // if(!res.ok) ...

      // Placeholder UX
      setTimeout(() => {
        jobStatus.textContent = 'Candidatura inviata.';
        jobForm.reset();
      }, 650);
    });