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
router.post('/upload',  upload.single('user_file'), (req, res, next)=>{
    try{
        console.log({"body":req.body, "params":req.params});
        var file_name = req.file.originalname;
        var site_id = req.body.site_id;
        var protocol_no = "";
        protocol_no = req.body.protocol_no;
        // //프로토콜 번호 전처리(소문자, 문자 '- '제거 )
        // protocol_no = protocol_no.toLowerCase(); //소문자
        // protocol_no = protocol_no.replace('_',''); // "_" 제거
        // protocol_no = protocol_no.replace('-',''); // "-" 제거 
        // protocol_no = protocol_no.replace('-',''); // "-" 제거 

        protocol_no= pre_protocol_no(protocol_no);

        var file_path = `uploads/${file_name}`
        var dir_path = `uploads/profiles/${site_id}/${protocol_no}`
        var copy_path = `${dir_path}/${file_name}`;
        // 파일 있는지 체크 
        var file_chk = false
        fs.stat(file_path, function(err){
            if(!err){
                console.log('파일있어');
                console.log(`uploads/profiles/${site_id}/${protocol_no}`);
                mkdirp(dir_path).then(made =>{
                    console.log('ok');
                    fs.rename(file_path,copy_path, (err)=>{
                        if(err){
                            console.log({err_copy:err});
                        }
                        res.send(
                            {
                                code: 200,
                                messge: "success"
                            }
                        );
                    })
            
                })

            }
            else if(err.code === 'ENOENT'){
                console.log('파일 없어')
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

router.get('/', (req, res, next)=>{
    try{
        res.send('uploaded! :');
    }catch(err){
        console.log(err);
    }
})

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


exports.uploadProfile =async function(req, res, next ){
    try{
        console.log("Start uploadProfile")
    }catch(err){
        console.log({err:err});
    }finally{

    }
}


module.exports = router;
