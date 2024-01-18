const api = require('./api');
const axios = require('axios');
const config = require('../../../../modules/configReader');

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

function getFreegeoip(ip) {
  return new Promise((resolve, reject) => {
    axios.get(`http://${config.freegeoip.host}:${config.freegeoip.port}/json/${ip}`)
      .then((response) => {
        if (response.status !== 200) {
          reject(undefined);
        }

        resolve(response.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = {
  getPeers,
  getFreegeoip,
};
