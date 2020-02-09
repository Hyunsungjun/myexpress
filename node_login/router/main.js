const crypto = require('crypto'); //비번이 입력되면 암호화하기 위해 임포트
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session); //2-3줄라인은 세션유지
const bodyParser = require('body-parser'); //프론트에서 서버로 get이나 post할때 파라미터를 받기위해 사용
const mysql = require('mysql'); //5-8 디비 관련
// var dbConfig = require('./dbconfig');//디비정보 임포트



var dbConfig = {
  host: 'localhost',
  port: 3000,
  user     : 'root',
  password : 'qwer1234',
  database : 'info'
}

//10번줄 이후로는 라우팅
module.exports = function (app) {
  app.use(session({ //11-16까지는 세션 사용하기 위한 초기설정
    secret: '!@#$%^&*', //비밀 설정 정보 관리하는 것 같은데 이거 찾아봐야 할듯
    store: new MySQLStore(dbConfig),//이게 뭐지 ->뭔지 알음 여기에 디비정보 넣는거였음 
    resave: false, //저장관련 설정같네
    saveUninitialized: false
  }));
var conn = mysql.createConnection(dbConfig);//
conn.connect(); //이게 연결하는 코드인가봄 
  app.use(bodyParser.json());       // to support JSON-encoded bodies 18-21 프론트에서 서버로 get,post시 데이터전달 하는 파라메터 값을 받기 위한 설정
  app.use(bodyParser.urlencoded({     // to support URL-encoded bodies 특히 18번은 json으로 넘긴 값을 읽기위한 내용 19는 한글 폰트를 읽기위한 설정 
    extended: true
  }));

  app.get('/', function (req, res) { //23-28 세션값이 있는지 없는지에 따라 로그인 뷰가 달라지도록 설정한 화면 
    if (!req.session.name)
      res.redirect('/login');
    else
      res.redirect('/welcome');
  });

  app.get('/login', function (req, res) { //30-35 로그인 프론트 홈에서 사용자가 로그인 버튼을 누르면 세션값에 다라 로그인 다만 더 업데이트 되어야됌
    if (!req.session.name)
      res.render('login', { message: 'input your id and password.' });
      // res.render('index.html', {message:'input your id and password.'}); //기존에 'login' 이라고하면 login.ejs를 호출한다는 의미
    else
      res.redirect('/welcome');
  });
  app.get('/about', function (req, res) {
    res.render('about.html', { message: 'input your id and password.' });
  });//+2
  app.get('/services', function (req, res) {
    res.render('services.html', { message: 'input your id and password.' });
  });//+2 
  app.get('/welcome', function (req, res) {
    if (!req.session.name)
      return res.redirect('/login');
    else
      res.render('welcome', { name: req.session.name });
  });

  app.get('/logout', function (req, res) { //44-48 로그인 했을때 사용자 화면에서 로그아웃을하면 세션값을 지우고 로그아웃 이후 화면 페이지 이동
    req.session.destroy(function (err) {
      res.redirect('/');
    });
  });

//   app.post('/login', function (req, res) { //50-110 정상적으로 만들어진 코드 //app.post인데 프론트에서 서버로 파라메타를 넘길때 post로 넘긴다는 뜻
//     let id = req.body.username; // 51-52 프론트에서 username,password 두개의 파라메타를 전달하고 서버는 이것을 받는다는 의미 
//     let password = req.body.password;

//     let salt = '';
//     let pw = '';
    
//     crypto.randomBytes(64, (err, buf) => { //57-81은 로그인시 사용자 pw를 암호화 시켜서 기존에 회원가입한 pw와 비교하는 부분 다만 회원가입부분은 이미 회원가입된 상태에서 로그인 부분 만들어져 있어서 비밀번호와 디비에 저장된 비번을 비교한느 코드
//       if (err) throw err;//57-65는  회원가입 부분에서 다루어야한다 따로이야기 해주신다함 
//       salt = buf.toString('hex');
//     });

//     crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
//       if (err) throw err;
//       pw = derivedKey.toString('hex');
//     });

//     var user = results[0];
//     crypto.pbkdf2(password, salt, 100000, 64, 'sha512', function (err, derivedKey) {//로그인엔 68-81만 있으면 된다
//       if (err)
//         console.log(err);
//       if (derivedKey.toString('hex') === pw) {
//         req.session.name = id;
//         req.session.save(function () {
//           return res.redirect('/welcome');
//         });
//       }
//       else {
//         return res.render('login', { message: 'please check your password.' });
//       }
//     });//pbkdf2
//   }); // end of app.post
// }
	

  app.post('/login', function (req, res) { //83-110 디비에 저장된 비밀번호를 읽어와서 사용자가 입력한 비밀번호화 비교하는 코드
  var id = req.body.name;
  var pw = req.body.password;
  var sql = 'SELECT * FROM user WHERE id=?'; //86번이 디비쪽에 가입된 것을 검색하는데 id로 검색합니다 
  conn.query(sql, [id], function (err, results) {
  var user = results[0];
  if (err)
  console.log(err);

  if (!results[0]) //id를 조회했을 때 검색 결과가 있다면 회원가입이 된 경우가 아니라면 회원가입이 안되었다고 판단하는 코드 
  return res.render('login', { message: 'please check your id.' });


  crypto.pbkdf2(pw, user.salt, 100000, 64, 'sha512', function (err, derivedKey) {
  if (err)
  console.log(err);
  if (derivedKey.toString('hex') === user.password) {
  req.session.name = user.name;
  req.session.save(function () {
  return res.redirect('/welcome');
  });
  }
  else {
  return res.render('login', { message: 'please check your password.' });
  }
  });//pbkdf2
  });//query
  });
}
// 디비없이 코드를 실행해보기위해 디비부분을 뺏고 회원가입도 없음