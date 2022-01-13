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

let express = require('express');
// let router = express.Router();
let format = require('date-format');
const router = express.Router();

// const hlcAdmin = require('./features/fabric/hlcAdmin');
const hlcAdmin = require('./features/fabric/hlcClient');
const appAdmin = require('./features/fabric/appAdmin');
const getBlock = require('./features/fabric/getBlockchain');

// const getBlock = require('./features/fabric/getBlockchain');
const request = require('request');


module.exports = router;
let count = 0;

/**
 * This is a request tracking function which logs to the terminal window each request coming in to the web serve and
 * increments a counter to allow the requests to be sequenced.
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 *
 * @function
 */
router.use(function(req, res, next) {
    count++;
    console.log('['+count+'] at: '+format.asString('hh:mm:ss.SSS', new Date())+' Url is: ' + req.url);
    next(); // make sure we go to the next routes and don't stop here
});

module.exports = router;

//테스트중

router.post('/api/get-channel', hlcAdmin.getChannelID);
//router.post('/api/get-consentbykey', hlcAdmin.getConsentByKey);
//router.post('/api/get-consentbysite', hlcAdmin.getConsentsBySite);
router.post('/api/get-consnethistorybykey', hlcAdmin.getConsentHistoryByKey);
//router.post('/api/getAllConsents', hlcAdmin.getAllConsents);
//router.post('/api/consnet/full', hlcAdmin.createConsentFull);

router.get('/blocks', getBlock.getBlockchain)

//* 관리자 계정 관련사항 API
router.post('/api/account/enroll-admin', appAdmin.enrollAdmin);
router.post('/api/account/add-user', appAdmin.addUser);

router.post('/api/account/enroll-member', appAdmin.enrolluser_local);



//* 동의서 관련 API
//Read 특정동의서 가져오기-
router.post('/api/consent/id', hlcAdmin.getConsentByKey)//
//Read 실시기관별 동의서 가져오기 
router.post('/api/consent/site', hlcAdmin.getConsentsBySite)//
//Create 동의전체값 저장
router.post('/api/consent/full', hlcAdmin.createConsentFull)
//Create 동의서 기본값 저장
//router.post('/api/consent', hlcClient.createConsent)
//Update 동의철회
router.post('/api/consent/withdraw', hlcAdmin.withdraw);
//Read 동의 전체 가져오기.
router.post('/api/consent/all', hlcAdmin.getAllConsents);//

// router.get('/api/block', getBlock.getBlockchain );

// test
router.post('/test/api', hlcAdmin.test);

//분할해서저장_20210311
router.post('/api/consent/explanation', hlcAdmin.setConsentExplanationStartTime);
router.post('/api/consent/sign-subject', hlcAdmin.signByKey);
router.post('/api/consent/sign-investigator', hlcAdmin.signByInvestigator);
router.post('/api/consent/withdraw', hlcAdmin.withdraw);


router.get('/', (req, res, next)=>{
    try{
        //const data =''
        //const con =0
        //console.log(data, " ", con)
        //res.render('rdesearch',{data:data, con:con})
	res.status(404).send("404 NOT FOUND");
    console.log(req.body)
    const err = new Error('Not Found');
    var ip_addr = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
    console.log({'ip_addr!!!!!!!!!!!':ip_addr});

    err.status =404;

    }catch(err){
        console.log(err);
    }
} );

router.post('/', async (req, res, next)=>{
    try{
	    res.status(404).send("404 NOT FOUND");
    console.log(req.body)
    const err = new Error('Not Found');
    var ip_addr = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
    console.log({'ip_addr!!!!!!!!!!!':ip_addr});

    err.status =404;
	return 0;

        const protocol_no =req.body.protocol_no;
        const site =req.body.site;
        const channel_name =req.body.channel_name;
        const user_id =req.body.user_id;

        var con = 0;
        var consent_data ='';

        if(req.body.con0!=undefined)
            con = req.body.con0
        if(req.body.con1!=undefined)
            con = req.body.con1
        if(req.body.con2!=undefined)
            con = req.body.con2
            if(req.body.con3!=undefined)
            con = req.body.con3

        var data=[]
        console.log({req: {code : req.body, con :con }})
        console.log(req.body, " ", con)

        var request = require('request');
       if(con==0){
            console.log({test:`http://localhost:9001/api/consent/site`});
            console.log({body_req: req.body});

        await request({
            uri: `http://localhost:9001/api/consent/site`,
            method:"POST",
            form:{
                protocol_no: protocol_no,
                site_id: site,
                channel_name : channel_name,
                user_id : user_id
            },
            timeout: 10000,
            followRedirect:true,
            maxRedirects: 10
            },
            function (err, response, body){
                console.log({body: body});
                if(JSON.parse(body).message.length==undefined){
                    data.push(JSON.parse(body).message)  
                }else{
                    data = JSON.parse(body).message
                }
                console.log({data:data})
                res.render('research',{data:data, con:con})        
            }
        );
       }
       if(con==1){
        console.log({test:`http://localhost:9001/api/consent/subject/${code}`});

        await request({
            uri: `http://localhost:9001/api/consent/subject/${code}`,
            method:"GET",
            timeout: 10000,
            followRedirect:true,
            maxRedirects: 10
            },
            function (err, response, body){
                console.log({body: body});
                var buf = JSON.parse(body).message;

                if(JSON.parse(body).message.length==undefined){
                    console.log({message :buf })
                    data.push({key:"", Record: buf});
                }else{
                    data = JSON.parse(body).message
                }
                console.log({data: data})
                res.render('research',{data:data, con:con})        
            }
        );
       }
       // 동의서 등록
       if(con==2){
        console.log({test:`http://localhost:9001/api/consent`});
        
      
        console.log(req.body);
        await request({
            uri: `http://localhost:9001/api/consent`,
            method:"POST",
            timeout: 10000,
            followRedirect:true,
            maxRedirects: 10,
            form:{
                consent_id: req.body.ConsentId,
                consent_hash: req.body.ConsentHash,
                consent_version: req.body.ConsentVersion,
                study_id: req.body.StudyId,
                hospital_id: req.body.HospitalId,
                sponsor_id: req.body.SponsorId,
                subject_id: req.body.SubjectId,
                subject_consent_explanation_request_time: req.body.SubjectConsentExplanationRequestTime,
                subject_consent_sign_time: req.body.SubjectConsentSignTime,
                legal_representative_id: req.body.LegalRepresentativeId,
                legal_representative_consent_explantion_request_time: req.body.LegalRepresentativeConsentExplantionRequestTime,
                legal_representative_consent_sign_time: req.body.LegalRepresentativeConsentSignTime,
                investigator_id: req.body.InvestigatorId,
                investigator_consent_explanation_confirm_time: req.body.InvestigatorConsentExplanationConfirmTime,
                investigator_consent_sign_time: req.body.InvestigatorConsentSignTime,
                status: req.body.Status          
                }
            },
            function (err, response, body){
                console.log({body: body});
                res.render('research',{data:data, con:con})        
            }
        );
       
       }
       if(con==3){
        console.log({test:`http://localhost:9001/api/consent`});
        
      
        console.log(req.body);
        await request({
            uri: `http://localhost:9001/api/consent`,
            method:"POST",
            timeout: 10000,
            followRedirect:true,
            maxRedirects: 10,
            form:{
                consent_id: req.body.ConsentId_update,
                consent_hash: req.body.ConsentHash_update,
                consent_version: req.body.ConsentVersion_update,
                study_id: req.body.StudyId_update,
                hospital_id: req.body.HospitalId_update,
                sponsor_id: req.body.SponsorId_update,
                subject_id: req.body.SubjectId_update,
                subject_consent_explanation_request_time: req.body.SubjectConsentExplanationRequestTime_update,
                subject_consent_sign_time: req.body.SubjectConsentSignTime_update,
                legal_representative_id: req.body.LegalRepresentativeId_update,
                legal_representative_consent_explantion_request_time: req.body.LegalRepresentativeConsentExplantionRequestTime_update,
                legal_representative_consent_sign_time: req.body.LegalRepresentativeConsentSignTime_update,
                investigator_id: req.body.InvestigatorId_update,
                investigator_consent_explanation_confirm_time: req.body.InvestigatorConsentExplanationConfirmTime_update,
                investigator_consent_sign_time: req.body.InvestigatorConsentSignTime_update,
                status: req.body.Status_update          
                }
            },
            function (err, response, body){
                console.log({body: body});
                res.render('research',{data:data, con:con})        
            }
        );
       
       }
    }catch(err){
        console.log(err);
    }
} );

// router.get('/', (req, res, next)=>{
//     try{
//         const result = req.body
//         console.log({req_body: req.body, result: result})
//         const title = result.title
        
//         res.render('research',{title: title});

//     }catch(err){
//         console.log(err);
//     }
// } );

// router.post('/', (req, res, next)=>{
//     try{
//         const result = req.body
//         console.log({req_body: req, result: result})
//         const title = result.title
        
//         res.render('test1',{title: title});

//     }catch(err){
//         console.log(err);
//     }
// } );
