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
const util = require('util');
const readdir = util.promisify(fs.readdir);

let itemTable = null;
// const svc = require('./Z2B_Services');
// const financeCoID = 'easymoney@easymoneyinc.com';

// Bring Fabric SDK network class
const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');

// A wallet stores a collection of identities for use
// let walletDir = path.join(path.dirname(require.main.filename),'controller/features/fabric/_idwallet');
// const wallet = new FileSystemWallet(walletDir);

// const configDirectory = path.join(process.cwd(), 'controller/features/fabric');
// const configPath = path.join(configDirectory, 'config.json');
// const configJSON = fs.readFileSync(configPath, 'utf8');
// const config = JSON.parse(configJSON);

// let userName = config.appAdmin;
// let channelName = config.channel_name;
// let smartContractName = config.smart_contract_name;

// let gatewayDiscoveryEnabled = 'enabled' in config.gatewayDiscovery?config.gatewayDiscovery.enabled:true;
// let gatewayDiscoveryAsLocalhost = 'asLocalHost' in config.gatewayDiscovery?config.gatewayDiscovery.asLocalhost:true;


// let userName ='app-admin'
// let ch_list = ['ch1','ch-kenect1'];
// let channelName = 'ch1'
// let smartContractName = 'crcpcc'

// let gatewayDiscoveryEnabled = true
// let gatewayDiscoveryAsLocalhost = false

let show_status =false;

// const ccpFile = config.connection_file;
// const ccpPath = path.join(configDirectory, ccpFile);
// const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
// let ccp = JSON.parse(ccpJSON);

// let appAdmin ="app-admin";
// let appAdminSecret = 'app-adminpw';

//test

const userName = 'app-admin'
const gatewayDiscoveryEnabled = true;
const gatewayDiscoveryAsLocalhost = false;
let chk_site_id="전북대학교병원";
let site_code='';
let protocol_no="";
let channelName ="";
let smartContractName="crcpcc";

exports.test = async function(req,res, next){
  
    res.send('test_ok');
    
}

 async function getWallet(req){
    try{
    /// 1.실시기관, 프로토콜 번호 값 가져오기 

    console.log({"req-body":req.body});
  
    // let protocol_no = req.body.protocolno;
    protocol_no = req.body.protocol_no;
    //프로토콜 번호 전처리(소문자, 문자 '- '제거 )
    protocol_no = protocol_no.toLowerCase(); //소문자
    protocol_no = protocol_no.replace('_',''); // "_" 제거
    protocol_no = protocol_no.replace('-',''); // "-" 제거 
    protocol_no = protocol_no.replace('-',''); // "-" 제거 

    //---[시작]테스트케이스때문에 삭제해도 상관없음 -시작



    if(protocol_no == '1cmsih001'){
        channelName = `ch-cms-ih-001`
    }else{
        
        channelName = `ch2-${protocol_no}`
    }
    channelName = `ch2`;
    //----[끝]테스트케이스때문에 삭제해도 상관없음 - 끝

    //SITE 설정
    site_code = req.body.site_id;
    console.log({site_code:site_code})
    
    let user_id = req.body.userid;
    let profile_path ;
    let file_name; 
    
    let appAdmin='app-admin'
    let appAdminSecret='app-adminpw'
    
    /// 2.프로파일 경로주소 만들기 
    var dir_path = `uploads/profiles/${site_code}/${protocol_no}`
    console.log({dir_path:dir_path})
    
    /// 3. 프로파일 읽기 
    console.log(1)
    file_name= await readdir(dir_path);
    file_name = file_name[0];
    profile_path = `${dir_path}/${file_name}`;

    const ccpJSON = fs.readFileSync(profile_path, 'utf8');
    let ccp = JSON.parse(ccpJSON);
    // console.log(ccp)

    console.log(2)

    //4. admin 접속정보 준비 
    const FabricCAServices = require('fabric-ca-client');
    const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
    //orgMSPID, caName, url 값 가져오기 
    let orgMSPID = JSON.stringify(ccp.organizations).split("\"")[1];

    console.log({channelName:channelName, orgMSPID:orgMSPID})
    let caName = ccp.organizations[orgMSPID].certificateAuthorities

    const caURL = ccp.certificateAuthorities[caName].url;
    const ca_admin = new FabricCAServices(caURL);

    // Create a new file system based wallet for managing identities.
    const configDrectory = path.join(process.cwd(), `controller/features/fabric/_idwallet/${site_code}`);
    const walletPath = path.join(configDrectory);
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the admin user.
    const adminExists = await wallet.exists(appAdmin);

    //admin계정 확인
    if (adminExists) {
        console.log('1.An identity for the admin user ' + appAdmin + ' already exists in the wallet');
        // return;
    }else{
        //admin계정 등록하기 
        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca_admin.enroll({ enrollmentID: appAdmin, enrollmentSecret: appAdminSecret });
        const identity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(appAdmin, identity);
        console.log('msg: Successfully enrolled admin user ' + appAdmin + ' and imported it into the wallet');
    }
    // console.log({wallet:wallet})
    return {wallet:wallet, ccp:ccp};

    }catch(err)  {
        console.error({err:err});
        process.exit(1);
    }


    //orgMSPID, caName, url 값 가져오기 

    //Admin계정유무확인
    
    //user계정 유무확인

    // console.log({req_data: req_data});
    // res.send(req_data);
}

exports.test2 = async function (req, res, next){
    try{
        // let site_code   = req.body.site_id;
        let protocol_no = req.body.protocolno;
        let user_id = req.body.userid;
        let profile_path ;
        let file_name;         
        const configDrectory = path.join(process.cwd(), `controller/features/fabric/${site_code}`);
        const walletPath = path.join(configDrectory, '_idwallet');
        // const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1');
        if (userExists) {
            console.log('An identity for the user "user1" already exists in the wallet');
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists('app-admin');
        if (!adminExists) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'app-admin', discovery: { enabled: true, asLocalhost: true } });

        // Get the CA client object from the gateway for interacting with the CA.
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        // Register the user, enroll the user, and import the new identity into the wallet.
        console.log({wallet:wallet, adminIdentity:adminIdentity })
        const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: 'user1', role: 'client' }, adminIdentity);

        const enrollment = await ca.enroll({ enrollmentID: 'user1', enrollmentSecret: secret });
        const userIdentity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
        await wallet.import('user1', userIdentity);
        console.log('Successfully registered and enrolled admin user "user1" and imported it into the wallet');

    }catch(err){
        console.error({err:err});
    }
    
}

function add_user(req){

}


//1. 현재 채널 이름 반환
exports.getChannelID_test =async function(req, res, next ){
    try{
        console.log("Start getChannelID")
        // const study_id = req.params.study_id;
        let data = await getWallet(req);
        const wallet = data.wallet;
        const userExists = await wallet.exists(userName);
    
        // 계정파일이 있는지 확인
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }
        const gateway = new Gateway();
        
        console.log({wallet:wallet, channelName:channelName, ccp:ccp, userName:userName})
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        
        const network = await gateway.getNetwork(channelName);
        console.log("get3")
        const contract = await network.getContract(smartContractName);
        
        const result = await contract.evaluateTransaction('getChannelID'); //Study0
        // const result = await contract.evaluateTransaction('queryConsentBySubject',"Subject4");
        
        console.log({result: result.toString()}); 
        
        await gateway.disconnect();
        if(result.toString()!='')
        res.send({code:200, message: result.toString()});
    else
        res.send({code:200, message: JSON.parse('[]')});

    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }

}
exports.getChannelID =async function(req, res, next ){
    try{
        let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;
        
        console.log("Start getChannelID")
        // const study_id = req.params.study_id;
        const userExists = await wallet.exists(userName);
        
        // 계정파일이 있는지 확인
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        const result = await contract.evaluateTransaction('getChannelID'); //Study0
        // const result = await contract.evaluateTransaction('queryConsentBySubject',"Subject4");
        
        console.log({result: result.toString()});      
        
        await gateway.disconnect();
        if(result.toString()!='')
        res.send({code:200, message: result.toString()});
    else
        res.send({code:200, message: JSON.parse('[]')});

    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }

}
//2. ID로 StateDB의 Consent 객체 값 반환
//- ID는 동의서 찾는 주요 키값
exports.getConsentByKey =async function(req, res, next ){
    try{
         let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;

        console.log("Start getConsentByKey")
        const consent_id = req.body.consent_id;
        const userExists = await wallet.exists(userName);
        // console.log({"wallet":wallet, "userExists":userExists});
        // 계정파일이 있는지 확인
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        const result = await contract.evaluateTransaction('getConsentByKey', consent_id); //Study0
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
//3. StateDB에서 SiteID 값이 일치하는 모든 Consent 객체 값 반환
//- 실시기관에서 작성한 동의서 모두 추출
exports.getConsentsBySite =async function(req, res, next ){
    try{
        let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;

        console.log("Start getConsentsBySite")
        const site_id = req.body.site_id;
        console.log({body_getConsentsBySite:req.body, String_out: req.body});;
        const userExists = await wallet.exists(userName);
        
        // 계정파일이 있는지 확인
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }
                
        const gateway = new Gateway();
        console.log({ccp:ccp, wallet:wallet})
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        let result =""
        console.log({site_id:site_id})
        try{
           result = await contract.evaluateTransaction('getConsentsBySite', site_id); //Study0
        }catch(err){
            console.error({err:err});
        }
        
        // const result = await contract.evaluateTransaction('queryConsentBySubject',"Subject4");
        
        console.log({result: result.toString()});      
        
        await gateway.disconnect();
        res.header("Access-Control-Allow-Origin", "*");
        if(result.toString()!='')
            //output_result 
            //전역변수가 show_status 기본값이 false
            res.send(output_result(200, JSON.parse(result)));
        else
            res.send(output_result(200, JSON.parse('[]')));

    }catch(err){
        console.error({err:err});
        res.send(output_result(500, err));
    }

}
//4.getConsentHistoryByKey
//StateDB의 모든 객체 반환
exports.getConsentHistoryByKey =async function(req, res, next ){
    try{
        let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;
        ///
        console.log("Start getChannelID")
        // const study_id = req.params.study_id;
        const userExists = await wallet.exists(userName);
        const data_param = req.body;
        // 계정파일이 있는지 확인
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        const result = await contract.evaluateTransaction('getConsentHistoryByKey',data_param.consent_idx); 
        // const result = await contract.evaluateTransaction('queryConsentBySubject',"Subject4");
        
        console.log({result: result.toString()});      
        
        await gateway.disconnect();
        if(result.toString()!='')
            //output_result 
            //전역변수가 show_status 기본값이 false
            res.send(output_result(200, JSON.parse(result)));
        else
            res.send(output_result(200, JSON.parse('[]')));

    }catch(err){
        console.error({err:err});
        res.send(output_result(500, err));
    }

}
//5. getAllConsents
//StateDB의 모든 객체 반환
exports.getAllConsents =async function(req, res, next ){
    try{
        let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;

        console.log("Start getChannelID")
        // const study_id = req.params.study_id;
        const userExists = await wallet.exists(userName);
        
        // 계정파일이 있는지 확인
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        const result = await contract.evaluateTransaction('getAllConsents'); //Study0
        // const result = await contract.evaluateTransaction('queryConsentBySubject',"Subject4");
        
        console.log({result: result.toString()});      
        
        await gateway.disconnect();
        if(result.toString()!='')
            //output_result 
            //전역변수가 show_status 기본값이 false
            res.send(output_result(200, JSON.parse(result)));
        else
            res.send(output_result(200, JSON.parse('[]')));

    }catch(err){
        console.error({err:err});
        res.send(output_result(500, err));
    }

}

//6. setSubjectID
//Consent 객체에서 ID에 해당하는 객체의 subjectID 값 저장,
exports.setConsentInfo  =async function(req, res, next ){
    try{
        let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;
        ///
        
        const consentData = req.body;
        
        const userExists = await wallet.exists(userName);
        // console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        const result = await contract.submitTransaction(
            'setConsentInfo',
            consentData.consent_idx,
            consentData.subject_id,
            ); 


        await gateway.disconnect();
        console.log({result: result.toString()});
        res.send({code:200, message:"OK"})
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
        }

    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }

}


//7. setConsentInfo
//Consent 객체에서 ID에 해당하는 객체의  ConsentVersion, ConsentHash 값 저장,  "" 입력시 스킵.
exports.setConsentInfo  =async function(req, res, next ){
    try{

        let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;
        ////
        
        const consentData = req.body;
        
        const userExists = await wallet.exists(userName);
        // console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        const result = await contract.submitTransaction(
            'setConsentInfo',
            consentData.consent_idx,
            consentData.consent_version,
            consentData.consent_hash,
            ); 
        await gateway.disconnect();
        console.log({result: result.toString()});
        res.send({code:200, message:"OK"})
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
        }

    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }

}


//8. setConsentExplanationStartTime
//Consent 객체에서 ID에 해당하는 객체의  ConsentExplanationStartTime 값 저장
exports.setConsentExplanationStartTime  =async function(req, res, next ){
    try{
        let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;
        const consentData = req.body;
        
        const userExists = await wallet.exists(userName);
        // console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        const result = await contract.submitTransaction(
            'setConsentExplanationStartTime',
            consentData.consent_idx,
            consentData.consent_explation_start_time,
            ); 


        await gateway.disconnect();
        console.log({result: result.toString()});
        res.send({code:200, message:"OK"})
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
        }

    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }

}


//9. signByKey
//Consent 객체에서 ID에 해당하는 객체의 SubjectConsentSignTime , SubjectSignHash 값 저장,  "" 입력시 스킵.
exports.signByKey =async function(req, res, next ){
    try{
        let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;

        //
        const consentData = req.body;
        
        const userExists = await wallet.exists(userName);
        // console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        const result = await contract.submitTransaction(
            'signByKey',
            consentData.consent_idx,
            consentData.subject_consent_sign_time,
            consentData.subject_sign_hash
            ); 


        await gateway.disconnect();
        console.log({result: result.toString()});
        res.send({code:200, message:"OK"})
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
        }

    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }

}


//10. signByInvestigator
//Consent 객체에서 ID에 해당하는 객체의 InvestigatorID, InvestigatorConsentSignTime 값 저장,  "" 입력시 스킵.
exports.signByInvestigator =async function(req, res, next ){
    try{
        
        let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;

        const consentData = req.body;
        
        const userExists = await wallet.exists(userName);
        // console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        const result = await contract.submitTransaction(
            'signByInvestigator',
            consentData.consent_idx,
            consentData.investigator_id,
            consentData.investigator_consent_sign_time
            ); 


        await gateway.disconnect();
        console.log({result: result.toString()});
        res.send({code:200, message:"OK"})
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
        }

    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }

}


//11. withdraw
//Consent 객체에서 ID에 해당하는 객체의 이미 동의한 ConsentVersion과 일치하는 경우  withdrawTime 값 저장
exports.withdraw =async function(req, res, next ){
    try{
        let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;
        
        
        const consentData = req.body;
        
        const userExists = await wallet.exists(userName);
        // console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        const result = await contract.submitTransaction(
            'withdraw',
            consentData.consent_idx,
            consentData.consent_version,
            consentData.withdraw_time
            ); 


        await gateway.disconnect();
        console.log({result: result.toString()});
        res.send({code:200, message:"OK"})
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
        }

    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }

}


//12. createConsent 
// 동의서 생성
// ID, SiteID, protocolNo, SponsorID으로 간단한 Consent 객체생성.   transactionID(txID),MSP정보, key,생성된 consent가 반환된다.
exports.createConsent =async function(req, res, next ){
    try{     let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;
        ///

        
        const consentData = req.body;
        
        const userExists = await wallet.exists(userName);
        // console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        const result = await contract.submitTransaction(
            'createConsent',
            consentData.consent_idx,
            consentData.site_id,
            consentData.protocol_no,
            consentData.sponsor_id
            ); 


        await gateway.disconnect();
        console.log({result: result.toString()});
        res.send({code:200, message:"OK"})
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
        }

    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }

}



//13. createConsentFull 
// 동의서 생성
// Consent 객체생성, 모든 객체 field 값을 입력으로 받은ㄴ다.
// [ID, SiteID, protocalNo, SponsorID]는 필히 값이 있어야한다.
// 현 transactionID(txID), MSP 정보, key , 생성된 consent가 반환된다.

exports.createConsentFull =async function(req, res, next ){
    try{
        let data = await getWallet(req);
        let wallet = data.wallet;
        // console.log({data:data})
        let ccp = data.ccp;
        console.log(ccp)
        const consentData = req.body;
        // console.log(req.body)
        const userExists = await wallet.exists(userName);
        console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
            const network = await gateway.getNetwork(channelName);
            const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        const result = await contract.submitTransaction(
            'createConsentFull',
            consentData.consent_idx,
            consentData.site_id,
            consentData.protocol_no,
            consentData.sponsor_id,
            consentData.subject_id,
            consentData.consent_version,
            consentData.consent_hash,
            consentData.consent_explation_start_time,
            consentData.subject_consent_sign_time,
            consentData.subject_sign_hash,
            consentData.investigator_id,
            consentData.investigator_consent_sign_time,
            "",
            ); 


        await gateway.disconnect();
        console.log({result: result.toString()});
        res.send(output_result(200, "ok"))
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
        }

    }catch(err){
        console.error({err:err});
        res.send(output_result(400,err));
    }

}



exports.searchStudy =async function(req, res, next ){
    try{
        let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;
        ///
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
        let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;
        ///

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


exports.updateConsent =async function(req, res, next ){
    try{
        let data = await getWallet(req);
        let wallet = data.wallet;

        let ccp = data.ccp;
        ///
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

async function wallet_config(data){
    // let site_code = data.site_code;
    let protocol_no = data.protocol_no;
     // 변수 선언
     let user_id = req.body.user_id;
    
     let dir_path =  path.join(path.dirname(require.main.filename),'upload/profile/fabric/_idwallet');
     //config파일 찾기
     fs.readdir(lot_file, function(err, filelist){
        console.log(filelist);
        var filename = filelist[0];
        // res.download(`${dir_path}/${filename}`)
        console.log(`${dir_path}/${filename}`)
        return `${dir_path}/${filename}`
    })

     // 폴더경로 찾기
     // 지갑에 경로 넣어주기
     // 지갑에서 사용할 사용자이름 넣기
     // 없으면 계정요청. 

}

function output_result(status, result){

    if(!show_status){
        return result;
    }else{
        return {status:status, message: result};
    }

}












