const jobForm = document.getElementById('jobForm');
const jobStatus = document.getElementById('jobStatus');

jobForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  jobStatus.textContent = 'Invio in corso…';

  try {
    const formData = new FormData(jobForm);

    const res = await fetch('https://api.dekosrl.com/api/candidature/', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // DRF può restituire errori per campo
      if (typeof data === 'object') {
        jobStatus.textContent =
          data.error ||
          data.detail ||
          Object.values(data).flat().join(' ') ||
          'Errore durante l’invio.';
      } else {
        jobStatus.textContent = 'Errore durante l’invio.';
      }
      return;
    }

    jobStatus.textContent = 'Candidatura inviata. Grazie!';
    jobForm.reset();

  } catch (err) {
    jobStatus.textContent = 'Errore di rete. Riprova tra poco.';
  }
});
