process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
    console.log(err.stack);
});
const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const TPQ = 10;

const questions = require("./questions.json");

const port = process.env.PORT || 8080;
var sessions = {};
var rooms = {};

function initServer() {
    app.use('/', express.static(path.join(__dirname, "public")));
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.use(
        bodyParser.urlencoded({
            extended: true
        })
    );
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.get('/', renderIndex);
    app.get('/question', getQuestion);
    app.get('/check-answer', checkAnswer);
    app.post('/enter-room', enterRoom);
    app.post('/leave-room', leaveRoom);
    app.post('/start-room', startRoom);
    app.get('/room', roomInfo);
    app.post('/setnick', setNick);

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
    let gamemode = req.cookies.gamemode || 0;
    let difficulty = req.cookies.difficulty || 'mixed';
    let q;
    if (gamemode < 10) {
        q = getRandomQuestion(difficulty);
        user.current_question = q;
    } else {
        let room = getRoom(req);
        q = room.questions[user.round];
    }
    sendResponse(convertQuestion(q), res);
}

function convertQuestion(q) {
    let rq = { ...q };
    rq.answers = [...q.incorrect];
    rq.answers.push(q.correct);
    rq.answers.sort(() => Math.random() - 0.5);
    delete rq.correct;
    delete rq.incorrect;
    console.log(JSON.stringify(q));
    return rq;
}

function setNick(req, res) {
    let user = getUser(req);
    user.nickname = req.body.nickname;
    console.log('Set nickname:', user.nickname, req.cookies)
    sendResponse({}, res);
}
function roomInfo(req, res) {
    let user = getUser(req);
    let room = getRoom(req);
    let room_clone = { ...room };
    room_clone.users = Array.from(room.users);
    sendResponse(room_clone, res);
}

function enterRoom(req, res) {
    let user = getUser(req);
    let room = getRoom(req);
    if (!room.users.has(user)) {
        user.points = 0;
        user.round = 0;
        room.users.add(user);
    }
    sendResponse({}, res);
}
function leaveRoom(req, res) {
    let user = getUser(req);
    let room = getRoom(req);
    if (room.users.has(user)) {
        room.users.delete(user);
        console.log('User left room: ', user.nickname);
    }
    sendResponse({}, res);
}

function startRoom(req, res) {
    let user = getUser(req);
    let room = getRoom(req);
    initRoom(room);
    room.started = 1;
    room.start_time = Date.now();
    console.log('Game started in room: ', room.id);
    setTimeout((room) => { room.started = 0 }, room.game_duration, room);
    sendResponse({}, res);
}

function checkAnswer(req, res) {
    let user = getUser(req);
    let gamemode = req.cookies.gamemode || 0;
    let a = req.query.answer;
    let correct;
    if (gamemode < 10) {
        correct = user.current_question.correct;
    } else {
        let room = getRoom(req);
        correct = room.questions[user.round].correct;
        if (a == correct) {
            user.points += getPoints(room);
        }
        user.round++;
    }
    console.log("Answer: ", a == correct);

    sendResponse({ 'answer': correct }, res);
}

function getPoints(room) {
    // TODO
    return 10;
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
    let uid = req.cookies.uid;
    if (!sessions[uid]) {
        console.log("New user:", uid);
        sessions[uid] = {};
        sessions[uid].uid = uid;
        console.log("Sessions:", Object.keys(sessions).length);
        sessions[uid].nickname = 'Player';
    }
    sessions[uid].time = Date.now();
    return sessions[uid];
}

function checkRoomUsers(room) {
    Array.from(room.users).forEach(u => {
        if (Date.now() - u.time > 1000 * 30) {
            room.users.delete(u);
            console.log('User kicked', u.nickname);
        }
    })
    setTimeout(checkRoomUsers, 10000, room);
}

function sendResponse(obj, res) {
    res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8"
    });
    res.write(JSON.stringify(obj));
    res.end();
}

function getRoom(req) {
    let gamemode = req.cookies.gamemode || 10;
    let difficulty = req.cookies.difficulty || 'mixed';
    let num_questions = req.cookies.num_questions || 20;
    var room_id = `gm:${gamemode} diff:${difficulty} num:${num_questions}`;
    let room = rooms[room_id];
    if (!room) {
        console.log('Create room: ', room_id);
        room = {};
        room.id = room_id;
        room.gamemode = gamemode;
        room.difficulty = difficulty;
        room.num_questions = num_questions;
        room.users = new Set();
        initRoom(room);
        rooms[room_id] = room;
        checkRoomUsers(room);
    }
    return room;
}

function initRoom(room) {
    room.questions = new Array(room.num_questions);
    for (let i = 0; i < room.num_questions; i++) {
        room.questions[i] = getRandomQuestion(room.difficulty);
    }
    room.users.forEach(u => {
        u.points = 0;
        u.round = 0
    });
    room.start_time = 0;
    room.started = 0;
    room.game_duration = room.num_questions * TPQ * 1000;
}


initServer();


