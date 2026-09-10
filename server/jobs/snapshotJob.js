const cron = require('node-cron');
const Room = require('../models/Room');
const redis = require('../config/redis');

const startSnapshotJob = () => {
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const keys = await redis.keys('room:*:code');

      for (const key of keys) {
        const code = key.split(':')[1];
        const codeSnapshot = await redis.get(key);
        await Room.findOneAndUpdate(
          { code },
          {
            codeSnapshot,
            lastActive: new Date()
          }
        );
      }
      if (keys.length > 0) {
        console.log(`Snapshot saved for ${keys.length} active room(s)`);
      }

    } catch (error) {
      console.error('Snapshot job error:', error);
    }
  });

  console.log('Snapshot job started');
};

module.exports = startSnapshotJob;