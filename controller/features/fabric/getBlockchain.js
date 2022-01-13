/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const Fabric_Client = require('fabric-client');
const fs = require('fs');
let path = require('path');

let fabric_client = new Fabric_Client();

// capture network variables from config.json
const configDirectory = path.join(process.cwd(), 'controller/features/fabric');
const configPath = path.join(configDirectory, 'config20210215.json');
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);

let peerName = '159.122.178.46:31836';
// let ordererName = config.ordererName;
let userName = config.appAdmin;
// let channelName = config.channel_name;
let channelName = "channel1";
// let channelName = "ch1-jbcp-snuh";

const ccpFile = config.connection_file;
const ccpPath = path.join(configDirectory, ccpFile);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

// setup the fabric network
// let channel = fabric_client.newChannel(channelName);
let channel = fabric_client.newChannel(channelName);

let peer = fabric_client.newPeer(ccp.peers[peerName].url, {pem: ccp.peers[peerName].tlsCACerts.pem});
channel.addPeer(peer);
//let order = fabric_client.newOrderer(ccp.orderers[ordererName].url, {pem: ccp.orderers[ordererName].tlsCACerts.pem});
//channel.addOrderer(order);

let store_path = path.join(__dirname, '..','/fabric/_idwallet','전북대학교병원', userName);
console.log('Store path:'+store_path);

exports.getBlockchain = async function(req, res, next) {
    try {

        let returnBlockchain = [];

        let state_store = await Fabric_Client.newDefaultKeyValueStore({
            path: store_path
        });

        fabric_client.setStateStore(state_store);
        let crypto_suite = Fabric_Client.newCryptoSuite();
        // use the same location for the state store (where the users' certificate are kept)
        // and the crypto store (where the users' keys are kept)
        let crypto_store = Fabric_Client.newCryptoKeyStore({
            path: store_path
        });
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);

        // get the enrolled user from persistence, this user will sign all requests
        let user_from_store = await fabric_client.getUserContext(userName, true);

        if (user_from_store && user_from_store.isEnrolled()) {
            //console.log('Successfully loaded `userName` from persistence');
        } else {
            throw new Error('Failed to get ' + userName + '.... run registerUser.js');
        }

        let blockchainInfo = await channel.queryInfo();
        //  console.log({blockchainInfo:blockchainInfo});
        let height = blockchainInfo.height.low;
        // let block1 = await channel.queryBlock(10);
        // console.log({block1:block1})
        // console.log(block1.metadata)

        // block1 = await channel.queryBlock(9);
        // console.log({block1:block1})
        // console.log(block1.metadata)
        
        // block1 = await channel.queryBlock(8);
        // console.log({block1:block1})
        // console.log(block1.metadata)
        





        for (let i = 0; i < height; i++) {

            let returnBlock = {};
            let block = await channel.queryBlock(i);

            returnBlock.number = block.header.number;
            returnBlock.data_hash = block.header.data_hash;
            //returnBlock.metadata = block.metadata;

            let transactions = [];
            let ns_rwsets = [];
            if (block.data.data && block.data.data.length) {
                returnBlock.num_transactions = block.data.data.length;

                for (let j = 0; j < returnBlock.num_transactions; j++) {
                    let transaction = {};

                    transaction.id = block.data.data[j].payload.header.channel_header.tx_id;
                    transaction.timestamp = block.data.data[j].payload.header.channel_header.timestamp;
                    block.data.data[j].payload.header.signature_header.creator.IdBytes = block.data.data[j].payload.header.signature_header.creator.IdBytes.replace(/\n/g,'');
                    transaction.sigature_header_creator = block.data.data[j].payload.header.signature_header.creator
                    
                    // console.log({creator:block.data.data[j].payload.header.signature_header.creator})

                    if (block.data.data[j].payload.data.actions && block.data.data[j].payload.data.actions.length) {
                        let actions_length = block.data.data[j].payload.data.actions.length;
                        for (let k = 0; k < actions_length; k++) {

                            if (block.data.data[j].payload.data.actions[k].payload.action.proposal_response_payload.extension.results.ns_rwset && block.data.data[j].payload.data.actions[k].payload.action.proposal_response_payload.extension.results.ns_rwset.length) {
                                let ns_rwset_length = block.data.data[j].payload.data.actions[k].payload.action.proposal_response_payload.extension.results.ns_rwset.length;
                                    // ns_rwsets.header = block.data.data[j].payload.data.actions[k].header.creator;
                                    // console.log({ns_rwsets_header:ns_rwsets.header});
                                for (let l = 0; l < ns_rwset_length; l++) {
                                    let ns_rwset = block.data.data[j].payload.data.actions[k].payload.action.proposal_response_payload.extension.results.ns_rwset[l].rwset;
                                    ns_rwsets.push(ns_rwset);
                                }
                            }
                        }
                    }

                    transaction.ns_rwsets = ns_rwsets;
                    transactions.push(transaction);

                }
            }

            returnBlock.transactions = transactions;
            returnBlockchain.push(returnBlock);


        }
        //console.log('returnBlockchain');
        //console.log(returnBlockchain);
        
        res.send({
            result: 'Success',
            returnBlockchain: returnBlockchain
        });

    } catch (error) {
        console.error(`Failed to get blockchain: ${error}`);
        console.log(error.stack);
        res.send({
            error: error.message
        });
    }
};
