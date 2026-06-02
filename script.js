document.addEventListener('DOMContentLoaded', ()

const recordButton =

document.getElementByld('recordButton');

const wordDisplay =

document.getElementByld('wordDisplay'); const feedbackDiv =

document.getElementByld('feedback');

const modal = document.getElementByld('modal'); const modalMessage =

document.getElementByld('modalMessage');

const retryButton =

document.getElementByld('retryButton'); const skipButton =

document.getElementByld('skipButton');

// --- 1. Data Setup ---

// Define your Hindi words and their expected pronunciation (for simplicity, we'll use the Hindi text

itself)

const hindiWords = [ "नमस्ते (Namaste)",

"धन्यवाद (Dhanyawad)", "आपका नाम (Aapka Naam)"

];

let currentWordIndex = 0;

// --- 2. Speech Recognition Setup --- const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; let recognition;

if (SpeechRecognition) {

recognition = new SpeechRecognition();

recognition.lang = 'hi-IN'; // Set language to Hindi (if supported by the browser)

recognition.interimResults = false; // Only return

final results

recognition.continuous = false; // Stop after a

recognition.onresult = (event) => { const transcript = event.results[0]

[0].transcript.trim();

console.log('Transcript:', transcript); checkPronunciation(transcript);

recognition.onerror = (event) => {

feedbackDiv.textContent = Error during

console.error('Speech recognition error:', event.error);

recording: ${event.error}. Try again.; showModal('An error occurred during recording. Please try again., 'retry');

};

recognition.onend = () => {

// This is fine, the next button will trigger the

next word

} else {

feedbackDiv.textContent = "Error: Your browser does not support the Web Speech API.";

recordButton.disabled = true;

// --- 3. Core Functions ---

function loadNextWord() {

if (currentWordIndex < hindiWords.length) { wordDisplay.textContent = hindiWords[currentWordIndex]; feedbackDiv. T(); // Clear previous feedback

feedbackDiv.textContent = "Click the button to

record.";

recordButton.disabled = false; } else {

wordDisplay.textContent = "All words

completed!";

recordButton.disabled = true;

feedbackDiv.textContent = "Congratulations! You

finished the set.";

const isCorrect = userText.

function checkPronunciation(userText) { const expectedWord = hindiWords[currentWordIndex];

// Simple comparison: Check if the user's spoken text is close to the expected word.

// In a real app, you would use phonetic matching or a dedicated NLP library.

fWords[currentWordIndex].toLowerCase().includes( userText.toLowerCase());

job!";

if (isCorrect) {

feedbackDiv.textContent = "✓ Correct! Great

feedbackDiv.className = 'feedback-box correct';

currentWordIndex++;

loadNextWord();

} else {

feedbackDiv.textContent = "

Incorrect. Try

again.";
feedbackDiv.class Name = 'feedback-box

incorrect';

showModal('Try again', 'retry');

}

function showModal(message, action) { retry = 'retry', skip = 'skip'}) {

modalMessage.textContent = message;

retryButton.textContent = "Try Again"; skipButton.textContent = "Skip";

if (action === retry) {

// Reset state and try the current word again currentWordIndex =

hindiWords.indexOf(hindiWords[currentWordIndex]); // Re-find index the current word

loadNextWord(); // Reload the word display feedbackDiv.textContent = "Ready to record."; feedbackDiv.className = 'feedback-box';

} else if (action === skip) {

// Move to the next word without recording currentWordIndex++;

loadNextWord();

feedbackDiv.textContent = "Skipped this word.

Moving to the next one.";

feedbackDiv.className = 'feedback-box';

modal.style.display = "block";

}

// --- 4. Event Listeners --

recordButton.addEventListener('click', () => {

if (recognition) {

try {

recognition.start();

} catch (e) {

console.error('Error starting recognition:', e);

feedbackDiv.textContent = "Microphone access

failed. Check permissions.";

}

}

retryButton.addEventListener('click', () => {

modal.style.display = "none";

// Re-trigger the recording process for the current word

recordButton.click();

skipButton.addEventListener('click', () => { modal.style.display = "none"; // Move to the next word currentWordIndex++; loadNextWord();

// --- Initialization --- LoadNextWord();

});



