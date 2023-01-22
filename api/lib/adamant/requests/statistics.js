'use strict';

const api = require('./api');

function getPeers(offset, limit) {
  return new Promise((resolve, reject) => {
    api.get('peers', {orderBy: 'ip:asc', offset, limit})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        resolve(response.data.peers);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = {
  getPeers,
};
