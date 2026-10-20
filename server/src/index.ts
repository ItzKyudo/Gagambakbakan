import config, { listen } from '@colyseus/tools';
import cors from 'cors';
import { BattleRoom } from './rooms/BattleRoom';

const port = Number(process.env.PORT || 2567);

listen(config({
  initializeExpress: (app) => {
    app.use(cors());

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', time: Date.now() });
    });

    // Provide info on rooms
    app.get('/api/info', (req, res) => {
      res.json({
        game: 'Gagambakbakan',
        version: '1.0.0',
        rooms: ['battle']
      });
    });
  },

  initializeGameServer: (gameServer) => {
    // Define the battle room
    gameServer.define('battle', BattleRoom)
      .filterBy(['roomCode'])
      .enableRealtimeListing();
  }
}), port).then(() => {
  console.log(`⚔️ Gagambakbakan Colyseus server listening on port ${port}`);
});
