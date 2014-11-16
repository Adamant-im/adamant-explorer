module.exports = (function() {
    'use strict';

    // Components
    var crypto = require('crypto'),
        hyperquest = require('hyperquest'),
        nonce = require('nonce')();

    // Constants
    var API_URL = 'https://data.bter.com/api/1/', // reverted url
        USER_AGENT = 'Mozilla/5.0 (Windows NT 6.3; WOW64; rv:26.0) Gecko/20100101 Firefox/26.0';

    // Executes the request
    function throwback(uri, options, result) {
        // Attempt again on a 301 or 302 response code
        var cb = function(err, res) {
            if(res && res.statusCode === 301 || res.statusCode === 302)
                return hyperquest(res.headers.Location, options, cb);
        };
        var req = hyperquest(uri, options, cb), isPOST = false;
        // Check if form is apart of options
        isPOST = options.form ? true : false;
        // Write to the stream if a form exists
        if(isPOST) req.write(options.form);
        // Handle response
        req.on('response', function(res) {
            var body = '';
            // Send back if response code is not 200
            if(res && res.statusCode !== 200) result(new Error(res.statusCode));
            // Read stream
            res.on('data', function(chunk) {
                body += chunk.toString();
            });
            // Handle end of stream
            res.on('end', function() {
                try {
                    // Attempt to parse the body
                    var clean = JSON.parse(body);
                    result(null, clean);
                } catch(e) {
                    result(e, null);
                }
            });
        });
        // Handle errors
        req.on('error', function(err) {
            if(err) result(err, null);
        });
    }

    // Signs a given message for auth
    function signMessage(private_key, msg) {
        var message = msg || '';
        return crypto.createHmac('sha512', private_key).update(message).digest('hex');
    }

    return {
        // Returns all pairs available for trading
        getAllPairs: function(cb) { // no options
            if(!cb) throw new Error('No callback defined');

            throwback(API_URL + 'pairs', {method: 'GET', headers: { 'User-Agent' : USER_AGENT } }, cb);
        },
        // Returns all markets' fee, minimum order total amount, price decimal places.
        getMarketInfo: function(cb) { // no options
            if(!cb) throw new Error('No callback defined');

            throwback(API_URL + 'marketinfo', {method: 'GET', headers: { 'User-Agent' : USER_AGENT } }, cb);
        },
        // Returns market details including pair, coin name, coin symbol, last price, trading volume, coin supply, coin market cap, price trend, etc.
        getMarketList: function(cb) { // no options
            if(!cb) throw new Error('No callback defined');

            throwback(API_URL + 'marketlist', {method: 'GET', headers: { 'User-Agent' : USER_AGENT } }, cb);
        },
        // Returns the tickers for all the supported trading pairs at once, cached in 10 seconds
        getAllTickers: function(cb) { // no options
            if(!cb) throw new Error('No callback defined');

            throwback(API_URL + 'tickers', {method: 'GET', headers: { 'User-Agent' : USER_AGENT } }, cb);
        },
        // Returns the current ticker for the selected currency, cached in 10 seconds
        getTicker: function(options, cb) { // options = CURR_A, CURR_B
            if(!cb) throw new Error('No callback defined');
            if(!options) cb(new Error('No options defined'));
            if(!options.CURR_A || !options.CURR_B) cb(new Error('You must define two currencies'));

            throwback(API_URL + 'ticker' + '/' + options.CURR_A + '_' + options.CURR_B, { method: 'GET',
                headers: { 'User-Agent' : USER_AGENT } }, cb);
        },
        // Return the market depth including ask and bid orders.
        getDepth: function(options, cb) { // options = CURR_A, CURR_B
            if(!cb) throw new Error('No callback defined');
            if(!options) cb(new Error('No options defined'));
            if(!options.CURR_A || !options.CURR_B) cb(new Error('You must define two currencies'));

            throwback(API_URL + 'depth' + '/' + options.CURR_A + '_' + options.CURR_B, { method: 'GET',
                headers: { 'User-Agent' : USER_AGENT } }, cb);
        },
        // Returns the most recent trade history records (80)
        getHistory: function(options, cb) { // options = CURR_A, CURR_B, TID (optional)
            if(!cb) throw new Error('No callback defined');
            if(!options) cb(new Error('No options defined'));
            if(!options.CURR_A || !options.CURR_B) cb(new Error('You must define two currencies'));

            throwback(API_URL + 'trade' + '/' + options.CURR_A + '_' + options.CURR_B
                + (options.TID ? '/' + options.TID : ''), { method: 'GET', headers: { 'User-Agent' : USER_AGENT } }, cb);
        },
        // Returns the funds of the given trader
        getFunds: function(options, cb) { // options = API_KEY, SECRET_KEY
            if(!cb) throw new Error('No callback defined');
            if(!options) cb(new Error('No options defined'));
            if(!options.API_KEY || !options.SECRET_KEY) cb(new Error('You must defined both the API and SECRET key'));

            var n = nonce(),
                form = 'nonce=' + n,
                signed = signMessage(options.SECRET_KEY, 'nonce=' + n);

            throwback(API_URL + 'private/getfunds', { method: 'POST', form: form, headers: { 'User-Agent' : USER_AGENT,
                'Content-Type' : 'application/x-www-form-urlencoded', 'Content-Length' : form.length, 'Key': options.API_KEY, 'Sign': signed } }, cb);
        },
        // Places a new buy/sell order
        placeOrder: function(options, cb) { // options = API_KEY, SECRET_KEY, PAIR, TYPE, RATE, AMOUNT
            if(!cb) throw new Error('No callback defined');
            if(!options) cb(new Error('No options defined'));
            if(!options.API_KEY || !options.SECRET_KEY) cb(new Error('You must defined both the API and SECRET key'));
            if(!options.PAIR || !options.TYPE || !options.RATE || !options.AMOUNT) cb(new Error('You must define all options (pair, type, rate, amount)'));

            var n = nonce(),
                form = 'pair=' + options.PAIR + '&type=' + options.TYPE + '&rate=' + options.RATE + '&amount=' + options.AMOUNT + '&nonce=' + n,
                signed = signMessage(options.SECRET_KEY, form);

            throwback(API_URL + 'private/placeorder', { method: 'POST', form: form, headers: { 'User-Agent' : USER_AGENT,
                'Content-Type' : 'application/x-www-form-urlencoded', 'Content-Length' : form.length, 'Key': options.API_KEY, 'Sign': signed }
            }, cb);
        },
        // Cancels a given order
        cancelOrder: function(options, cb) { // options = API_KEY, SECRET_KEY, ORDER_ID
            if(!cb) throw new Error('No callback defined');
            if(!options) cb(new Error('No options defined'));
            if(!options.API_KEY || !options.SECRET_KEY) cb(new Error('You must defined both the public and private key'));
            if(!options.ORDER_ID) cb(new Error('You must define the order id'));

            var n = nonce(),
                form = 'order_id=' + options.ORDER_ID + '&nonce=' + n,
                signed = signMessage(options.SECRET_KEY, form);

            throwback(API_URL + 'private/cancelorder', { method: 'POST', form: form, headers: { 'User-Agent' : USER_AGENT,
                'Content-Type' : 'application/x-www-form-urlencoded', 'Content-Length' : form.length, 'Key': options.API_KEY,
                'Sign': signed } }, cb);
        },
        // Returns the status of a given order id
        getOrderStatus: function(options, cb) { // options = API_KEY, SECRET_KEY, ORDER_ID
            if(!cb) throw new Error('No callback defined');
            if(!options) cb(new Error('No options defined'));
            if(!options.API_KEY || !options.SECRET_KEY) cb(new Error('You must defined both the public and private key'));
            if(!options.ORDER_ID) cb(new Error('You must define the order id'));

            var n = nonce(),
                form = 'order_id=' + options.ORDER_ID + '&nonce=' + n,
                signed = signMessage(options.SECRET_KEY, form);

            throwback(API_URL + 'private/getorder', { method: 'POST', form: form, headers: { 'User-Agent' : USER_AGENT,
                'Content-Type' : 'application/x-www-form-urlencoded', 'Content-Length' : form.length, 'Key': options.API_KEY,
                'Sign': signed } }, cb);
        },
        // Returns an open order list
        getOrderList: function(options, cb) { // options = API_KEY, SECRET_KEY
            if(!cb) throw new Error('No callback defined');
            if(!options) cb(new Error('No options defined'));
            if(!options.API_KEY || !options.SECRET_KEY) cb(new Error('You must defined both the public and private key'));

            var n = nonce(),
                form = 'nonce=' + n,
                signed = signMessage(options.SECRET_KEY, form);

            throwback(API_URL + 'private/orderlist', { method: 'POST', form: form, headers: { 'User-Agent' : USER_AGENT,
                'Content-Type' : 'application/x-www-form-urlencoded', 'Content-Length' : form.length, 'Key': options.API_KEY,
                'Sign': signed } }, cb);
        }
    };
})();