import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

app.get("/api/deezer/random-popular", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Falta parámetro q" });

  const track = await getRandomPopularTrack(q);

  if (!track) {
    return res.status(404).json({ error: "No se encontró canción popular" });
  }

  res.json(track);
});

async function getRandomPopularTrack(query) {
  try {
    const response = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`
    );
    const data = await response.json();

    // Los tracks vienen en data.data, no en data.results
    const results = data.data;
    console.log("data", data);
    console.log("data", results.length);
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error("No results found");
    }

    // Filtramos los que tienen rank > 1M
    const popular = results.filter((track) => track.rank > 800_000);
    if (popular.length === 0) {
      throw new Error("No popular tracks found");
    }

    // Elegimos una al azar
    const randomIndex = Math.floor(Math.random() * popular.length);
    return popular[randomIndex];
  } catch (error) {
    console.error("Error fetching data from Deezer API:", error);
    throw error;
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
);
