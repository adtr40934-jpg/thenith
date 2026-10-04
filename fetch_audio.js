fetch(
  "https://pixabay.com/sound-effects/film-special-effects-short-digital-notification-alert-440353/",
  {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  },
)
  .then((r) => r.text())
  .then((t) => {
    const m = t.match(/cdn\.pixabay\.com\/download\/audio\/[^\&\"']+\.mp3/);
    if (m) console.log("https://" + m[0]);
    else console.log("not found");
  })
  .catch(console.error);
