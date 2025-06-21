let currentWord = "";

function speak(text, callback = null) {
  console.log("🔊 speak:", text);
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.onend = () => {
    console.log("✅ speak finished");
    if (callback) callback();
  };
  utter.onerror = (e) => {
    console.log("❌ speak error:", e.error);
  };
  speechSynthesis.speak(utter);
}

function listen(callback) {
  console.log("🎧 listen started");
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    console.log("✅ heard:", transcript);
    callback(transcript);
  };

  recognition.onerror = (e) => {
    console.log("❌ listen error:", e.error);
    alert("Mikrofon hatası: " + e.error);
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
        speak("All words learned. Great job!");
        document.getElementById("status").innerText = "Tüm kelimeler öğrenildi.";
        return;
      }

      currentWord = data.word;
      speak(`Today's word is ${currentWord}. Have you heard it before?`);
      document.getElementById("status").innerText = `Kelime: ${currentWord}`;
      document.getElementById("listenBtn").style.display = "inline";
    });
}

function handleListen() {
  listen((response) => {
    if (response.includes("yes")) {
      speak("Nice! Let's review it anyway.");
    } else {
      speak(`No worries! Let's learn it together. The word is ${currentWord}.`);
    }

    setTimeout(() => {
      speak(`Can you use ${currentWord} in a sentence?`, () => {
        listen((sentence) => {
          if (sentence.includes(currentWord)) {
            speak("Excellent! You used it correctly!", () => {
              fetch("/mark_learned", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ word: currentWord })
              }).then(() => {
                document.getElementById("listenBtn").style.display = "none";
                startLearning();
              });
            });
          } else {
            speak("Hmm, I don't think you used the word. Let's try another one.");
            document.getElementById("listenBtn").style.display = "none";
            startLearning();
          }
        });
      });
    }, 1000);
  });
}
