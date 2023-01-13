const https = require('https');
const fs = require('fs');

var url = 'https://the-trivia-api.com/api/questions?limit=20';

const qmap = new Map(Object.entries(require('./qmap.json')));

function grab() {
https.get(url, (res) => {
	let rawData = '';
	res.on('data', (chunk) => { rawData += chunk; });
	res.on('end', () => {
		try {
			var qs = JSON.parse(rawData);
		} catch(e) {
			fs.writeFileSync("qmap.json", JSON.stringify(Object.fromEntries(qmap)));
		}
		qs.forEach(q => {
			qmap.set(q.id, q);
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
		fs.writeFileSync("qmap.json", JSON.stringify(Object.fromEntries(qmap)));
	}
	setTimeout(iter, 500);
}

iter();