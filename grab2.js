const https = require('https');
const fs = require('fs');

var url = 'https://opentdb.com/api.php?amount=50';

const qmap = new Map(Object.entries(require('./qmap.json')));

function grab() {
https.get(url, (res) => {
	let rawData = '';
	res.on('data', (chunk) => { rawData += chunk; });
	res.on('end', () => {
		try {
			var qs = JSON.parse(rawData);
		} catch(e) {
			fs.writeFileSync("qmap2.json", JSON.stringify(Object.fromEntries(qmap)));
		}
		qs.results.forEach(q => {
			qmap.set(q.question, q);
		})
	});
});
}
var i = 0;
function iter() {
	i++;
	grab();
	if(i%10 == 0) {
		console.log("Save: ", qmap.size);
		fs.writeFileSync("qmap2.json", JSON.stringify(Object.fromEntries(qmap)));
	}
	setTimeout(iter, 500);
}

iter();