#!/bin/bash  
# Purpose of this script is to clean lisk database and load a snapshot to it

if [ -z "$1" ]
  then
    echo "One required argument missing: path to folder with lisk core app.js"
    exit 1
fi

if [ ! -f blockchain_explorer.db.gz ]; then
  wget https://downloads.lisk.io/lisk-explorer/dev/blockchain_explorer.db.gz
fi

pwd=`pwd`
cd $1
forever stop app.js
dropdb lisk_test && createdb lisk_test
dropdb lisk_test
createdb lisk_test
gunzip -fcq "$pwd/blockchain_explorer.db.gz" | psql -d lisk_test
forever start app.js
sleep 5
cd $pwd

