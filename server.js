process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
    console.log(err.stack);
});
const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const questions = require("./questions.json");

const port = process.env.PORT || 8080;
var sessions = {};

function initServer() {
    const app = express();
    app.use('/', express.static(path.join(__dirname, "public")));
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.get('/', renderIndex);
    app.get('/question', getQuestion);
    app.get('/check-answer', checkAnswer);

    let server = http.createServer(app);
    server.listen(port);
    console.log(`app listening on port ${port}!`);
    console.log('Questions:', questions.length);
}

function renderIndex(req, res) {
    res.render('index');
}

function getQuestion(req, res) {
    let user = getUser(req);
    let gamemode = req.query.gamemode || 0;
    let difficulty = req.query.difficulty || 'mixed';
    let q = getRandomQuestion(difficulty);
    user.current_question = q;
    let rq = {...q};
    rq.answers = [...q.incorrect];
    rq.answers.push(q.correct);
    rq.answers.sort(() => Math.random() - 0.5);
    delete rq.correct;
    delete rq.incorrect;
    console.log(JSON.stringify(q));
    sendResponse(rq, res);
}

function checkAnswer(req, res) {
    let user = getUser(req);
    let gamemode = req.query.gamemode || 0;
    let a = req.query.answer;
    if(a != user.current_question.correct) {
    } else {
    }
    sendResponse({'answer': user.current_question.correct}, res);
}

function getRandomQuestion(d) {
    let qa = questions;
    if (d != 'mixed')
        qa = questions.filter(q => q.difficulty == d);
    return randomElem(qa);
}

function randomElem(a) {
    return a[Math.floor(Math.random() * a.length)];
}

function getUser(req) {
    let uid = req.cookies.uid || req.query.uid || req.body.uid;
    if (!sessions[uid]) {
        console.log("New user:", uid);
        sessions[uid] = { nickname: 'Player1' };
        sessions[uid].uid = uid;
        console.log("Sessions:", Object.keys(sessions).length);
    }
    sessions[uid].time = Date.now();
    return sessions[uid];
}

function sendResponse(obj, res) {
    res.writeHead(200, {
        "Content-Type": "application/json"
    });
    res.write(JSON.stringify(obj));
    res.end();
}

initServer();


