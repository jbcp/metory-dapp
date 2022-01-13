//* admin계정생성
// 각 기관별로 admin계정을 생성함
// admin계정으로 각 기관의 연구자 인증서를 발급해야함. 

'use strict';

const FabricCAServices = require('fabric-ca-client');

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const util = require('util');
const readdir = util.promisify(fs.readdir);

// const configDirectory = path.join(process.cwd(), './');
// const configPath = path.join(configDirectory, 'config.json');
// const configJSON = fs.readFileSync(configPath, 'utf8');
// const config = JSON.parse(configJSON);



// * 설정변수
//dapp 관리자 계정
const A = 'app-admin'
//접속 관련 설정
const gatewayDiscoveryEnabled = true;
const gatewayDiscoveryAsLocalhost = false;

/**
 * app 관리자 계정을 가져와 등록한다.
 * - 실시기관/app-admin 폴더가 있는지 확인한다.
 * - 처음 접속할 경우 app-admin 계정을 등록한다.
 * - 없을 경우 계정을 등록한다.
 * - param은 req.body의 변수를 나타낸다.
 * @param {string} site_id 실시기관 코드
 * @param {string} protocol_no 임상연구 계획서번호
 * @param {string} channel_name 채널정보
 */
exports.enrollAdmin = async function(req, res, next){
    //순서
    //msp정보파일 경로 가져오기
    //채널정보가져오기.
    //연구자ID가져오기.
    //admin폴더 경로설정하기
    //admin폴더 만들기
    //app-admin 인증서 등록하기.
    let protocol_no ='';
    let buf = '';
    let channel_name = '';
    
    try{
        //파라미터값 확인
        if( req.body.site_id==undefined || 
            req.body.protocol_no==undefined){
            var result = {
                code: 500,
                message: "파라미터값을 확인하세요."
            }
            res.send(result);
            return;
        }

        //로그
        // console.log({req_body:req.body});

        //* protocol전처리
        protocol_no = req.body.protocol_no;
        protocol_no = pre_protocol_no(protocol_no);

        //* channel_name 설정
        //채널정보는 일반적으로 protocol 번호로 한다. 
        // protocol 번호 모두 소문자로 한다.
        // protocol 번호는 "-","_"모두 제거한다.

        // * 추가 변수
        let site_id  = req.body.site_id
        let profile_path;
        let file_name;

        let appAdmin='app-admin';
        let appAdminSecret='app-adminpw';

        //* 프로파일 경로주소 만들기 
        var dir_path = `uploads/profiles/${site_id}/${protocol_no}`;
        // console.log({dir_path:dir_path}); //로그

        //* 프로파일 읽기
        // site_id와 protocol_no를 이용하여 
        // msp저장 경로를 설정한다. 
        // uploads/profiles/site_id/protocol_no
        //
        
        //해당 경로가 없을 경우처리.
        try{
            file_name = await readdir(dir_path);
        }catch(err){
            console.log({readdir_err: err})
            if(err.code=='ENOENT'){
                var result = {
                    code:500,
                    message:'site_id 또는 protocol_no를 확인해주세요.'
                }
                res.send(result);
                return;
            }
        }
        //profile읽기.
        file_name = file_name[0];
        profile_path = `${dir_path}/${file_name}`;
        const ccpJSON = fs.readFileSync(profile_path, 'utf8');
        let ccp = JSON.parse(ccpJSON);
        // console.log(ccp);
        
        //* 블록체인에 appAdmin계정으로 접근
        const FabricCAServices  = require('fabric-ca-client');
        const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
        //orgMSPID, caNAME, url 가져오기 
        let orgMSPID = JSON.stringify(ccp.organizations).split("\"")[1];
        let caName = ccp.organizations[orgMSPID].certificateAuthorities
        const caURL = ccp.certificateAuthorities[caName].url;
        const ca_admin = new FabricCAServices(caURL);

        //app-admin 인증서 등록하기
        const configDrectory = path.join(process.cwd(), `controller/features/fabric/_idwallet/${site_id}`);
        const walletPath = path.join(configDrectory);
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);//로그

        //admin 인증서가 있는지 확인
        const adminExists = await wallet.exists(appAdmin);

        //admin 계정확인
        if (adminExists) {
            console.log('1.An identity for the admin user ' + appAdmin + ' already exists in the wallet');
            res.send({code:200, message:"관리자계정이 이미 등록되어 있습니다."})
        }else{
            //계정 등록하기. 
            const enrollment = await ca_admin.enroll({ enrollmentID: appAdmin, enrollmentSecret: appAdminSecret });
            const identity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(appAdmin, identity);
            console.log('msg: Successfully enrolled admin user ' + appAdmin + ' and imported it into the wallet');
            res.send({code: 200, message:'관리자계정 등록성공'});
            return;
        }
    }catch(err){
        console.log({enrollAdmin_err:err});
    }finally{
        
    }
}


/**
 * app관리자 계정으로 블록체인에 접근할 수 있는 연구자 계정 생성
 * - 연구자ID는 플랫폼 연구자 계정으로 한다.
 * 
 * @param {*} site_id 실시기관 코드
 * @param {*} protocol_no 임상연구 계획서번호
 * @param {*} user_id 연구자ID
 * 
 */
exports.addUser = async function(req, res,next){
    //* 파라미터 값 오류 체크 
    if( req.body.site_id == undefined ||
        req.body.protocol_no == undefined ||
        req.body.user_id == undefined        )
        {
            res.send('파라미터값을 확인해주세요')
            return;
        }
    
    // * protocol_no 전처리 작업, site_id, user_id, channel_name 변수선언
        let protocol_no = req.body.protocol_no;
        protocol_no = pre_protocol_no(protocol_no);
        
        let site_id = req.body.site_id;
        let user_id = req.body.user_id;
        let channel_name = req.body.channel_name;
    
       //* 프로파일 경로주소 만들기 
       var dir_path = `uploads/profiles/${site_id}/${protocol_no}`;
       // console.log({dir_path:dir_path}); //로그

       //* 프로파일 읽기
       // site_id와 protocol_no를 이용하여 
       // msp저장 경로를 설정한다. 
       // uploads/profiles/site_id/protocol_no
       //
       
       //해당 경로가 없을 경우처리.
       let file_name ='';
       try{
           file_name = await readdir(dir_path);
       }catch(err){
           console.log({readdir_err: err})
           if(err.code=='ENOENT'){
               var result = {
                   code:500,
                   message:'site_id 또는 protocol_no를 확인해주세요.'
               }
               res.send(result);
               return;
           }
       }
        //profile읽기.

        try{
            file_name = file_name[0];
            let profile_path = `${dir_path}/${file_name}`;
            const ccpJSON = fs.readFileSync(profile_path, 'utf8');
            let ccp = JSON.parse(ccpJSON);
            //console.log(ccp);
    
            //* wallet 경로 가져오기. 
            const configDrectory = path.join(process.cwd(), `controller/features/fabric/_idwallet/${site_id}`);
            const walletPath = path.join(configDrectory);
            // console.log(walletPath)
            const wallet = new FileSystemWallet(walletPath);
    
            const userExists = await wallet.exists(user_id);
            if(userExists){
                console.log(`'${user_id}' 계정이 이미 있습니다.`);
                let result = {
                    code:500,
                    message : `'${user_id}' 계정이 이미 있습니다.`
                }
                res.send(result);
                return ;
            }
    
            //app-admin계정 있는지 확인
            const adminExists = await wallet.exists('app-admin');
            if (!adminExists) {
                console.log('An identity for the admin user "admin" does not exist in the wallet');
                console.log('Run the enrollAdmin.js application before retrying');
                return;
            }
            
            //* 블록체인 접속 준비 
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: 'app-admin', discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
            // const network = await gateway.getNetwork(channelName);
            // const contract = await network.getContract('crcpcc');
    
            // Get the CA client object from the gateway for interacting with the CA.
            const ca = gateway.getClient().getCertificateAuthority();
            const adminIdentity = gateway.getCurrentIdentity();
    
             // Register the user, enroll the user, and import the new identity into the wallet.
            const secret = await ca.register({ affiliation: '', enrollmentID: user_id, role: 'client', enrollmentSecret:`${user_id}pw` }, adminIdentity);
            const enrollment = await ca.enroll({ enrollmentID: user_id, enrollmentSecret: secret });
            const userIdentity = X509WalletMixin.createIdentity('MSP-JBCP', enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(`${user_id}`, userIdentity);
            console.log(`Successfully registered and enrolled admin user "${user_id}" and imported it into the wallet`);

            let result = {
                code: 200,
                message: `'${user_id}' 계정 생성완료`
            }
            res.send(result);
            return;

        }catch(err){
            console.log({err:err});
            let result ={
                code:500,
                message: err
            }
            res.send(result);
            
        }finally{

        }
}

//사용자 추가 계정 amin 지갑 가져오기 
exports.enrollAdmin_local = async function(req){
    //순서
    //msp정보파일 경로 가져오기
    //채널정보가져오기.
    //연구자ID가져오기.
    //admin폴더 경로설정하기
    //admin폴더 만들기
    //app-admin 인증서 등록하기.
    let protocol_no ='';
    let buf = '';
    let channel_name = '';
    
    try{
        //파라미터값 확인
        if( req.body.site_id==undefined || 
            req.body.protocol_no==undefined){
            var result = {
                code: 500,
                message: "파라미터값을 확인하세요."
            }
            // res.send(result);
            return result;
        }

        //로그
        // console.log({req_body:req.body});

        //* protocol전처리
        protocol_no = req.body.protocol_no;
        protocol_no = pre_protocol_no(protocol_no);

        //* channel_name 설정
        //채널정보는 일반적으로 protocol 번호로 한다. 
        // protocol 번호 모두 소문자로 한다.
        // protocol 번호는 "-","_"모두 제거한다.

        // * 추가 변수
        let site_id  = req.body.site_id
        let profile_path;
        let file_name;

        let appAdmin='app-admin';
        let appAdminSecret='app-adminpw';

        //* 프로파일 경로주소 만들기 
        var dir_path = `uploads/profiles/${site_id}/${protocol_no}`;
        // console.log({dir_path:dir_path}); //로그

        //* 프로파일 읽기
        // site_id와 protocol_no를 이용하여 
        // msp저장 경로를 설정한다. 
        // uploads/profiles/site_id/protocol_no
        //
        
        //해당 경로가 없을 경우처리.
        try{
            file_name = await readdir(dir_path);
        }catch(err){
            console.log({readdir_err: err})
            if(err.code=='ENOENT'){
                var result = {
                    code:500,
                    message:'site_id 또는 protocol_no를 확인해주세요.'
                }
                // res.send(result);
                return result;
            }
        }
        //profile읽기.
        file_name = file_name[0];
        profile_path = `${dir_path}/${file_name}`;
        const ccpJSON = fs.readFileSync(profile_path, 'utf8');
        let ccp = JSON.parse(ccpJSON);
        // console.log(ccp);
        
        //* 블록체인에 appAdmin계정으로 접근
        const FabricCAServices  = require('fabric-ca-client');
        const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
        //orgMSPID, caNAME, url 가져오기 
        let orgMSPID = JSON.stringify(ccp.organizations).split("\"")[1];
        let caName = ccp.organizations[orgMSPID].certificateAuthorities
        const caURL = ccp.certificateAuthorities[caName].url;
        const ca_admin = new FabricCAServices(caURL);

        //app-admin 인증서 등록하기
        const configDrectory = path.join(process.cwd(), `controller/features/fabric/_idwallet/${site_id}`);
        const walletPath = path.join(configDrectory);
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);//로그

        //admin 인증서가 있는지 확인
        const adminExists = await wallet.exists(appAdmin);

        //admin 계정확인
        if (adminExists) {
            console.log('1.An identity for the admin user ' + appAdmin + ' already exists in the wallet');
            // res.send({code:200, message:"관리자계정이 이미 등록되어 있습니다."})
            return {code:200};
        }else{
            //계정 등록하기. 
            const enrollment = await ca_admin.enroll({ enrollmentID: appAdmin, enrollmentSecret: appAdminSecret });
            const identity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(appAdmin, identity);
            console.log('msg: Successfully enrolled admin user ' + appAdmin + ' and imported it into the wallet');
            // res.send({code: 200, message:'관리자계정 등록성공'});
            return {code: 200, message:'관리자계정 등록성공'};
        }
    }catch(err){
        console.log({enrollAdmin_err:err});
    }finally{
        
    }
}

//사용자 추가 계정 amin 지갑 가져오기(대상자)
exports.enrollAdmin_local_subject = async function(req){
    //순서
    //msp정보파일 경로 가져오기
    //채널정보가져오기.
    //연구자ID가져오기.
    //admin폴더 경로설정하기
    //admin폴더 만들기
    //app-admin 인증서 등록하기.
    let protocol_no ='';
    let buf = '';
    let channel_name = '';
    
    try{
        //파라미터값 확인
        if( req.body.site_id==undefined || 
            req.body.protocol_no==undefined){
            var result = {
                code: 500,
                message: "파라미터값을 확인하세요."
            }
            // res.send(result);
            return result;
        }

        //로그
        // console.log({req_body:req.body});

        //* protocol전처리
        protocol_no = req.body.protocol_no;
        protocol_no = pre_protocol_no(protocol_no);

        //* channel_name 설정
        //채널정보는 일반적으로 protocol 번호로 한다. 
        // protocol 번호 모두 소문자로 한다.
        // protocol 번호는 "-","_"모두 제거한다.

        // * 추가 변수
        let site_id  = req.body.site_id
        let profile_path;
        let file_name;

        let appAdmin='app-admin';
        let appAdminSecret='app-adminpw';

        //* 프로파일 경로주소 만들기 
        var dir_path = `uploads/profiles/${site_id}/${protocol_no}`;
        // console.log({dir_path:dir_path}); //로그

        //* 프로파일 읽기
        // site_id와 protocol_no를 이용하여 
        // msp저장 경로를 설정한다. 
        // uploads/profiles/site_id/protocol_no
        //
        
        //해당 경로가 없을 경우처리.
        try{
            file_name = await readdir(dir_path);
        }catch(err){
            console.log({readdir_err: err})
            if(err.code=='ENOENT'){
                var result = {
                    code:500,
                    message:'site_id 또는 protocol_no를 확인해주세요.'
                }
                // res.send(result);
                return result;
            }
        }
        //profile읽기.
        file_name = file_name[0];
        profile_path = `${dir_path}/${file_name}`;
        const ccpJSON = fs.readFileSync(profile_path, 'utf8');
        let ccp = JSON.parse(ccpJSON);
        // console.log(ccp);
        
        //* 블록체인에 appAdmin계정으로 접근
        const FabricCAServices  = require('fabric-ca-client');
        const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
        //orgMSPID, caNAME, url 가져오기 
        let orgMSPID = JSON.stringify(ccp.organizations).split("\"")[1];
        let caName = ccp.organizations[orgMSPID].certificateAuthorities
        const caURL = ccp.certificateAuthorities[caName].url;
        const ca_admin = new FabricCAServices(caURL);

        //app-admin 인증서 등록하기
        const configDrectory = path.join(process.cwd(), `controller/features/fabric/_idwallet/${site_id}/subject`);
        const walletPath = path.join(configDrectory);
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);//로그

        //admin 인증서가 있는지 확인
        const adminExists = await wallet.exists(appAdmin);

        //admin 계정확인
        if (adminExists) {
            console.log('1.An identity for the admin user ' + appAdmin + ' already exists in the wallet');
            // res.send({code:200, message:"관리자계정이 이미 등록되어 있습니다."})
            return {code:200};
        }else{
            //계정 등록하기. 
            const enrollment = await ca_admin.enroll({ enrollmentID: appAdmin, enrollmentSecret: appAdminSecret });
            const identity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(appAdmin, identity);
            console.log('msg: Successfully enrolled admin user ' + appAdmin + ' and imported it into the wallet');
            // res.send({code: 200, message:'관리자계정 등록성공'});
            return {code: 200, message:'관리자계정 등록성공'};
        }
    }catch(err){
        console.log({enrollAdmin_err:err});
    }finally{
        
    }
}

//사용자 계정 서버에 생성
exports.addUser_local = async function(req){
    //* 파라미터 값 오류 체크 
    if( req.body.site_id == undefined ||
        req.body.protocol_no == undefined ||
        req.body.user_id == undefined        )
        {
            var result = {
                code: 500,
                message: "파라미터값을 확인하세요."
            }
            return result;
        }
    
    // * protocol_no 전처리 작업, site_id, user_id, channel_name 변수선언
        let protocol_no = req.body.protocol_no;
        protocol_no = pre_protocol_no(protocol_no);
        
        let site_id = req.body.site_id;
        let user_id = req.body.user_id;
        let channel_name = req.body.channel_name;
    
       //* 프로파일 경로주소 만들기 
       var dir_path = `uploads/profiles/${site_id}/${protocol_no}`;
       // console.log({dir_path:dir_path}); //로그

       //* 프로파일 읽기
       // site_id와 protocol_no를 이용하여 
       // msp저장 경로를 설정한다. 
       // uploads/profiles/site_id/protocol_no
       //
       
       //해당 경로가 없을 경우처리.
       let file_name ='';
       try{
           file_name = await readdir(dir_path);
       }catch(err){
           console.log({readdir_err: err})
           if(err.code=='ENOENT'){
               var result = {
                   code:500,
                   message:'site_id 또는 protocol_no를 확인해주세요.'
               }
            //    res.send(result);
               return result; 
           }
       }
        //profile읽기.

        try{
            file_name = file_name[0];
            let profile_path = `${dir_path}/${file_name}`;
            const ccpJSON = fs.readFileSync(profile_path, 'utf8');
            let ccp = JSON.parse(ccpJSON);
            let orgMSPID = JSON.stringify(ccp.organizations).split("\"")[1];
            //console.log(ccp);
    
            //* wallet 경로 가져오기. 
            const configDrectory = path.join(process.cwd(), `controller/features/fabric/_idwallet/${site_id}`);
            const walletPath = path.join(configDrectory);
            // console.log(walletPath)
            const wallet = new FileSystemWallet(walletPath);
    
            const userExists = await wallet.exists(user_id);
            if(userExists){
                console.log(`'${user_id}' 계정이 이미 있습니다.`);
                let result = {
                    code:501,
                    message : `'${user_id}' 계정이 이미 있습니다.`
                }
                // res.send(result);
                return result;
            }


    
            //app-admin계정 있는지 확인
            const adminExists = await wallet.exists('app-admin');
            if (!adminExists) {
                console.log('An identity for the admin user "admin" does not exist in the wallet');
                console.log('Run the enrollAdmin.js application before retrying');
                // return {code:200};
            }
            
            //* 블록체인 접속 준비 
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: 'app-admin', discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
            // const network = await gateway.getNetwork(channelName);
            // const contract = await network.getContract('crcpcc');
    
            // Get the CA client object from the gateway for interacting with the CA.
            const ca = gateway.getClient().getCertificateAuthority();
            const adminIdentity = gateway.getCurrentIdentity();
    
             // Register the user, enroll the user, and import the new identity into the wallet.
             console.log(await ca.getCaName());
            const secret = await ca.register({ affiliation: '', enrollmentID: user_id, role: 'client', enrollmentSecret:`${user_id}pw`, maxEnrollments:-1 }, adminIdentity);
            // console.log(`${user_id}pw`);
            const enrollment = await ca.enroll({ enrollmentID: user_id, enrollmentSecret: `${user_id}pw` });
            const userIdentity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(`${user_id}`, userIdentity);
            console.log(`Successfully registered and enrolled admin user "${user_id}" and imported it into the wallet`);

            let result = {
                code: 200,
                message: `'${user_id}' 계정 생성완료`
            }
            // res.send(result);
            return result;

        }catch(err){
            console.log({err:err});
            let result ={
                code:500,
                message: err
            }
            return result
            
        }finally{

        }
}


//사용자 계정 서버에 생성(대상자)
exports.addUser_local_subject = async function(req){
    //* 파라미터 값 오류 체크 
    if( req.body.site_id == undefined ||
        req.body.protocol_no == undefined ||
        req.body.user_id == undefined        )
        {
            var result = {
                code: 500,
                message: "파라미터값을 확인하세요."
            }
            return result;
        }
    
    // * protocol_no 전처리 작업, site_id, user_id, channel_name 변수선언
        let protocol_no = req.body.protocol_no;
        protocol_no = pre_protocol_no(protocol_no);
        
        let site_id = req.body.site_id;
        let user_id = req.body.user_id;
        let channel_name = req.body.channel_name;
    
       //* 프로파일 경로주소 만들기 
       var dir_path = `uploads/profiles/${site_id}/${protocol_no}`;
       // console.log({dir_path:dir_path}); //로그

       //* 프로파일 읽기
       // site_id와 protocol_no를 이용하여 
       // msp저장 경로를 설정한다. 
       // uploads/profiles/site_id/protocol_no
       //
       
       //해당 경로가 없을 경우처리.
       let file_name ='';
       try{
           file_name = await readdir(dir_path);
       }catch(err){
           console.log({readdir_err: err})
           if(err.code=='ENOENT'){
               var result = {
                   code:500,
                   message:'site_id 또는 protocol_no를 확인해주세요.'
               }
            //    res.send(result);
               return result; 
           }
       }
        //profile읽기.

        try{
            file_name = file_name[0];
            let profile_path = `${dir_path}/${file_name}`;
            const ccpJSON = fs.readFileSync(profile_path, 'utf8');
            let ccp = JSON.parse(ccpJSON);
            let orgMSPID = JSON.stringify(ccp.organizations).split("\"")[1];
            let caName = ccp.organizations[orgMSPID].certificateAuthorities
            //console.log(ccp);
    
            //* wallet 경로 가져오기. 
            const configDrectory = path.join(process.cwd(), `controller/features/fabric/_idwallet/${site_id}/subject`);
            const walletPath = path.join(configDrectory);
            // console.log(walletPath)
            const wallet = new FileSystemWallet(walletPath);
    
            const userExists = await wallet.exists(user_id);
            if(userExists){
                console.log(`'${user_id}' 계정이 이미 있습니다.`);
                let result = {
                    code:501,
                    message : `'${user_id}' 계정이 이미 있습니다.`
                }
                // res.send(result);
                return result;
            }


    
            //app-admin계정 있는지 확인
            const adminExists = await wallet.exists('app-admin');
            if (!adminExists) {
                console.log('An identity for the admin user "admin" does not exist in the wallet');
                console.log('Run the enrollAdmin.js application before retrying');
                // return {code:200};
            }
            
            //* 블록체인 접속 준비 
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: 'app-admin', discovery: { enabled: gatewayDiscoveryEnabled, asLocalHost: gatewayDiscoveryAsLocalhost } });
            // const network = await gateway.getNetwork(channelName);
            // const contract = await network.getContract('crcpcc');
    
            // Get the CA client object from the gateway for interacting with the CA.
            const ca = gateway.getClient().getCertificateAuthority();
            const adminIdentity = gateway.getCurrentIdentity();
    
             // Register the user, enroll the user, and import the new identity into the wallet.
             console.log(await ca.getCaName());
            const secret = await ca.register({ affiliation: '', enrollmentID: user_id, role: 'client', enrollmentSecret:`${user_id}pw`, maxEnrollments:-1 }, adminIdentity);
            // console.log(`${user_id}pw`);
            const enrollment = await ca.enroll({ enrollmentID: user_id, enrollmentSecret: `${user_id}pw` });
            const userIdentity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(`${user_id}`, userIdentity);
            console.log(`Successfully registered and enrolled admin user "${user_id}" and imported it into the wallet`);

            let result = {
                code: 200,
                message: `'${user_id}' 계정 생성완료`
            }
            // res.send(result);
            return result;

        }catch(err){
            console.log({err:err});
            let result ={
                code:500,
                message: err
            }
            return result
            
        }finally{

        }
}

//등록된 계정 가져오기.
exports.enrolluser_local = async function(req){
    //순서
    //msp정보파일 경로 가져오기
    //채널정보가져오기.
    //연구자ID가져오기.
    //admin폴더 경로설정하기
    //admin폴더 만들기
    //app-admin 인증서 등록하기.
    let protocol_no ='';
    let buf = '';
    let channel_name = '';
    
    try{
        //파라미터값 확인
        if( req.body.site_id==undefined || 
            req.body.protocol_no==undefined){
            var result = {
                code: 500,
                message: "파라미터값을 확인하세요."
            }
            // res.send(result);
            return result;
        }

        //로그

        // console.log({req_body:req.body});

        //* protocol전처리
        protocol_no = req.body.protocol_no;
        protocol_no = pre_protocol_no(protocol_no);

        //* channel_name 설정
        //채널정보는 일반적으로 protocol 번호로 한다. 
        // protocol 번호 모두 소문자로 한다.
        // protocol 번호는 "-","_"모두 제거한다.

        // * 추가 변수
        let site_id  = req.body.site_id;
        let user_id = req.body.user_id;
        let profile_path;
        let file_name;

        let appAdmin=`${user_id}`;
        let appAdminSecret=`${user_id}pw`;
        console.log(appAdmin, appAdminSecret)
        //* 프로파일 경로주소 만들기 
        var dir_path = `uploads/profiles/${site_id}/${protocol_no}`;
        // console.log({dir_path:dir_path}); //로그

        //* 프로파일 읽기
        // site_id와 protocol_no를 이용하여 
        // msp저장 경로를 설정한다. 
        // uploads/profiles/site_id/protocol_no
        //
        
        //해당 경로가 없을 경우처리.
        try{
            file_name = await readdir(dir_path);
        }catch(err){
            console.log({readdir_err: err})
            if(err.code=='ENOENT'){
                var result = {
                    code:500,
                    message:'site_id 또는 protocol_no를 확인해주세요.'
                }
                // res.send(result);
                return result;
            }
        }
        //profile읽기.
        file_name = file_name[0];
        profile_path = `${dir_path}/${file_name}`;
        const ccpJSON = fs.readFileSync(profile_path, 'utf8');
        let ccp = JSON.parse(ccpJSON);
        // console.log(ccp);
        
        //* 블록체인에 appAdmin계정으로 접근
        const FabricCAServices  = require('fabric-ca-client');
        const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
        //orgMSPID, caNAME, url 가져오기 
        let orgMSPID = JSON.stringify(ccp.organizations).split("\"")[1];
        let caName = ccp.organizations[orgMSPID].certificateAuthorities
        const caURL = ccp.certificateAuthorities[caName].url;
        const ca_admin = new FabricCAServices(caURL);

        //app-admin 인증서 등록하기
        const configDrectory = path.join(process.cwd(), `controller/features/fabric/_idwallet/${site_id}`);
        const walletPath = path.join(configDrectory);
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);//로그

        //admin 인증서가 있는지 확인
        const adminExists = await wallet.exists(appAdmin);

        //admin 계정확인
        if (adminExists) {
            console.log('1.An identity for the admin user ' + appAdmin + ' already exists in the wallet');
            // res.send({code:200, message:"관리자계정이 이미 등록되어 있습니다."})
            return {code:501};
        }else{
            //계정 등록하기. 
            const enrollment = await ca_admin.enroll({ enrollmentID: appAdmin, enrollmentSecret: appAdminSecret });
            const identity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(appAdmin, identity);
            console.log('msg: Successfully enrolled admin user ' + appAdmin + ' and imported it into the wallet');
            // res.send({code: 200, message:'관리자계정 등록성공'});
            return {code: 200, message:'관리자계정 등록성공'};
        }
    }catch(err){
        console.log({enrollAdmin_err:err}); 
        return {code:501};
    }finally{
        
    }
}

//등록된 계정 가져오기(subject)
exports.enrolluser_local_subject = async function(req){
    //순서
    //msp정보파일 경로 가져오기
    //채널정보가져오기.
    //연구자ID가져오기.
    //admin폴더 경로설정하기
    //admin폴더 만들기
    //app-admin 인증서 등록하기.
    let protocol_no ='';
    let buf = '';
    let channel_name = '';
    
    try{
        //파라미터값 확인
        if( req.body.site_id==undefined || 
            req.body.protocol_no==undefined){
            var result = {
                code: 500,
                message: "파라미터값을 확인하세요."
            }
            // res.send(result);
            return result;
        }

        //로그

        // console.log({req_body:req.body});

        //* protocol전처리
        protocol_no = req.body.protocol_no;
        protocol_no = pre_protocol_no(protocol_no);

        //* channel_name 설정
        //채널정보는 일반적으로 protocol 번호로 한다. 
        // protocol 번호 모두 소문자로 한다.
        // protocol 번호는 "-","_"모두 제거한다.

        // * 추가 변수
        let site_id  = req.body.site_id;
        let user_id = req.body.user_id;
        let profile_path;
        let file_name;

        let appAdmin=`${user_id}`;
        let appAdminSecret=`${user_id}pw`;
        console.log(appAdmin, appAdminSecret)
        //* 프로파일 경로주소 만들기 
        var dir_path = `uploads/profiles/${site_id}/${protocol_no}`;
        // console.log({dir_path:dir_path}); //로그

        //* 프로파일 읽기
        // site_id와 protocol_no를 이용하여 
        // msp저장 경로를 설정한다. 
        // uploads/profiles/site_id/protocol_no
        //
        
        //해당 경로가 없을 경우처리.
        try{
            file_name = await readdir(dir_path);
        }catch(err){
            console.log({readdir_err: err})
            if(err.code=='ENOENT'){
                var result = {
                    code:500,
                    message:'site_id 또는 protocol_no를 확인해주세요.'
                }
                // res.send(result);
                return result;
            }
        }
        //profile읽기.
        file_name = file_name[0];
        profile_path = `${dir_path}/${file_name}`;
        const ccpJSON = fs.readFileSync(profile_path, 'utf8');
        let ccp = JSON.parse(ccpJSON);
        // console.log(ccp);
        
        //* 블록체인에 appAdmin계정으로 접근
        const FabricCAServices  = require('fabric-ca-client');
        const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
        //orgMSPID, caNAME, url 가져오기 
        let orgMSPID = JSON.stringify(ccp.organizations).split("\"")[1];
        let caName = ccp.organizations[orgMSPID].certificateAuthorities
        const caURL = ccp.certificateAuthorities[caName].url;
        const ca_admin = new FabricCAServices(caURL);

        //app-admin 인증서 등록하기
        const configDrectory = path.join(process.cwd(), `controller/features/fabric/_idwallet/${site_id}/subject`);
        const walletPath = path.join(configDrectory);
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);//로그

        //admin 인증서가 있는지 확인
        const adminExists = await wallet.exists(appAdmin);

        //admin 계정확인
        if (adminExists) {
            console.log('1.An identity for the admin user ' + appAdmin + ' already exists in the wallet');
            // res.send({code:200, message:"관리자계정이 이미 등록되어 있습니다."})
            return {code:501};
        }else{
            //계정 등록하기. 
            const enrollment = await ca_admin.enroll({ enrollmentID: appAdmin, enrollmentSecret: appAdminSecret });
            const identity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(appAdmin, identity);
            console.log('msg: Successfully enrolled admin user ' + appAdmin + ' and imported it into the wallet');
            // res.send({code: 200, message:'관리자계정 등록성공'});
            return {code: 200, message:'관리자계정 등록성공'};
        }
    }catch(err){
        console.log({enrollAdmin_err:err}); 
        return {code:501};
    }finally{
        
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
