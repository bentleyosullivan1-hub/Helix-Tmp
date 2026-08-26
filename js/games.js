const modal=document.getElementById('gameModal'),mount=document.getElementById('gameMount');
const grid=document.getElementById('gameGrid'),search=document.getElementById('gameSearch');
const filters=[...document.querySelectorAll('.filter')],gameCount=document.getElementById('gameCount');
const fullscreenGame=document.getElementById('fullscreenGame');
const artSymbols=['✦','◇','◉','8','△','✧'];
const titleOverrides={
	'1on1soccer':'1 on 1 Soccer','1on1tennis':'1 on 1 Tennis','2048cupcakes':'2048 Cupcakes',
	'agariolite':'Agario Lite','ageofwar':'Age of War','amongus':'Among Us','angrybirds':'Angry Birds',
	'angrybirdsshowdown':'Angry Birds Showdown','awesometanks':'Awesome Tanks','awesometanks2':'Awesome Tanks 2',
	'badicecream':'Bad Ice Cream','badicecream3':'Bad Ice Cream 3','badpiggies':'Bad Piggies',
	'basketballlegends':'Basketball Legends','basketrandom':'Basket Random','bitplanes':'Bit Planes',
	'bloonsTD':'Bloons TD','bloonsTD3':'Bloons TD 3','bloonsTD4':'Bloons TD 4','blumgiracers':'Blumgi Racers',
	'bobtherobber':'Bob the Robber','bobtherobber2':'Bob the Robber 2','bowmasters':'Bowmasters',
	'boxingrandom':'Boxing Random','bubbleshooter':'Bubble Shooter','candycrush':'Candy Crush',
	'cardrawing':'Car Drawing','carkingarena':'Car King Arena','choppyorc':'Choppy Orc','circloO2':'CircloO 2',
	'cleanupio':'Clean Up IO','clusterrush':'Cluster Rush','cookieclicker':'Cookie Clicker',
	'crazycrashlanding':'Crazy Crash Landing','crazymotorcycle':'Crazy Motorcycle','crossyroad':'Crossy Road',
	'deathrun3D':'Death Run 3D','demolitionderbycrashracing':'Demolition Derby Crash Racing','doodlejump':'Doodle Jump',
	'drawclimber':'Draw Climber','dreadheadparkour':'Dreadhead Parkour','drivemad':'Drive Mad',
	'ducklife2':'Duck Life 2','ducklife3':'Duck Life 3','ducklife5':'Duck Life 5','earntodie':'Earn to Die',
	'eggycar':'Eggy Car','elasticface':'Elastic Face','escapingtheprison':'Escaping the Prison',
	'evilglitch':'Evil Glitch','fireboyandwatergirl':'Fireboy and Watergirl','fireboyandwatergirl3':'Fireboy and Watergirl 3',
	'flappybird':'Flappy Bird','floodrunner2':'Flood Runner 2','floodrunner3':'Flood Runner 3','footballbros':'Football Bros',
	'footballlegends':'Football Legends','funnybattle':'Funny Battle','funnybattle2':'Funny Battle 2',
	'geometryvibes':'Geometry Vibes','getontop':'Get On Top','googlebaseball':'Google Baseball','googledino':'Google Dino',
	'granny2':'Granny 2','hanger2':'Hanger 2','helixjump':'Helix Jump','highwaytraffic':'Highway Traffic',
	'hillclimbracinglite':'Hill Climb Racing Lite','holeio':'Hole IO','hoverracerdrive':'Hover Racer Drive',
	'idlebreakout':'Idle Breakout','ironsnout':'Iron Snout','johnnytrigger':'Johnny Trigger','jumpingshell':'Jumping Shell',
	'kartbros':'Kart Bros','learntofly':'Learn to Fly','learntoflyidle':'Learn to Fly Idle','leveldevil':'Level Devil',
	'madalinstuntcars2':'Madalin Stunt Cars 2','mergeroundracers':'Merge Round Racers','mini_metro':'Mini Metro',
	'monkeymart':'Monkey Mart','monstertracks':'Monster Tracks','motox3m':'Moto X3M','motox3m2':'Moto X3M 2',
	'motox3m3':'Moto X3M 3','motox3mpoolparty':'Moto X3M Pool Party','motox3mwinter':'Moto X3M Winter',
	'oppositeday':'Opposite Day','pacman':'Pac-Man','papashotdoggeria':'Papa\'s Hot Doggeria','papaspizzeria':'Papa\'s Pizzeria',
	'papastacomia':'Papa\'s Taco Mia','paperio2':'Paper IO 2','parkingfury':'Parking Fury','parkingfury2':'Parking Fury 2',
	'parkingfury3':'Parking Fury 3','picosschool':'Pico\'s School','pingpongchaos':'Ping Pong Chaos',
	'pixelspeedrun':'Pixel Speedrun','poorbunny':'Poor Bunny','ragdollarchers':'Ragdoll Archers','redball4vol1':'Red Ball 4 Vol. 1',
	'retropingpong':'Retro Ping Pong','riddleschool':'Riddle School','rooftopsnipers':'Rooftop Snipers',
	'sandgame':'Sand Game','shortlife':'Short Life','slope2player':'Slope 2 Player','slowroads':'Slow Roads',
	'snowballio':'Snowball IO','snowrider':'Snow Rider','soccerbros':'Soccer Bros','soccerrandom':'Soccer Random',
	'spacebarclicker':'Space Bar Clicker','spaceiskey':'Space Is Key','spaceiskey2':'Space Is Key 2','spacewaves':'Space Waves',
	'stacktris':'Stacktris','stateio':'State IO','stickarchersbattle':'Stick Archers Battle','stickmanhook':'Stickman Hook',
	'stickmerge':'Stick Merge','superbikethechampion':'Super Bike the Champion','tabletennisworldtour':'Table Tennis World Tour',
	'templeofboom':'Temple of Boom','templerun2':'Temple Run 2','territorialio':'Territorial IO','theimpossiblequiz':'The Impossible Quiz',
	'thereisnog':'There Is No Game','theyarecoming':'They Are Coming','thisistheonlylevel':'This Is the Only Level',
	'thisistheonlyleveltoo':'This Is the Only Level Too','timeshooter2':'Time Shooter 2','timeshooter3':'Time Shooter 3',
	'tinyfishing':'Tiny Fishing','trapthecat':'Trap the Cat','triviacrack':'Trivia Crack','tubejumpers':'Tube Jumpers',
	'tunnelrush':'Tunnel Rush','unicyclehero':'Unicycle Hero','volleyrandom':'Volley Random',
	'webecomewhatwebehold':'We Become What We Behold','wheeliebike':'Wheelie Bike','wordleunlimited':'Wordle Unlimited',
	'worldshardestgame':'World\'s Hardest Game','worldshardestgame3':'World\'s Hardest Game 3','zombierush':'Zombie Rush'
};

function formatTitle(title){
	if(titleOverrides[title]) return titleOverrides[title];
	return title.replace(/_/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/([A-Za-z])(\d)/g,'$1 $2').replace(/(\d)([A-Za-z])/g,'$1 $2').replace(/\s+/g,' ').trim().replace(/\b\w/g,letter=>letter.toUpperCase());
}

function categoryFor(title){
	const name=title.toLowerCase();
	if(/puzzle|2048|chess|minesweeper|sudoku|blox|crush|sokoban/.test(name)) return 'puzzle';
	if(/demo|simulator|lab|indev|beta|alpha/.test(name)) return 'demo';
	return 'arcade';
}

function makeCard(game,index){
	const title=game.title,category=categoryFor(title),card=document.createElement('article');
	card.className='game-card';
	card.dataset.tags=category;
	card.innerHTML=`<div class="game-art art${index%6+1}"><span>${artSymbols[index%artSymbols.length]}</span></div>
		<div class="game-info"><div class="game-meta"><small>${category.toUpperCase()} / ${String(index+1).padStart(3,'0')}</small><span class="category-tag">${category}</span></div>
		<h3></h3><p>Launch ${title} in the Helix arcade.</p>
		<button class="btn primary launchGame" type="button">LAUNCH →</button></div>`;
	card.querySelector('h3').textContent=title;
	card.querySelector('.launchGame').dataset.file=game.file;
	return card;
}

function filterGames(){
	const query=(search.value||'').toLowerCase(),active=document.querySelector('.filter.active').dataset.filter;
	grid.querySelectorAll('.game-card').forEach(card=>{
		card.style.display=(!query||card.innerText.toLowerCase().includes(query))&&(active==='all'||card.dataset.tags===active)?'':'none';
	});
}

async function loadGames(){
	try{
		const response=await fetch('games/list.json');
		if(!response.ok) throw new Error(`Manifest request failed: ${response.status}`);
		const manifest=await response.json();
		const games=manifest.map(game=>({...game,title:formatTitle(game.title)}));
		grid.replaceChildren(...games.map(makeCard));
		gameCount.textContent=String(games.length).padStart(2,'0');
		filterGames();
	}catch(error){
		grid.innerHTML='<p class="game-loading">Unable to load the arcade manifest. Serve this site over HTTP to load games.</p>';
		console.error(error);
	}
}

grid.addEventListener('click',event=>{
	const button=event.target.closest('.launchGame');
	if(!button) return;
	mount.innerHTML=`<iframe title="${button.closest('.game-card').querySelector('h3').textContent}" allowfullscreen sandbox="allow-scripts allow-forms allow-pointer-lock" src="games/${encodeURIComponent(button.dataset.file)}"></iframe>`;
	modal.classList.add('show');
});
fullscreenGame.onclick=async()=>{
	const iframe=mount.querySelector('iframe');
	if(!iframe) return;
	try{
		if(document.fullscreenElement) await document.exitFullscreen();
		else await iframe.requestFullscreen();
	}catch(error){
		console.error('Fullscreen unavailable',error);
	}
};
document.getElementById('closeGame').onclick=()=>modal.classList.remove('show');
modal.onclick=event=>{if(event.target===modal) modal.classList.remove('show')};
search.oninput=filterGames;
filters.forEach(button=>button.onclick=()=>{filters.forEach(item=>item.classList.remove('active'));button.classList.add('active');filterGames()});
loadGames();