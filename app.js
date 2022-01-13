const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const bodyParser = require('body-parser');

//api 파일 등록
const indexRouter  = require('./controller/routes');
const uploadRouter  = require('./controller/routes/upload_profile');
const appFile = require('./controller/file');




const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// app.set('port', process.env.PORT || 5001);
app.set('port', process.env.PORT || 9001);


app.use(morgan('dev'));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json())
// app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// cors 접근허용

var corsOption = {
    origin: '*',
    optionSuccessStatus: 200
}
app.use(cors(corsOption));
//end cors

//
app.use('/', indexRouter);
app.use('/file', uploadRouter);
app.use('/api/profile', appFile)
app.use((req, res, next)=>{
    res.status(404).send("404 NOT FOUND");
    console.log(req.body)
    const err = new Error('Not Found');
    var ip_addr = req.headers['x-forwarded-for'] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
    console.log({'ip_addr!!!!!!!!!!!':ip_addr});
    
    err.status =404;
    next(err);
});


app.use((req, res, next)=>{
    try{
        res.locals.message = err.message;
        res.locals.err = req.app.get('env') === 'development' ? err : {};
    
        res.status(err.status || 500);
       
        // res.render('error');

    }catch(err){
        console.log({app_use_err: err});
    }
  
});

app.listen(app.get('port'),()=>{
    console.log(app.get('port'), '번 포트에서 대기중');
    console.log(Date.now());
});
