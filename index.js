const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;
require('dotenv').config();


app.use(express.json());

const getRankedData = async (gameName, tagLine, apiKey) => {
  try {
    const accountUrl = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
    const accountResponse = await axios.get(accountUrl, {
      headers: { 'X-Riot-Token': apiKey },
    });
    const puuid = accountResponse.data.puuid;
    const summonerUrl = `https://la2.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const summonerResponse = await axios.get(summonerUrl, {
      headers: { 'X-Riot-Token': apiKey },
    });
    const summonerId = summonerResponse.data.id;
    const rankedUrl = `https://la2.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
    const rankedResponse = await axios.get(rankedUrl, {
      headers: { 'X-Riot-Token': apiKey },
    });

    return rankedResponse.data;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.error(`Error 403: Clave API inválida o bloqueada para ${gameName}#${tagLine}`);
    } else {
      console.error(`Error al procesar ${gameName}#${tagLine}:`, error.response ? error.response.data : error.message);
    }
    throw new Error(`No se pudo obtener la información del usuario ${gameName}#${tagLine}`);
  }
};

app.get('/ranked/:gameName/:tagLine', async (req, res) => {
  const { gameName, tagLine } = req.params;
  const apiKey = process.env.RIOT_API_KEY;

  try {
    const rankedData = await getRankedData(gameName, tagLine, apiKey);
    res.json(rankedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/ranked/batch', async (req, res) => {
  const users = req.body.users; 
  const apiKey = 'TU_API_KEY'; 

  try {
    const results = await Promise.all(
      users.map(async (user) => {
        try {
          const rankedData = await getRankedData(user.gameName, user.tagLine, apiKey);
          return { user: `${user.gameName}#${user.tagLine}`, data: rankedData };
        } catch (error) {
          return { user: `${user.gameName}#${user.tagLine}`, error: error.message };
        }
      })
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud en lote.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
