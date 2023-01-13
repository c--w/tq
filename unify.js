const fs = require('fs');

const questions = Array.from(new Map(Object.entries(require('./qmap2.json'))).values());

console.log("Original length", questions.length);

const unified = new Map();
const u_array = [];
questions.forEach(q => {
    //console.log(q.question)
    if(!unified.get(q.question)) {
        unified.set(q.question, q);
        let qn = {};
        qn.question = q.question;
        qn.category = q.category;
        qn.correct = q.correctAnswer || q.correct_answer;
        qn.incorrect = q.incorrectAnswers || q.incorrect_answers;
        qn.difficulty = q.difficulty;
        u_array.push(qn);
    }

})
console.log("Unified length", unified.size);
fs.writeFileSync("questions.json", JSON.stringify(u_array));
