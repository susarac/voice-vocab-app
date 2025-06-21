from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

DATA_FILE = "kelimeler.json"

def load_words():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_words(words):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=4)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/add", methods=["POST"])
def add_word():
    data = request.get_json()
    word = data.get("word", "").strip().lower()
    if not word:
        return jsonify({"status": "error", "message": "Kelime boş olamaz."})

    words = load_words()
    if word in words:
        return jsonify({"status": "exists", "message": "Kelime zaten var."})

    words[word] = {"learned": False}
    save_words(words)
    return jsonify({"status": "ok", "message": f"{word} eklendi."})

@app.route("/get_word")
def get_word():
    words = load_words()
    for word in words:
        if not words[word]["learned"]:
            return jsonify({"word": word})
    return jsonify({"word": None})

@app.route("/mark_learned", methods=["POST"])
def mark_learned():
    data = request.get_json()
    word = data.get("word")
    words = load_words()
    if word in words:
        words[word]["learned"] = True
        save_words(words)
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True)
