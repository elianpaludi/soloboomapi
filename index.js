const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const PORT = 3000;
const getPlayerStats = async (player) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("https://soloboom.net/lowelo", { waitUntil: "networkidle2" });
    await page.waitForSelector("tr.table-complete");
    const rows = await page.$$eval("tr.table-complete", (rows) => {
      return rows.map((row) => {
        const cells = Array.from(row.querySelectorAll("th.table-list"));
        return cells.map((cell) => cell.innerText.trim());
      });
    });

    await browser.close();
    const playerRow = rows.find((row) => row[2]?.toLowerCase() === player.toLowerCase());
    if (!playerRow) {
      throw new Error(`Player ${player} not found.`);
    }
    const playerStats = {
      position: playerRow[0], 
      name: playerRow[2],
      wins: playerRow[7], 
      losses: playerRow[8], 
      totalGames: playerRow[9], 
    };

    return playerStats;
  } catch (error) {
    console.error(error.message);
    return null;
  }
};
app.get("/player/:name", async (req, res) => {
  const playerName = req.params.name;
  const stats = await getPlayerStats(playerName);

  if (stats) {
    const formatted = `El jugador ${stats.name} está número ${stats.position} en la tabla, con ${stats.wins} victorias - ${stats.losses} derrotas, un total de ${stats.totalGames} partidas.`;
    res.send(formatted);
  } else {
    res.status(404).send(`Player ${playerName} not found.`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
