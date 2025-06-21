function speak(text, callback = null) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  if (callback) utter.onend = callback;
  speechSynthesis.speak(utter);
}

function listen(callback) {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    callback(transcript);
  };
  recognition.start();
}

function addWord() {
  const word = document.getElementById("wordInput").value.trim();
  if (!word) return alert("Kelime girin.");
  fetch("/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word })
  })
    .then(res => res.json())
    .then(data => alert(data.message));
}

function startLearning() {
  fetch("/get_word")
    .then(res => res.json())
    .then(data => {
      if (!data.word) {
        speak("Harika! Tüm kelimeleri öğrendin.");
        document.getElementById("status").innerText = "Tüm kelimeler öğrenildi.";
        return;
      }

      const word = data.word;
      speak(`Today's word is ${word}. Have you heard it before?`, () => {
        listen((response) => {
          if (response.includes("yes")) {
            speak("Nice! Let's review it anyway.");
          } else {
            speak(`No worries! Let's learn it together. The word is ${word}.`);
          }

          speak(`Can you use ${word} in a sentence?`, () => {
            listen((sentence) => {
              if (sentence.includes(word)) {
                speak("Excellent! You used it correctly!", () => {
                  fetch("/mark_learned", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ word })
                  }).then(() => startLearning());
                });
              } else {
                speak("Hmm, I don't think you used the word. Let's try another one.");
                startLearning();
              }
            });
          });
        });
      });
    });
}
