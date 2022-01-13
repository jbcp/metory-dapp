const express = require('express');
const router = express.Router();
var multer = require("multer");
var fs = require('fs');
const mkdirp = require('mkdirp');

// var upload = multer({dest: "uploads/"});
var storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, `uploads/`)
    },
    filename: function (req, file, cb){
        cb(null, file.originalname)
    }
})

var upload = multer({storage:storage});

// 업로드 파일 저장
/**
 * 실시기관에서 IBM Cloud Hyperledger fabric에 접속 profile을 업로드를 한다.
 * @param {string} site_id 실시기관 식별코드
 * @param {string} protocol_no 임상연구 계획서번호
 * @param {string} user_file 업로드할 파일식별 코드
 * @return {string} 성공여부내용 또는 실패여부내용
 */
router.post('/upload',  upload.single('user_file'), (req, res, next)=>{
    try{
        //* 오류체크
        //* 변수선언 */
        //* protocol 번호 소문자, 관련 특수 문자제거하기.
        //* 저장경로 설정 및 파일명 설정.
        //* 파일저장.
      
        //* 오류체크 - 파라미터값 체크
        console.log({body:req.body, file:req.file})
        if(req.body ==undefined || req.file==undefined){
            var result ={
                code:"500",
                message:"파라미터값을 확인해주세요"
            }
            res.send(result);
            return;
        }
        
        //* 오류체크 - json파일 확인
        if(req.file.originalname.indexOf('.json')==-1){
            var result ={
                code:"500",
                message:"json파일을 업로드 해주세요."
            }
            res.send(result);
            return;
        }

        //* 변수선언
        var file_name = req.file.originalname;
        var site_id = req.body.site_id;
        var protocol_no = req.body.protocol_no;

        //* protocol 문자변경
        //소문자
        protocol_no = protocol_no.toLowerCase(); 
        //특수문자 제거
        let chk_no = protocol_no.indexOf('_');
        for(i=0;i<chk_no;i++){
            protocol_no = protocol_no.replace('_','');
        }
        //"-" 제거
        chk_no = protocol_no.indexOf('-');
        for(i=0;i<chk_no;i++){
            protocol_no= protocol_no.replace('-','');
        }
      
        //* 파일저장경로설정.
        //* uploads 폴더에 파일이 저장 => 해당 파일을 ./site_id/protocol_no/에 파일 이동
        var file_path = `uploads/${file_name}` //업로드되는 파일
        var dir_path = `uploads/profiles/${site_id}/${protocol_no}` //저장될 폴더경로
        var copy_path = `${dir_path}/${file_name}`; //실제 저장될파일 경로
        

	 const removeDir = async function(path) {
            if (fs.existsSync(path)) {
              const files = fs.readdirSync(path)
          
              if (files.length > 0) {
                files.forEach(function(filename) {
                  if (fs.statSync(path + "/" + filename).isDirectory()) {
                    removeDir(path + "/" + filename)
                  } else {
                    fs.unlinkSync(path + "/" + filename)
                  }
                })
                fs.rmdirSync(path)
              } else {
                fs.rmdirSync(path)
              }
            } else {
              console.log("Directory path not found.")
            }
          }
        removeDir(dir_path);
        
        //지갑폴더 내용 지우기.
        let wallet_dir = `controller/features/fabric/_idwallet/${site_id}`
        removeDir(wallet_dir);



        fs.stat(dir_path, function(err){
            //해당 연구계획서 폴더가 있는경우
            //내부 파일을 모두 삭제한 후 업로드 
            if(!err){
                console.log('파일있어');
                fs.rmdir(dir_path, function(err){
                    if(err){
                        console.log({err:err})
                    }else{
                        console.log('ok')
                    }
                })
            }
            else if(err.code === 'ENOENT'){
                console.log({err:err});
                console.log('파일 없어')
                console.log(`uploads/profiles/${site_id}/${protocol_no}`);
                mkdirp(dir_path).then(made =>{
                    console.log('ok');
                    fs.rename(file_path, copy_path, (err)=>{
                        if(err){
                            console.log({err_copy:err});
                        }
                        res.send(
                            {
                                code: 200,
                                messge: "profile 업로드가 완료되었습니다."
                            }
                        );
                    })
                })
            }
        })
    }catch(err){
        console.log(err);
        res.send({
            code:500, 
            messge: err
        })
    }
})



// 업로드 파일 불러오기 
router.post('/load', (req, res, next)=>{
    try{
        console.log({"body":req.body, "params":req.params});
        var site_id = req.body.site_id;
        var protocol_no = req.body.protocol_no
        // var file_path = `uploads/${file_name}`
        var dir_path = `uploads/profiles/${site_id}/${protocol_no}`
        // var copy_path = `${dir_path}/${file_name}`;
        
        var lot_file = `${dir_path}`

        fs.readdir(lot_file, function(err, filelist){
            console.log(filelist);
            var filename = filelist[0];
            res.download(`${dir_path}/${filename}`)
            console.log(`${dir_path}/${filename}`)
        })
        // res.send(filelist);
    }catch(err){
        console.log(err);
        res.send({
            code:500,
            messge: err
        })
    }
})


exports.uploadProfile =async function(req, res, next ){
    try{
        console.log("Start uploadProfile")
    }catch(err){
        console.log({err:err});
    }finally{

    }
}


module.exports = router;
