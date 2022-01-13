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

const Fabric_Client = require('fabric-client');
let fabric_client = new Fabric_Client();


const readdir = util.promisify(fs.readdir);

let itemTable = null;
// const svc = require('./Z2B_Services');
// const financeCoID = 'easymoney@easymoneyinc.com';

// Bring Fabric SDK network class
const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');

const appAdmin = require('./appAdmin');

let show_status =false;

// const userName = 'app-admin'
const gatewayDiscoveryEnabled = true;
const gatewayDiscoveryAsLocalhost = false;


let smartContractName="crcpcc";

/**
 * 지갑 준비하기.
 * param값은 req에서 전달받은 파라미터값 중 필요한 값을 가져와서 준비한다.
 * 다른함수에서 호출 함수로 사용되기 때문에 파라미터값이 이상없다고 가정
 * site_id, protocol_no, channel_name, user_id 값을 가져온다.
 * @param { string } site_id 실시기관 코드 // 체인코드와 변수명이 같아 site_id를 여기선 site_code로 바꾼다.
 * @param { string } protocol_no 임상연구 계획서번호 // 전처리들어감.
 * @param { string } user_id 연구자ID
 */
 async function getWallet(req, res){
    try{
        // * 실시기관, 프로토콜 번호 값 가져오기 
        console.log({"req-body":req.body});
        
        // * protocol_no전처리, channel_name, site 변수설정
        let protocol_no = req.body.protocol_no;
        protocol_no = pre_protocol_no(protocol_no);

        let site_code = req.body.site_id;
        
        let user_id = req.body.user_id;
        let profile_path ;
        let file_name;      
        
        // * 프로파일 경로주소 만들기 
        var dir_path = `uploads/profiles/${site_code}/${protocol_no}`
        // console.log({dir_path:dir_path})
        
        // * 프로파일 읽기 
        try{
            file_name= await readdir(dir_path);
        }catch(err){
            console.log({getWallet_readdir_err:err});
            return {code:500, message:err};
        }
        
        file_name = file_name[0];
        profile_path = `${dir_path}/${file_name}`;

        const ccpJSON = fs.readFileSync(profile_path, 'utf8');
        let ccp = JSON.parse(ccpJSON);
        // console.log({ccp:ccp})

        // console.log(2)

        // * admin 접속정보 준비 
        const FabricCAServices = require('fabric-ca-client');
        const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
        //orgMSPID, caName, url 값 가져오기 
        let orgMSPID = JSON.stringify(ccp.organizations).split("\"")[1];
        console.log({orgMSPID:orgMSPID})
        // console.log({channelName:channelName, orgMSPID:orgMSPID})
        let caName = ccp.organizations[orgMSPID].certificateAuthorities

        const caURL = ccp.certificateAuthorities[caName].url;
        const ca_admin = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const configDrectory = path.join(process.cwd(), `controller/features/fabric/_idwallet/${site_code}`);
        const walletPath = path.join(configDrectory);
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists(user_id);
        console.log(user_id)

        //admin계정 확인
        if (adminExists) {
            console.log('1.An identity for the admin user ' + user_id + ' already exists in the wallet');
            // return;
        }else{
            //admin계정 등록하기 
            // Enroll the admin user, and import the new identity into the wallet.
            const enrollment = await ca_admin.enroll({ enrollmentID: user_id, enrollmentSecret: user_id+"pw" });
            const identity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(user_id, identity);
            console.log('msg: Successfully enrolled admin user ' + user_id + ' and imported it into the wallet');
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

/**
 * 지갑 준비하기(대상자용)
 * param값은 req에서 전달받은 파라미터값 중 필요한 값을 가져와서 준비한다.
 * 다른함수에서 호출 함수로 사용되기 때문에 파라미터값이 이상없다고 가정
 * site_id, protocol_no, channel_name, user_id 값을 가져온다.
 * @param { string } site_id 실시기관 코드 // 체인코드와 변수명이 같아 site_id를 여기선 site_code로 바꾼다.
 * @param { string } protocol_no 임상연구 계획서번호 // 전처리들어감.
 * @param { string } user_id 연구자ID
 */
 async function getWallet_subject(req, res){
    try{
        // * 실시기관, 프로토콜 번호 값 가져오기 
        console.log({"req-body":req.body});
        
        // * protocol_no전처리, channel_name, site 변수설정
        let protocol_no = req.body.protocol_no;
        protocol_no = pre_protocol_no(protocol_no);

        let site_code = req.body.site_id;
        
        let user_id = req.body.user_id;
        let profile_path ;
        let file_name;      
        
        // * 프로파일 경로주소 만들기 
        var dir_path = `uploads/profiles/${site_code}/${protocol_no}`
        // console.log({dir_path:dir_path})
        
        // * 프로파일 읽기 
        try{
            file_name= await readdir(dir_path);
        }catch(err){
            console.log({getWallet_readdir_err:err});
            return {code:500, message:err};
        }
        
        file_name = file_name[0];
        profile_path = `${dir_path}/${file_name}`;

        const ccpJSON = fs.readFileSync(profile_path, 'utf8');
        let ccp = JSON.parse(ccpJSON);
        // console.log({ccp:ccp})

        // console.log(2)

        // * admin 접속정보 준비 
        const FabricCAServices = require('fabric-ca-client');
        const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
        //orgMSPID, caName, url 값 가져오기 
        let orgMSPID = JSON.stringify(ccp.organizations).split("\"")[1];
        console.log({orgMSPID:orgMSPID})
        // console.log({channelName:channelName, orgMSPID:orgMSPID})
        let caName = ccp.organizations[orgMSPID].certificateAuthorities

        const caURL = ccp.certificateAuthorities[caName].url;
        const ca_admin = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const configDrectory = path.join(process.cwd(), `controller/features/fabric/_idwallet/${site_code}/subject`);
        const walletPath = path.join(configDrectory);
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists(user_id);
        console.log(user_id)

        //admin계정 확인
        if (adminExists) {
            console.log('1.An identity for the admin user ' + user_id + ' already exists in the wallet');
            // return;
        }else{
            //admin계정 등록하기 
            // Enroll the admin user, and import the new identity into the wallet.
            const enrollment = await ca_admin.enroll({ enrollmentID: user_id, enrollmentSecret: user_id+"pw" });
            const identity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(user_id, identity);
            console.log('msg: Successfully enrolled admin user ' + user_id + ' and imported it into the wallet');
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


/**
 * 채널 정보 가져오기.
 * param 값은 req 파라미터값을 가져온다.
 * req는 site_id, protocol_no, channel_name
 * @param {*} site_id 실시기관 ID
 * @param {*} protocol_no 임상연구 계획서번호
 * @param {*} channel_name  채널정보.
 */
exports.getChannelID =async function(req, res, next ){
    try{
         //*파라미터값 확인.
        if(req.body.site_id == undefined || req.body.protocol_no == undefined || req.body.channel_name == undefined ||req.body.user_id == undefined){
            let result = {
                code:500,
                message:"파라미터값을 확인해 주세요"
            }
            req.send(result);
            return 
        }

        //*지갑정보 가져오기.
        let data = await getWallet(req);
        if(data.code!=undefined || data.code==500){
            res.send(data);
            return;
        }
        let wallet = data.wallet;
        console.log(data);

        //* 블록체인 접속 준비.
        // 관련변수설정
        let userName = req.body.user_id;
        let channelName = req.body.channel_name;
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

/**
 * 특정 동의서 가져오기.
 * param은 req 의 파라미터값을 가지고 한다.
 * @param {*} site_id 실시기관 코드
 * @param {*} protocol_no 임상연구 계획서번호
 * @param {*} channel_name  채널정보
 * @param {*} consent_id 동의서 식별ID
 */
//2. ID로 StateDB의 Consent 객체 값 반환
//- ID는 동의서 찾는 주요 키값
exports.getConsentByKey =async function(req, res, next ){
    try{
        // * 파라미터 값 검사
        if(req.body.site_id == undefined || 
            req.body.protocol_no == undefined || 
            req.body.channel_name == undefined ||
            req.body.user_id == undefined || 
            req.body.consent_id ==undefined)
            {
            let result = {
                code:500,
                message:"파라미터값을 확인해 주세요"
            }
            res.send(result);
            return 
        }

          //* 지갑 생성. 
        //admin
        console.log('1.지갑생성.')
        let output_admin = await appAdmin.enrollAdmin_local(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        

        //user_id enroll 
        console.log("---start_enrollUser")
        output_admin = await appAdmin.enrolluser_local(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id 로 계정생성
        console.log("---start_addUser")
        output_admin = await appAdmin.addUser_local(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }


        // *변수설정
        // 사용할 변수를 설정.
        let data = await getWallet(req);
        let wallet = data.wallet;
        let ccp = data.ccp;
        let site_id = req.body.site_id;
        let userName = req.body.user_id;
        let channelName = req.body.channel_name;
        let consent_id = req.body.consent_id;

        console.log("Start getConsentsByKey");
        console.log({body_getConsentsBySite:req.body, String_out: req.body});;
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

/**
 * 사이트별 동의서 가져오기
 * param은 req 의 파라미터값을 가지고 한다.
 * @param {*} site_id 실시기관 코드 
 * @param {*} protocol_no 임상연구 계획서번호
 * @param {*} channel_name 채널정보
 * @param {*} user_id 연구자ID
 * @param {*} consent_id 채널정보
 * 
 */
exports.getConsentsBySite =async function(req, res, next ){
console.log({getConsentsBySite_body: req.body});
    try{
        //*파라미터값 확인
        if(req.body.site_id == undefined ||
            req.body.protocol_no == undefined ||
            req.body.channel_name == undefined ||
            req.body.user_id == undefined 
            ){
                let result = {
                    code:500,
                    message:"파라미터값을 확인하세요"
                }
                res.send(result);
                return;
        }
        //* 지갑 생성. 
        //admin
        console.log('1.지갑생성.')
        let output_admin = await appAdmin.enrollAdmin_local(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        

        //user_id enroll 
        console.log("---start_enrollUser")
        output_admin = await appAdmin.enrolluser_local(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id 로 계정생성
        console.log("---start_addUser")
        output_admin = await appAdmin.addUser_local(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }


        // *변수설정
        // 사용할 변수를 설정.
        let data = await getWallet(req);
        let wallet = data.wallet;
        let ccp = data.ccp;
        let site_id = req.body.site_id;
        let userName = req.body.user_id;
        let channelName = req.body.channel_name;

        console.log("Start getConsentsBySite");
        console.log({body_getConsentsBySite:req.body, String_out: req.body});;
        const userExists = await wallet.exists(userName);
        
        // 계정파일이 있는지 확인
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }
                
        const gateway = new Gateway();
        // console.log({ccp:ccp, wallet:wallet})
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
        if(result.toString()!=''){
            //output_result 
            //전역변수가 show_status 기본값이 false
            let out_result = {
                code :200, message: JSON.parse(result)
            }
            console.log({out_result:out_result});
            res.send(out_result);
            return;
        }
        else{
            let out_result = {
                code :200, message: result
            }
            console.log({out_result:out_result});
            res.send(out_result);
            return;
        }
            

    }catch(err){
        console.log("getConsentsBySite_error")
        console.error({err:err});
        res.send(output_result(500, err));
    }
}


/**
 * 특정동의서 이전기록모두 보기.
 * 해당 동의서의 StateDB의 모든 객체를 반환하여 과거기록을 조회를 할 수 있다. 
 * Param은 req 내용을 사용 
 * @param {*} site_id 실시기관 코드 
 * @param {*} protocol_no 임상연구 계획서번호
 * @param {*} channel_name 채널정보
 * @param {*} user_id 연구자ID
 * @param {*} consent_id 채널정보
 * @param {*} consent_idx 동의서 식별정보
 */
exports.getConsentHistoryByKey =async function(req, res, next ){
    try{
        //* 파라미터값 검사.
        if(req.body.site_id == undefined ||
            req.body.protocol_no == undefined ||
            req.body.channel_name == undefined ||
            req.body.user_id == undefined ||
            req.body.consent_idx == undefined
            ){
                let result = {
                    code:500,
                    message:"파라미터값을 확인하세요"
                }
                res.send(result);
                return;
        }

    

        //* 지갑 생성. 
        //admin
        console.log('1.지갑생성.')
        let output_admin = await appAdmin.enrollAdmin_local(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }
    
        
    
        //user_id enroll 
        console.log("---start_enrollUser")
        output_admin = await appAdmin.enrolluser_local(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }
    
        //user_id 로 계정생성
        console.log("---start_addUser")
        output_admin = await appAdmin.addUser_local(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }
    
    
        // *변수설정
        // 사용할 변수를 설정.
        let data = await getWallet(req);
        let wallet = data.wallet;
        let ccp = data.ccp;
        let site_id = req.body.site_id;
        let userName = req.body.user_id;
        let channelName = req.body.channel_name;
        let consent_idx = req.body.consent_idx;

        console.log("Start getConsentHistoryByKey");
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
        
        const result = await contract.evaluateTransaction('getConsentHistoryByKey',`${data_param.consent_idx}`); 
        // const result = await contract.evaluateTransaction('queryConsentBySubject',"Subject4");
        
        console.log({result: result.toString()});      
        
        await gateway.disconnect();
        if(result.toString()!='')
            //output_result 
            //전역변수가 show_status 기본값이 false
            res.send(output_result(200, result.toString()));
        else
            res.send(output_result(200, JSON.parse('[]')));

    }catch(err){
        console.error({err:err});
        res.send(output_result(500, err));
    }

}

/**
 * 모든 동의서 반환
 * Param은 req 반환 파라미터를 사용 
 * @param {*} site_id 실시기관 코드 
 * @param {*} protocol_no 임상연구 계획서번호
 * @param {*} channel_name 채널정보
 * @param {*} user_id 연구자ID
 * @param {*} consent_id 채널정보
 */
exports.getAllConsents =async function(req, res, next ){
    try{
        //* 파라미터값 검사.
        if(req.body.site_id == undefined ||
            req.body.protocol_no == undefined ||
            req.body.channel_name == undefined ||
            req.body.user_id == undefined
            )
            {
                let result = {
                    code:500,
                    message:"파라미터값을 확인하세요"
                }
                res.send(result);
                return;
            }

        let data = await getWallet(req);
        //지갑경로 파라미터값 오류 체크
        if(data.code == 200){
            res.send(data);
            console.log(data);
            return;
        }

        //여러 변수 설정
        let wallet = data.wallet;
        let userName = req.body.user_id;
        let ccp = data.ccp;
        let channelName = req.body.channel_name;

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
        let output;
        if(result.toString()!=''){
            output ={
                code : 200, 
                message: result.toString()
            }
            res.send(output);
        }
        else{
            output ={
                code : 200, 
                message: []
            }
            res.send(output);
        }
    }catch(err){
        console.error({err:err});
        res.send(output_result({code:500, messsage:err}));
    }

}

/**
 * Consent 객체 ID에 해당하는 객채의 subject_id 값을 저장.
 * Param은 req 반환 파라미터를 사용 
 * @param {*} site_id 임상연구 코드
 * @param {*} protocol_no  임상연구 계획서번호
 * @param {*} channel_name 채널정보
 * @param {*} user_id 연구자ID
 * @param {*} consent_idx 동의서 식별번호
 * @param {*} subject_id 시험대상자 식별번호
 */
exports.setConsentInfo  =async function(req, res, next ){
    try{
        //* 파라미터값 검사.
        if(req.body.site_id == undefined ||
            req.body.protocol_no == undefined ||
            req.body.channel_name == undefined ||
            req.body.user_id == undefined ||
            req.body.consent_idx == undefined
            ){
                let result = {
                    code:500,
                    message:"파라미터값을 확인하세요"
                }
                res.send(result);
                return;
        }
        let data = await getWallet(req);
        //지갑경로 파라미터값 오류 체크
        if(data.code == 200){
            res.send(data);
            console.log(data);
            return;
        }
        let wallet = data.wallet;
        let userName = req.body.user_id;
        let ccp = data.ccp;
        let channelName = req.body.channel_name;
        
        
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
        // res.send({code:200, message:"OK"})
        if(result.toString()!='')
            res.send({code:200, message: JSON.parse(result.toString())});
        else
            res.send({code:200, message: JSON.parse('[]')});
        }

    }catch(err){
        console.error({err:err});
        res.send({code:400, message:"error"});
    }

}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
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
// exports.setConsentExplanationStartTime  =async function(req, res, next ){
//     try{
//         if(
//             req.body.channel_name == undefined ||
//             req.body.user_id == undefined ||
//             req.body.consent_idx == undefined ||
//             req.body.site_id == undefined ||
//             req.body.protocol_no == undefined ||
//             req.body.sponsor_id == undefined ||
//             req.body.subject_id == undefined ||
//             req.body.consent_version == undefined ||
//             req.body.consent_hash == undefined ||
//             req.body.consent_explation_start_time == undefined ||
//             req.body.subject_consent_sign_time == undefined ||
//             req.body.subject_sign_hash == undefined ||
//             req.body.investigator_id == undefined ||
//             req.body.investigator_consent_sign_time == undefined 
//             ){
//                 let result = {
//                     code:500,
//                     message:"파라미터값을 확인하세요"
//                 }
//                 res.send(result);
//                 return;
//         }


//         let data = await getWallet_subject(req);
//         let wallet = data.wallet;

//         let ccp = data.ccp;
//         const consentData = req.body;
        
//         const userExists = await wallet.exists(userName);
//         // console.log({"wallet":wallet});
//         if (!userExists) {
//             console.log('An identity for the user ' + userName + ' does not exist in the wallet');
//             console.log('Run the enrollAdmin.js before retrying');
//             res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
//         }else{
//         const gateway = new Gateway();
//         await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
//         const network = await gateway.getNetwork(channelName);
//         const contract = await network.getContract(smartContractName);
        
//         // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
//         // console.log({subject_id:subject_id})
//         const result = await contract.submitTransaction(
//             'setConsentExplanationStartTime',
//             consentData.consent_idx,
//             consentData.consent_explation_start_time,
//             ); 


//         await gateway.disconnect();
//         console.log({result: result.toString()});
//         res.send({code:200, message:"OK"})
//         // if(result.toString()!='')
//         //     res.send({code:200, message: JSON.parse(result.toString())});
//         // else
//         //     res.send({code:200, message: JSON.parse('[]')});
//         }

//     }catch(err){
//         console.error({err:err});
//         res.send({code:400, message:"error"});
//     }

// }


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

/**
 * Consent 객체 ID에 해당하는 객채의 subject_id 값을 저장.
 * Param은 req 반환 파라미터를 사용 
 * @param {*} site_id 임상연구 코드
 * @param {*} protocol_no  임상연구 계획서번호
 * @param {*} channel_name 채널정보
 * @param {*} user_id 연구자ID
 * @param {*} consent_idx 동의서 식별번호
 * @param {*} consent_version 시험대상자 식별번호
 * @param {*} withdraw_time 동의철회 시간
 */
//11. withdraw
//Consent 객체에서 ID에 해당하는 객체의 이미 동의한 ConsentVersion과 일치하는 경우  withdrawTime 값 저장
exports.withdraw =async function(req, res, next ){
    try{
        //* 파라미터값 검사.
        if(
            req.body.site_id == undefined ||
            req.body.protocol_no == undefined ||
            req.body.channel_name == undefined ||
            req.body.user_id == undefined ||

            req.body.consent_idx == undefined ||
            req.body.consent_version == undefined ||
            req.body.withdraw_time == undefined 
            ){
                let result = {
                    code:500,
                    message:"파라미터값을 확인하세요"
                }
                res.send(result);
                return;
        }

        let data = await getWallet(req);
        let wallet = data.wallet;
        //지갑경로 파라미터값 오류 체크
        if(data.code == 200){
            res.send(data);
            console.log(data);
            return;
        }

        let ccp = data.ccp;
        let userName = req.body.user_id;
        let channelName = req.body.channel_name;
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



/**
 * Consent 객체 ID에 해당하는 객채의 subject_id 값을 저장.
 * Param은 req 반환 파라미터를 사용 
 * @param {*} site_id 임상연구 코드
 * @param {*} protocol_no  임상연구 계획서번호
 * @param {*} channel_name 채널정보
 * @param {*} user_id 연구자ID
 * @param {*} consent_idx 동의서 식별번호
 * @param {*} subject_id 시험대상자 식별번호
 */
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



/**
 * Consent 생성
 * Param은 req 반환 파라미터를 사용 
 * id, siteId, protocolNO, SponsoId는 필수로 값이 있어야 한다.
 * @param {*} protocol_no  임상연구 계획서번호
 * @param {*} channel_name 채널정보
 * @param {*} user_id 연구자ID
 * 
 * @param {*} consent_idx 동의서 식별번호
 * @param {*} site_id 임상연구 ID
 * @param {*} protocol_no 임상연구 계획서번호
 * @param {*} sponsor_id  의롸자 ID
 * @param {*} subject_id  시험대상자 ID
 * @param {*} consent_version 동의서버전
 * @param {*} consent_hash 동의서해시
 * @param {*} consent_explation_start_time 동의서설명시간
 * @param {*} subject_consent_sign_time  시험대상자 동의서 서명시간
 * @param {*} subject_sign_hash 시험대상자 동의서 서명 해시
 * @param {*} investigator_id 연구자 ID
 * @param {*} investigator_consent_sign_time 연구자 동의서 서명시간
 */

 
//13. createConsentFull 
// 동의서 생성
// Consent 객체생성, 모든 객체 field 값을 입력으로 받은ㄴ다.
// [ID, SiteID, protocalNo, SponsorID]는 필히 값이 있어야한다.
// 현 transactionID(txID), MSP 정보, key , 생성된 consent가 반환된다.

exports.createConsentFull =async function(req, res, next ){
    try{
        //* 파라미터값 검사.
        if(
            req.body.channel_name == undefined ||
            req.body.user_id == undefined ||
            req.body.consent_idx == undefined ||
            req.body.site_id == undefined ||
            req.body.protocol_no == undefined ||
            req.body.sponsor_id == undefined ||
            req.body.subject_id == undefined ||
            req.body.consent_version == undefined ||
            req.body.consent_hash == undefined ||
            req.body.consent_explation_start_time == undefined ||
            req.body.subject_consent_sign_time == undefined ||
            req.body.subject_sign_hash == undefined ||
            req.body.investigator_id == undefined ||
            req.body.investigator_consent_sign_time == undefined 
            ){
                let result = {
                    code:500,
                    message:"파라미터값을 확인하세요"
                }
                res.send(result);
                return;
        }

        //* 지갑 생성. 
        //admin
        let output_admin = await appAdmin.enrollAdmin_local(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id enroll 
        console.log("start_enrollUser")
        output_admin = await appAdmin.enrolluser_local(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id 로 계정생성
        console.log("start_addUser")
        output_admin = await appAdmin.addUser_local(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }


        let data = await getWallet(req);
        //지갑경로 파라미터값 오류 체크
        if(data.code == 200){
            res.send(data);
            console.log(data);
            return;
        }

        let wallet = data.wallet;
        let channelName = req.body.channel_name;
        let userName = req.body.user_id;


        // console.log({data:data})
        let ccp = data.ccp;
        
        //로그 지갑경로정보
        // console.log({ccp:ccp})
        const consentData = req.body;
        // console.log(req.body)
        const userExists = await wallet.exists(userName);
        console.log({userExists:smartContractName})
        //로그 지값정보
        //console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
            const gateway = new Gateway();
            console.log({ccp:ccp,wallet:wallet })
            await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
            const network = await gateway.getNetwork(channelName);
            const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        let startTime = new Date();
        let st = `${startTime.getFullYear()}-${startTime.getMonth()}-${startTime.getDate()} ${startTime.getHours()}:${startTime.getMinutes()}:${startTime.getSeconds()} `;
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

        let endTime = new Date();
        let et = `${endTime.getFullYear()}-${endTime.getMonth()}-${endTime.getDate()} ${endTime.getHours()}:${endTime.getMinutes()}:${endTime.getSeconds()} `;
        console.log(`startTime: ${st}`);
        console.log(`endTime: ${et}`);
        console.log(`duration: ${(endTime-startTime)/1000}`)

        await gateway.disconnect();
        //결과값로그
        //console.log({result: result.toString()});
        
        
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


/**
 * 임상연구 검색.
 * param은 req 파라미터에서 가져옴.
 * @param {*} site_id 임상연구 코드
 * @param {*} protocol_no  임상연구 계획서번호
 * @param {*} channel_name 채널정보
 * @param {*} user_id 연구자ID
 */
exports.searchStudy =async function(req, res, next ){
    try{
        //* 파라미터값 검사.
        if(req.body.site_id == undefined ||
            req.body.protocol_no == undefined ||
            req.body.channel_name == undefined ||
            req.body.user_id == undefined ||
            req.body.consent_idx == undefined
            ){
                let result = {
                    code:500,
                    message:"파라미터값을 확인하세요"
                }
                res.send(result);
                return;
        }

        //* 지갑정보 가져오기 및 각종 변수설정
        let data = await getWallet(req);
        //지갑경로 파라미터값 오류 체크
        if(data.code == 200){
            res.send(data);
            console.log(data);
            return;
        }

        // 변수 설정
        let wallet = data.wallet;
        let userName = req.body.user_id;
        let ccp = data.ccp;
        let channelName = req.body.channel_name;

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


/**
 * 임상연구 검색.
 * param은 req 파라미터에서 가져옴.
 * @param {*} site_id 임상연구 코드
 * @param {*} protocol_no  임상연구 계획서번호
 * @param {*} channel_name 채널정보
 * @param {*} user_id 연구자ID
 * @param {*} subject_id 시험대상자ID
 */
//리턴에서 값이 없을 경우 텍스트로 리턴됨 주의 
//체인코드에서 수정이 필요할듯. 
exports.searchSubject =async function(req, res, next ){
    try{
        //* 파라미터값 검사.
        if(req.body.site_id == undefined ||
            req.body.protocol_no == undefined ||
            req.body.channel_name == undefined ||
            req.body.user_id == undefined 
            ){
                let result = {
                    code:500,
                    message:"파라미터값을 확인하세요"
                }
                res.send(result);
                return;
        }
        let data = await getWallet(req);
        //지갑경로 파라미터값 오류 체크
        if(data.code == 200){
            res.send(data);
            console.log(data);
            return;
        }
        let wallet = data.wallet;
        let userName = req.body.user_id;
        let channelName = req.body.channel_name;
        let subject_id = req.params.subject_id;
        let ccp = data.ccp;
        ///

       
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

//동의시작
exports.setConsentExplanationStartTime= async function (req, res, next ){
    let startTime ;
    let st ;
    try{
        //admin 계정유무판단
        //user 계정 유무
        //지갑 다운
        //서버접속
        //Consent 유무판단
        //내용저장
        console.log('-----------------');

        // 파라미터 JSON 형태 확인
        // console.log(JSON.parse(req.body));

        //* 파라미터값 검사.
        if(
            req.body.channel_name == undefined ||
            req.body.user_id == undefined ||

            req.body.consent_idx == undefined ||
            req.body.site_id == undefined ||
            req.body.protocol_no == undefined ||
            req.body.sponsor_id == undefined ||
            req.body.subject_id == undefined ||
            req.body.consent_version == undefined ||
            req.body.consent_hash == undefined ||
            req.body.consent_explation_start_time == undefined             ){
                let result = {
                    code:500,
                    message:"파라미터값을 확인하세요",
                    params: req.body
                }
                res.send(result);
                return;
        }

        //* 지갑 생성. 
        //admin
        let output_admin = await appAdmin.enrollAdmin_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id enroll, 등록되 계정값이 있으면 지갑을 가져오는 함수
        console.log("start_enrollUser_subject")
        output_admin = await appAdmin.enrolluser_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id 로 계정생성, CA에 계정이 없을 경우 계정을 새로 생성
        console.log("start_addUser_subject")
        output_admin = await appAdmin.addUser_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }


        let data = await getWallet_subject(req);
        //지갑경로 파라미터값 오류 체크
        if(data.code == 200){
            res.send(data);
            console.log(data);
            return;
        }

        let wallet = data.wallet;
        let channelName = req.body.channel_name;
        let userName = req.body.user_id;


        // console.log({data:data})
        let ccp = data.ccp;
        
        //로그 지갑경로정보
        // console.log({ccp:ccp})
        const consentData = req.body;
        // console.log(req.body)
        const userExists = await wallet.exists(userName);
        console.log({userExists:smartContractName})
        //로그 지값정보
        //console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
            const gateway = new Gateway();
            console.log({ccp:ccp,wallet:wallet })
            await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
            const network = await gateway.getNetwork(channelName);
            const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        startTime = new Date();
        st = `${startTime.getFullYear()}-${startTime.getMonth()}-${startTime.getDate()} ${startTime.getHours()}:${startTime.getMinutes()}:${startTime.getSeconds()} `;
        
        console.log(`동의사용`)
        let result = await contract.submitTransaction(
            'getConsentByKey',
            consentData.consent_idx,
            ); 

        console.log({getConsentByKey_result: result});

        //동의서 유무 판다.
        if(result==''){
            console.log('동의서가 없습니다.');
            
            //저장하기
            result = await contract.submitTransaction(
                                            'createConsentFull',
                                            consentData.consent_idx,
                                            consentData.site_id,
                                            consentData.protocol_no,
                                            consentData.sponsor_id,
                                            consentData.subject_id,
                                            consentData.consent_version,
                                            consentData.consent_hash,
                                            consentData.consent_explation_start_time,
                                            "",
                                            "",
                                            "",
                                            "",
                                            "",
                                        ); 
                
         
        }else{
            console.log('동의서가 있습니다.');
           
            //해당 동의서 
            result = await contract.submitTransaction(
                                            'setConsentExplanationStartTime',
                                            consentData.consent_idx,
                                            consentData.consent_explation_start_time
                                        ); 
        }

      

        await gateway.disconnect();
        //결과값로그
        //console.log({result: result.toString()});
        
        
        res.send(output_result(200, 'ok'))
        
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
        }

        


    }catch(err){
        console.log({err: err});
        res.send("오류 관리자에게 문의하세요.");
    }finally{
        let endTime = new Date();
        let et = `${endTime.getFullYear()}-${endTime.getMonth()}-${endTime.getDate()} ${endTime.getHours()}:${endTime.getMinutes()}:${endTime.getSeconds()} `;
        console.log(`startTime: ${st}`);
        console.log(`endTime: ${et}`);
        console.log(`duration: ${(endTime-startTime)/1000}`)
    }
};

//대상자서명
exports.signByKey= async function (req, res, next ){
    let startTime ;
    let st ;
    try{
        //admin 계정유무판단
        //user 계정 유무
        //지갑 다운
        //서버접속
        //Consent 유무판단
        //내용저장
        console.log('-----------------');

        // 파라미터 JSON 형태 확인
        // console.log(JSON.parse(req.body));

        //* 파라미터값 검사.
        if(
            req.body.channel_name == undefined ||
            req.body.user_id == undefined ||
            req.body.consent_idx == undefined ||
            req.body.subject_consent_sign_time == undefined ||
            req.body.subject_sign_hash == undefined
            ){
                let result = {
                    code:500,
                    message:"파라미터값을 확인하세요",
                    params: req.body
                }
                res.send(result);
                return;
        }

        //* 지갑 생성. 
        //admin
        let output_admin = await appAdmin.enrollAdmin_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id enroll, 등록되 계정값이 있으면 지갑을 가져오는 함수
        console.log("start_enrollUser_subject")
        output_admin = await appAdmin.enrolluser_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id 로 계정생성, CA에 계정이 없을 경우 계정을 새로 생성
        console.log("start_addUser_subject")
        output_admin = await appAdmin.addUser_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }


        let data = await getWallet_subject(req);
        //지갑경로 파라미터값 오류 체크
        if(data.code == 200){
            res.send(data);
            console.log(data);
            return;
        }

        let wallet = data.wallet;
        let channelName = req.body.channel_name;
        let userName = req.body.user_id;


        // console.log({data:data})
        let ccp = data.ccp;
        
        //로그 지갑경로정보
        // console.log({ccp:ccp})
        const consentData = req.body;
        // console.log(req.body)
        const userExists = await wallet.exists(userName);
        console.log({userExists:smartContractName})
        //로그 지값정보
        //console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
            const gateway = new Gateway();
            console.log({ccp:ccp,wallet:wallet })
            await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
            const network = await gateway.getNetwork(channelName);
            const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        startTime = new Date();
        st = `${startTime.getFullYear()}-${startTime.getMonth()}-${startTime.getDate()} ${startTime.getHours()}:${startTime.getMinutes()}:${startTime.getSeconds()} `;
        
        console.log(`동의사용`)
        let result = await contract.submitTransaction(
            'getConsentByKey',
            consentData.consent_idx,
            ); 

        console.log({getConsentByKey_result: result});

        //동의서 유무 판다.
        if(result==''){
            console.log('동의서가 없습니다.');
            
            // //저장하기
            // result = await contract.submitTransaction(
            //                                 'createConsentFull',
            //                                 consentData.consent_idx,
            //                                 consentData.site_id,
            //                                 consentData.protocol_no,
            //                                 consentData.sponsor_id,
            //                                 consentData.subject_id,
            //                                 consentData.consent_version,
            //                                 consentData.consent_hash,
            //                                 consentData.consent_explation_start_time,
            //                                 "",
            //                                 "",
            //                                 "",
            //                                 "",
            //                                 "",
            //                             ); 
                
         
        }else{
            console.log('동의서가 있습니다.');
           
            //해당 동의서 
            result = await contract.submitTransaction(
                                            'signByKey',
                                            consentData.consent_idx,
                                            consentData.subject_consent_sign_time,
                                            consentData.subject_sign_hash
                                            
                                        ); 
        }

      

        await gateway.disconnect();
        //결과값로그
        //console.log({result: result.toString()});
        
        
        res.send(output_result(200, 'ok'))
        
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
        }

        


    }catch(err){
        console.log({err});
        res.send("오류 관리자에게 문의하세요.");
    }finally{
        let endTime = new Date();
        let et = `${endTime.getFullYear()}-${endTime.getMonth()}-${endTime.getDate()} ${endTime.getHours()}:${endTime.getMinutes()}:${endTime.getSeconds()} `;
        console.log(`startTime: ${st}`);
        console.log(`endTime: ${et}`);
        console.log(`duration: ${(endTime-startTime)/1000}`)
    }
};

//연구자서명
exports.signByInvestigator= async function (req, res, next ){
    let startTime ;
    let st ;
    try{
        //admin 계정유무판단
        //user 계정 유무
        //지갑 다운
        //서버접속
        //Consent 유무판단
        //내용저장
        console.log('-----------------');

        // 파라미터 JSON 형태 확인
        // console.log(JSON.parse(req.body));

        //* 파라미터값 검사.
        if(
            req.body.channel_name == undefined ||
            req.body.user_id == undefined ||
            req.body.consent_idx == undefined ||
            req.body.site_id == undefined ||
            req.body.protocol_no == undefined ||
            req.body.investigator_id == undefined ||
            req.body.investigator_consent_sign_time == undefined 
            ){
                let result = {
                    code:500,
                    message:"파라미터값을 확인하세요",
                    params: req.body
                }
                res.send(result);
                return;
        }

        //* 지갑 생성. 
        //admin
        let output_admin = await appAdmin.enrollAdmin_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id enroll, 등록되 계정값이 있으면 지갑을 가져오는 함수
        console.log("start_enrollUser_subject")
        output_admin = await appAdmin.enrolluser_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id 로 계정생성, CA에 계정이 없을 경우 계정을 새로 생성
        console.log("start_addUser_subject")
        output_admin = await appAdmin.addUser_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }


        let data = await getWallet_subject(req);
        //지갑경로 파라미터값 오류 체크
        if(data.code == 200){
            res.send(data);
            console.log(data);
            return;
        }

        let wallet = data.wallet;
        let channelName = req.body.channel_name;
        let userName = req.body.user_id;


        // console.log({data:data})
        let ccp = data.ccp;
        
        //로그 지갑경로정보
        // console.log({ccp:ccp})
        const consentData = req.body;
        // console.log(req.body)
        const userExists = await wallet.exists(userName);
        console.log({userExists:smartContractName})
        //로그 지값정보
        //console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
            const gateway = new Gateway();
            console.log({ccp:ccp,wallet:wallet })
            await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
            const network = await gateway.getNetwork(channelName);
            const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        startTime = new Date();
        st = `${startTime.getFullYear()}-${startTime.getMonth()}-${startTime.getDate()} ${startTime.getHours()}:${startTime.getMinutes()}:${startTime.getSeconds()} `;
        
        console.log(`동의사용`)
        let result = await contract.submitTransaction(
            'getConsentByKey',
            consentData.consent_idx,
            ); 

        console.log({getConsentByKey_result: result});

        //동의서 유무 판다.
        if(result==''){
            console.log('동의서가 없습니다.');
         
         
        }else{
            console.log('동의서가 있습니다.');
           
            //해당 동의서 
            result = await contract.submitTransaction(
                                            'signByInvestigator',
                                            consentData.consent_idx,
                                            consentData.investigator_id,
                                            consentData.investigator_consent_sign_time
                                            
                                        ); 
        }

      

        await gateway.disconnect();
        //결과값로그
        //console.log({result: result.toString()});
        
        
        res.send(output_result(200, 'ok'))
        
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
        }

        


    }catch(err){
        console.log({err: err});
        res.send("오류 관리자에게 문의하세요.");
    }finally{
        let endTime = new Date();
        let et = `${endTime.getFullYear()}-${endTime.getMonth()}-${endTime.getDate()} ${endTime.getHours()}:${endTime.getMinutes()}:${endTime.getSeconds()} `;
        console.log(`startTime: ${st}`);
        console.log(`endTime: ${et}`);
        console.log(`duration: ${(endTime-startTime)/1000}`)
    }
};

//동의철회
exports.withdraw= async function (req, res, next ){
    let startTime ;
    let st ;
    try{
        //admin 계정유무판단
        //user 계정 유무
        //지갑 다운
        //서버접속
        //Consent 유무판단
        //내용저장
        console.log('-----------------');

        // 파라미터 JSON 형태 확인
        // console.log(JSON.parse(req.body));

        //* 파라미터값 검사.
        if(
            req.body.channel_name == undefined ||
            req.body.user_id == undefined ||
            req.body.consent_idx == undefined ||
            req.body.site_id == undefined ||
            req.body.protocol_no == undefined ||
            req.body.sponsor_id == undefined ||
            req.body.subject_id == undefined ||
            req.body.consent_version == undefined ||
            req.body.consent_hash == undefined ||
            req.body.withdraw_time == undefined 
            ){
                let result = {
                    code:500,
                    message:"파라미터값을 확인하세요",
                    params: req.body
                }
                res.send(result);
                return;
        }

        //* 지갑 생성. 
        //admin
        let output_admin = await appAdmin.enrollAdmin_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id enroll, 등록되 계정값이 있으면 지갑을 가져오는 함수
        console.log("start_enrollUser_subject")
        output_admin = await appAdmin.enrolluser_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id 로 계정생성, CA에 계정이 없을 경우 계정을 새로 생성
        console.log("start_addUser_subject")
        output_admin = await appAdmin.addUser_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }


        let data = await getWallet_subject(req);
        //지갑경로 파라미터값 오류 체크
        if(data.code == 200){
            res.send(data);
            console.log(data);
            return;
        }

        let wallet = data.wallet;
        let channelName = req.body.channel_name;
        let userName = req.body.user_id;


        // console.log({data:data})
        let ccp = data.ccp;
        
        //로그 지갑경로정보
        // console.log({ccp:ccp})
        const consentData = req.body;
        // console.log(req.body)
        const userExists = await wallet.exists(userName);
        console.log({userExists:smartContractName})
        //로그 지값정보
        //console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
            const gateway = new Gateway();
            console.log({ccp:ccp,wallet:wallet })
            await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
            const network = await gateway.getNetwork(channelName);
            const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        startTime = new Date();
        st = `${startTime.getFullYear()}-${startTime.getMonth()}-${startTime.getDate()} ${startTime.getHours()}:${startTime.getMinutes()}:${startTime.getSeconds()} `;
        
        console.log(`동의사용`)
        let result = await contract.submitTransaction(
            'getConsentByKey',
            consentData.consent_idx,
            ); 

        console.log({getConsentByKey_result: result});

        //동의서 유무 판다.
        if(result==''){
            console.log('동의서가 없습니다.');
         
         
        }else{
            console.log('동의서가 있습니다.');
           
            //해당 동의서 
            result = await contract.submitTransaction(
                                            'withdraw',
                                            consentData.consent_idx,
                                            consentData.consent_version,
                                            consentData.withdraw_time
                                            
                                        ); 
        }

      

        await gateway.disconnect();
        //결과값로그
        //console.log({result: result.toString()});
        
        
        res.send(output_result(200, 'ok'))
        
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
        }

        


    }catch(err){
        console.log({err: err});
        res.send("오류, 관리자에게 문의하세요.");
    }finally{
        let endTime = new Date();
        let et = `${endTime.getFullYear()}-${endTime.getMonth()}-${endTime.getDate()} ${endTime.getHours()}:${endTime.getMinutes()}:${endTime.getSeconds()} `;
        console.log(`startTime: ${st}`);
        console.log(`endTime: ${et}`);
        console.log(`duration: ${(endTime-startTime)/1000}`)
    }
};
//동의철회
exports.test= async function (req, res, next ){
    let startTime ;
    let st ;
    try{
        //admin 계정유무판단
        //user 계정 유무
        //지갑 다운
        //서버접속
        //Consent 유무판단
        //내용저장
        console.log('-----------------');

        // 파라미터 JSON 형태 확인
        // console.log(JSON.parse(req.body));

        //* 파라미터값 검사.
        if(
            req.body.channel_name == undefined ||
            req.body.user_id == undefined ||
            req.body.consent_idx == undefined ||
            req.body.site_id == undefined ||
            req.body.protocol_no == undefined ||
            req.body.sponsor_id == undefined ||
            req.body.subject_id == undefined ||
            req.body.consent_version == undefined ||
            req.body.consent_hash == undefined ||
            req.body.withdraw_time == undefined 
            ){
                let result = {
                    code:500,
                    message:"파라미터값을 확인하세요",
                    params: req.body
                }
                res.send(result);
                return;
        }

        //* 지갑 생성. 
        //admin
        let output_admin = await appAdmin.enrollAdmin_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id enroll, 등록되 계정값이 있으면 지갑을 가져오는 함수
        console.log("start_enrollUser_subject")
        output_admin = await appAdmin.enrolluser_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }

        //user_id 로 계정생성, CA에 계정이 없을 경우 계정을 새로 생성
        console.log("start_addUser_subject")
        output_admin = await appAdmin.addUser_local_subject(req);
        //code 200 성공, 500 실패
        if(output_admin.code==500){
            res.send(output_admin);
            return;
        }


        let data = await getWallet_subject(req);
        //지갑경로 파라미터값 오류 체크
        if(data.code == 200){
            res.send(data);
            console.log(data);
            return;
        }

        let wallet = data.wallet;
        let channelName = req.body.channel_name;
        let userName = req.body.user_id;
        let peerName;


         console.log({data:data})
        let ccp = data.ccp;
        
        //msp 값 가져오기 
        let msp = ccp.client.organization
        //peer 값 가져오기 
        peerName = ccp.organizations[msp].peers[0];


        //로그 지갑경로정보
         console.log({ccp_detail:ccp, msp, peerName})
        const consentData = req.body;
        // console.log(req.body)
        const userExists = await wallet.exists(userName);
        console.log({userExists:smartContractName})
        //로그 지값정보
        //console.log({"wallet":wallet});
        if (!userExists) {
            console.log('An identity for the user ' + userName + ' does not exist in the wallet');
            console.log('Run the enrollAdmin.js before retrying');
            res.send({error: 'An identity for the user ' + userName + ' does not exist in the wallet. Register ' + userName + ' first'});
        }else{
            const gateway = new Gateway();
            console.log({ccp:ccp,wallet:wallet })
            await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
            const network = await gateway.getNetwork(channelName);
            const contract = await network.getContract(smartContractName);
        
        // const result = await contract.evaluateTransaction('queryConsentByStudy',study_id);
        // console.log({subject_id:subject_id})
        startTime = new Date();
        st = `${startTime.getFullYear()}-${startTime.getMonth()}-${startTime.getDate()} ${startTime.getHours()}:${startTime.getMinutes()}:${startTime.getSeconds()} `;
        
        let channel = fabric_client.newChannel(channelName);
        let peer = fabric_client.newPeer(ccp.peers[peerName].url, {pem: ccp.peers[peerName].tlsCACerts.pem});
        channel.addPeer(peer);

        // console.log(`동의사용`)
        // let result = await contract.submitTransaction(
        //     'getConsentByKey',
        //     consentData.consent_idx,
        //     ); 

        // console.log({getConsentByKey_result: result});


        // const channel_event_hub = channel.newChannelEventHub(peerName);    
      

        await gateway.disconnect();
        //결과값로그
        //console.log({result: result.toString()});
        
        
        res.send(output_result(200, 'ok'))
        
        // if(result.toString()!='')
        //     res.send({code:200, message: JSON.parse(result.toString())});
        // else
        //     res.send({code:200, message: JSON.parse('[]')});
        }

        


    }catch(err){
        console.log({test_err: err});
        res.send("오류 관리자에게 문의하세요.");
    }finally{
        let endTime = new Date();
        let et = `${endTime.getFullYear()}-${endTime.getMonth()}-${endTime.getDate()} ${endTime.getHours()}:${endTime.getMinutes()}:${endTime.getSeconds()} `;
        console.log(`startTime: ${st}`);
        console.log(`endTime: ${et}`);
        console.log(`duration: ${(endTime-startTime)/1000}`)
    }
};

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


function pre_protocol_no(protocol_no){
    var result =''
    protocol_no = protocol_no.toLocaleLowerCase();
    let buf = protocol_no;

    //"-"제거
    for(let i=0;i<protocol_no.indexOf('-');i++){
        buf = buf.replace('-','');
    }
    //'_'제거
    for(let i=0;i<protocol_no.indexOf('_');i++){
        buf = buf.replace('_','');
    }
    //복사
    result= buf;

    return result;
}













