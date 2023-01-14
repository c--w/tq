const default_question = {
    "question": "Question",
    "category": "",
    "difficulty": "",
    "answers": [
        "Answer 1",
        "Answer 2",
        "Answer 3",
        "Answer 4"
    ]
}

const uid = getCookie("uid") || create_UUID();
setCookie("uid", uid, 730);
var nickname = getCookie("nickname") || "Player" + Math.floor(Math.random() * 100);
setCookie("nickname", nickname, 730);
var gamemode = Number(getCookie("gamemode") || 0);
setCookie("gamemode", gamemode, 730);
var difficulty = getCookie("difficulty") || 'mixed';
setCookie("difficulty", difficulty, 730);
var num_questions = Number(getCookie("num_questions") || 20);
setCookie("num_questions", num_questions, 730);

var started = 0;
var round = 0;
var room;
var user;

function init() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        $("body").toggleClass("nightmode");
    }
    $('#nickname').val(nickname);
    $('#gamemode').val(gamemode);
    $('#difficulty').val(difficulty);
    $('#num_questions').val(num_questions);
    $('#gamemode').on('change', changeGamemode);
    $('#difficulty').on('change', changeDifficulty);
    $('#num_questions').on('change', changeNumQuestion);
    if (nickname == 'Player') {
        $('#nickname-div').show();
    }
    fillQuestion(default_question);
    changeGamemode();
}

function changeGamemode() {
    gamemode = Number($('#gamemode').val());
    setCookie("gamemode", gamemode, 730);
    if (gamemode < 10) {
        getQuestion();
        $('.multiplayer').hide();
        leaveRoom()
    } else {
        fillQuestion(default_question);
        $('.multiplayer').show();
        enterRoom();
    }
}
function changeDifficulty() {
    difficulty = $('#difficulty').val();
    if (gamemode < 10) {
        setCookie("difficulty", difficulty, 730);
        getQuestion();
    } else {
        leaveRoom()
        setCookie("difficulty", difficulty, 730);
        enterRoom();
    }
}
function changeNumQuestion() {
    num_questions = Number($('#num_questions').val());
    if (gamemode < 10) {
        setCookie("num_questions", num_questions, 730);
        getQuestion();
    } else {
        leaveRoom()
        setCookie("num_questions", num_questions, 730);
        enterRoom();
    }

}

function startRoom() {
    $.post("/start-room").done(function (data) { });
    monitorRoom();
}

function enterRoom() {
    $.post("/enter-room").done(function (data) { });
    monitorRoom();
}
function leaveRoom() {
    $.post("/leave-room").done(function (data) { });
}

function monitorRoom() {
    $.get("/room", processRoom);
    if (gamemode >= 10)
        setTimeout(monitorRoom, 1000);
}
function getQuestion() {
    $.get("/question", fillQuestion);
}

function processRoom(room) {
    fillRoomInfo(room);
    if (started != room.started) {
        if (room.started) {
            updateStatus("Game started");
            $('#start').hide();
            round = 0;
            getQuestion();
        } else {
            updateStatus("Game finished");
            $('#start').show();
        }
    }
    started = room.started;
}

function fillRoomInfo(room) {
    let users = Array.from(room.users);
    let me = users.find(u => u.uid = uid);
    if (room.started) {
        let remaining = Math.floor((room.game_duration - Date.now() + room.start_time) / 1000);
        $('#time-left').text(remaining);
        $('#round').text((me.round + 1) + '/' + num_questions);
    } else {
        $('#time-left').text(0);
        $('#round').text(0 + '/' + num_questions);
    }
    fillUsers(users);
}

function fillUsers(users) {
    $('#players-info').empty();
    users.sort((a,b) => b.points - a.points);

    let t = $("<table>");
    $('#players-info').append(t);
    users.forEach(user => {
        let tr = $("<tr>");
        t.append(tr);
        if (user.uid == uid) {
          tr.append($("<td><strong>" + user.nickname + "</strong></td>"));
        } else {
          tr.append($("<td>" + user.nickname + "</td>"));
        }
        tr.append($("<td>" + user.round + "/" + num_questions + "</td>"));
        tr.append($("<td>" + user.points + "</td>"));
    }) 
}

function fillQuestion(data) {
    $('#question').text(data.question);
    $('#category i').text(data.category);
    $('#current-diff i').text(data.difficulty);
    $('#answers li').remove();
    data.answers.forEach((a, i) => {
        let li = $('<li class="answer">');
        li.text(a);
        $('#answers').append(li);
    })
    $('.answer').on('click', checkAnswer);
}

function checkAnswer() {
    if(gamemode>=10 && round>=num_questions) {
        updateStatus("You finished this game");
        return;
    }
    let el = $(this);
    let a = el.text();
    el.css('background-color', 'var(--color-tone-3)');
    let url = `/check-answer?answer=${a}`;
    $.get(url, (data) => {
        if (a == data.answer) {
            updateStatus('Correct!', 1000)
            el.css('background-color', 'var(--color-success)');
        } else {
            updateStatus('Wrong.<br>Correct answer was: ' + data.answer, 2000);
            el.css('background-color', 'var(--color-failure)');
        }
        if(gamemode<10)
            setTimeout(getQuestion, 1000);
        else {
            round++;
            if(round<num_questions)
                getQuestion();
        }
    });
}

$(document).ready(function () {
    init();
});


function setNickname() {
    nickname = $("#nickname").val();
    setCookie("nickname", nickname, 730);
    $("#nickname-div").hide();
    $.post("/setnick").done(function (data) { });
}



var g_status_timeout;
function updateStatus(text, timeout) {
    $("status").show();
    if (text == "") {
        $("#status").empty();
        /*
        $("#status div").fadeTo(800, 0);
        setTimeout(function () {
          $("#status").empty();
          g_status_timeout = null;
        }, 800);
        */
    } else {
        console.log("updateStatus", text);
        if (text && typeof text === "object") text = JSON.stringify(text);
        var div = $(
            '<div class="alert" style="opacity:0; margin: 2px; position: relative; padding: 12px 12px 12px 30px">'
        );
        div.on("click", function () {
            this.remove();
        });
        $("#status").append(div);
        var div2 = $('<div style="border-left: 1px solid; padding-left: 10px;">');
        div.append(div2);
        div2.html(text);
        div.fadeTo(200, 1);
        if (timeout) {
            var icon_elem = $(
                '<i class="bi bi-info-square-fill" style="position: absolute; top: 50%; left: 6px; transform: translateY(-50%);"></i>'
            );
            div.append(icon_elem);
            div.addClass("alert-success");
            setTimeout(
                function (div) {
                    div.fadeTo(800, 0);
                    setTimeout(
                        function (div) {
                            div.remove();
                        },
                        800,
                        div
                    );
                },
                timeout,
                div
            );
        } else {
            var icon_elem = $(
                '<i class="bi bi-exclamation-octagon-fill" style="position: absolute; top: 50%; left: 6px; transform: translateY(-50%);"></i>'
            );
            div.append(icon_elem);
            div.addClass("alert-warning");
        }
    }
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function create_UUID() {
    var dt = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
        c
    ) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
    return uuid;
}

function convertTimeToString(time_ms) {
    let readable_time;
    let seconds = Math.floor(time_ms / 1000);
    readable_time = "" + (seconds % 60) + "s";
    var minutes = Math.floor(seconds / 60);
    if (minutes) readable_time = (minutes % 60) + "m " + readable_time;
    var hours = Math.floor(minutes / 60);
    if (hours) readable_time = hours + "h " + readable_time;
    return readable_time;
}
