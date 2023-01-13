
function getQuestion() {
    let diff = $('#difficulty').val();
    let url = `/question?difficulty=${diff}`;
    $.get(url, (data) => {
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
    });
}

function checkAnswer() {
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
        setTimeout(getQuestion, 1000);
    });
}

$(document).ready(function () {
    getQuestion();
});




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

