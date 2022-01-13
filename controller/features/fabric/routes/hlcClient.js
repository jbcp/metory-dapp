/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


'use strict';
let fs = require('fs');
let path = require('path');

let itemTable = null;
// const svc = require('./Z2B_Services');
// const financeCoID = 'easymoney@easymoneyinc.com';

// Bring Fabric SDK network class
const { FileSystemWallet, Gateway } = require('fabric-network');

// A wallet stores a collection of identities for use
let walletDir = path.join(path.dirname(require.main.filename),'controller/features/fabric/_idwallet');
const wallet = new FileSystemWallet(walletDir);

const configDirectory = path.join(process.cwd(), 'controller/features/fabric');
const configPath = path.join(configDirectory, 'config.json');
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);
let userName = config.appAdmin;
let channelName = config.channel_name;
let smartContractName = config.smart_contract_name;

let gatewayDiscoveryEnabled = 'enabled' in config.gatewayDiscovery?config.gatewayDiscovery.enabled:true;
let gatewayDiscoveryAsLocalhost = 'asLocalHost' in config.gatewayDiscovery?config.gatewayDiscovery.asLocalhost:true;

const ccpFile = config.connection_file;
const ccpPath = path.join(configDirectory, ccpFile);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

exports.searchStudy =async function(req, res, next){
    try{
        console.log("Start searchStudy")
        const study_id = req.params.study_id;
        const userExists = await wallet.exists(userName);
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        const result = await contract.evaluateTransaction('queryConsentByStudy',study_id); //Study0
        // const result = await contract.evaluateTransaction('queryConsentBySubject',"Subject4");
        
        console.log({result: result.toString()});      
        
        await gateway.disconnect();
        if(result.toString()!='')
        res.send({code:200, message: JSON.parse(result.toString())});
    else
        res.send({code:200, message: JSON.parse('[]')});

    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }

}

//리턴에서 값이 없을 경우 텍스트로 리턴됨 주의 
//체인코드에서 수정이 필요할듯. 
exports.searchSubject =async function(req, res, next ){
    try{
        const subject_id = req.params.subject_id;
        const userExists = await wallet.exists(userName);
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        console.log({subject_id:subject_id})
        const result = await contract.evaluateTransaction('queryConsentBySubject',subject_id); //Subject4
        console.log({result: result.toString()});
        await gateway.disconnect();
        if(result.toString()!='')
            res.send({code:200, message: JSON.parse(result.toString())});
        else
            res.send({code:200, message: JSON.parse('[]')});

    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }
}
//동의서생성
exports.createConsent =async function(req, res, next ){
    try{
        const consentData = req.body;
        
        const userExists = await wallet.exists(userName);
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        const result = await contract.submitTransaction(
            'createConsentOfSubject',
            consentData.subject_id,
            consentData.consent_id,
            consentData.consent_hash,
            consentData.consent_version,
            consentData.study_id,
            consentData.hospital_id,
            consentData.sponsor_id,
            consentData.subject_id,
            consentData.subject_consent_explanation_request_time,
            consentData.subject_consent_sign_time,
            consentData.legal_representative_id,
            consentData.legal_representative_consent_explantion_request_time,
            consentData.legal_representative_consent_sign_time,
            consentData.investigator_id,
            consentData.investigator_consent_explanation_confirm_time,
            consentData.investigator_consent_sign_time,
            consentData.status           
            ); //Subject4

        await gateway.disconnect();
        console.log({result: result.toString()});
        res.send({code:200, message:"OK"})
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }
}


exports.updateConsent =async function(req, res, next ){
    try{
        const consentData = req.body;
        
        const userExists = await wallet.exists(userName);
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        const result = await contract.submitTransaction(
            'updateConsentBySubject',
            consentData.subject_id,
            consentData.consent_id,
            consentData.consent_hash,
            consentData.consent_version,
            consentData.study_id,
            consentData.hospital_id,
            consentData.sponsor_id,
            consentData.subject_id,
            consentData.subject_consent_explanation_request_time,
            consentData.subject_consent_sign_time,
            consentData.legal_representative_id,
            consentData.legal_representative_consent_explantion_request_time,
            consentData.legal_representative_consent_sign_time,
            consentData.investigator_id,
            consentData.investigator_consent_explanation_confirm_time,
            consentData.investigator_consent_sign_time,
            consentData.status           
            
            ); //Subject4
        await gateway.disconnect();
        console.log({result: result.toString()});
        res.send({code:200, message:"OK"})
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});

    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }
}