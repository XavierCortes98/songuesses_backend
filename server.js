import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const songReproductions = 800_000;

let songToGuess = null;

app.get("/api/deezer/random-popular", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Falta parámetro q" });

  const track = await getRandomPopularTrack(q);

  if (!track) {
    return res.status(404).json({ error: "No se encontró canción popular" });
  }

  res.json(track);
});

app.get("/api/deezer/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Falta parámetro q" });

  try {
    const track = await getTrackNames(q);

    if (!track || track.length === 0) {
      return res.status(404).json({ error: "No se encontró canción popular" });
    }

    res.json(track);
  } catch (error) {
    console.error("Error en búsqueda:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/check-song/:id", (req, res) => {
  const songId = req.params.id;
  console.log("songId recibido", songId);
  const exists = songId === songToGuess.id.toString();
  console.log("songId guardado", songToGuess.id);
  res.json(exists); // devolverá true o false
});

async function getTrackNames(query) {
  try {
    console.log("query autocomplete: ", query);
    const response = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Error al llamar Deezer: ${response.status}`);
    }

    const json = await response.json();

    return json.data; // esto es un array de canciones
  } catch (error) {
    console.error("Error al buscar en Deezer:", error.message);
    throw error;
  }
}

async function getRandomPopularTrack(query) {
  try {
    const response = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=50`
    );
    const data = await response.json();

    const results = data.data;

    if (!Array.isArray(results) || results.length === 0) {
      throw new Error("No results found");
    }

    // Filtramos los que tienen rank > 800_000M
    const popular = results.filter((track) => track.rank > songReproductions);
    if (popular.length === 0) {
      throw new Error("No popular tracks found");
    }

    // Elegimos una al azar
    const randomIndex = Math.floor(Math.random() * popular.length);
    songToGuess = popular[randomIndex];
    return songToGuess;
  } catch (error) {
    console.error("Error fetching data from Deezer API:", error);
    throw error;
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
);
