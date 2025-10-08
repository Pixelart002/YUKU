// File: js/pages/feedback.js
function initFeedbackPage() {
  const submitBtn = document.getElementById('submit-feedback-btn');
  const commentText = document.getElementById('feedback-textarea');
  const statusEl = document.getElementById('feedback-status');
  const ratingContainer = document.querySelector('.rating');
  
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const selectedRating = document.querySelector('input[name="rating"]:checked');
      const comment = commentText.value.trim();
      
      if (!selectedRating) {
        statusEl.innerHTML = `<p class="text-red-400">[ERROR]: Please select a star rating.</p>`;
        return;
      }
      if (comment.length < 10) {
        statusEl.innerHTML = `<p class="text-red-400">[ERROR]: Comment must be at least 10 characters long.</p>`;
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      
      const success = await window.app.handleFeedbackSubmit(parseInt(selectedRating.value), comment);
      
      if (success) {
        commentText.value = '';
        selectedRating.checked = false;
        statusEl.innerHTML = `<p class="text-green-400">Thank you! Your feedback has been submitted.</p>`;
        submitBtn.textContent = 'Submitted';
      } else {
        statusEl.innerHTML = `<p class="text-red-400">[ERROR]: Submission failed. Please try again.</p>`;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Feedback';
      }
    });
  }
}