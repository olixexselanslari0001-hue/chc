// CHC live subscriber counts via YouTube Data API. Vercel serverless function.
// Set env var YOUTUBE_API_KEY in Vercel project settings.
const CHANNELS = [
  {name:"ZND", url:'https://www.youtube.com/@zndshort', id:'UC6ijHqJ-0dJ7aESPtulcasA'},
  {name:"the same Wednesday", url:'https://www.youtube.com/@fake_ortega', id:'UCFclDHDKialIVdAB9hB4HMA'},
  {name:"Cheesymembey", url:'https://www.youtube.com/@cheesymembey', id:'UCAYeLUQj1BhFhbJzZqKROmg'},
  {name:"RealBacon", url:'https://www.youtube.com/@realbaccon', id:'UCa2Qn2vz3e3L6Oc-5i4BLiA'},
  {name:"DonFuria", url:'https://www.youtube.com/@donfuria', id:'UCsncvGgAFVzREn8YhulcoSg'},
  {name:"SkyFly Facts", url:'https://www.youtube.com/@skyflyfacts', id:'UCt11kUArF9FqdFZk3F5lkpw'},
  {name:"Plaza", url:'https://www.youtube.com/@plazamc', id:'UCtGAjYzxSSidTHY_YU6Evcg'},
  {name:"Tiger Now", url:'https://www.youtube.com/@tigernows', id:'UCjocqTE4gNsTxrO6eipKzUA'},
  {name:"Explorer Elizabeth", url:'https://www.youtube.com/@elizabethroblox', id:'UCNf_ep5OVtMCBul6-Pua8Xg'},
  {name:"RichGardner", url:'https://www.youtube.com/@torichblox', id:'UCMsk3-_YWbDHXNCLErOYidg'},
  {name:"Aixory", url:'https://www.youtube.com/@aixoryistaken', id:'UCh7cS06y8Lx3ZzwmHZokUGw'},
  {name:"DonFuria Minecraft 1", url:'https://www.youtube.com/@donfuriaminecraft1', id:'UCwlR5rwkUVtQQ9UPx2yTY_w'},
  {name:"Crewzi", url:'https://www.youtube.com/@crewzi', id:'UCYmf6pA09FXlwxfjOtmTBDQ'},
  {name:"ChickenMan", url:'https://www.youtube.com/@chickenmanrblx', id:'UChgI3A_mIGyVTYQwclT7vSA'},
  {name:"Jairai", url:'https://www.youtube.com/@jairaiyt', id:'UCLIbT5SqUk50iGijwJeZg2Q'},
  {name:"Xory Studios", url:'https://www.youtube.com/@xorystudios', id:'UCo0mDxXUcYE8Gd5uFzezosQ'},
  {name:"Stanky Boi", url:'https://www.youtube.com/@stankyboikins', id:'UC12LBE4ZcUHC3NbU8H5rQCA'},
  {name:"BabyBacon", url:'https://www.youtube.com/@babybaconyt', handle:'babybaconyt'},
];

function fmt(n){
  n = Number(n) || 0;
  const f = (v) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(/\.?0+$/, '');
  if (n >= 1e9) return f(n/1e9) + 'B';
  if (n >= 1e6) return f(n/1e6) + 'M';
  if (n >= 1e3) return f(n/1e3) + 'K';
  return String(n);
}
function build(item, c){
  const st = item.statistics || {}, sn = item.snippet || {};
  const n = Number(st.subscriberCount || 0);
  const th = sn.thumbnails || {};
  const avatar = ((th.high || th.medium || th.default || {}).url) || '';
  return { name: c.name, subs: fmt(n), url: c.url, avatar, _n: n };
}

module.exports = async (req, res) => {
  const KEY = process.env.YOUTUBE_API_KEY;
  try {
    if (!KEY) throw new Error('YOUTUBE_API_KEY not set');
    const base = 'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&key=' + KEY;
    const out = [];
    const withId = CHANNELS.filter(c => c.id);
    const idMap = Object.fromEntries(withId.map(c => [c.id, c]));
    const r = await fetch(base + '&id=' + withId.map(c => c.id).join(','));
    const j = await r.json();
    (j.items || []).forEach(it => { const c = idMap[it.id]; if (c) out.push(build(it, c)); });
    for (const c of CHANNELS.filter(c => !c.id)) {
      const rr = await fetch(base + '&forHandle=' + encodeURIComponent(c.handle));
      const jj = await rr.json();
      (jj.items || []).forEach(it => out.push(build(it, c)));
    }
    if (!out.length) throw new Error('no data from YouTube API');
    out.sort((a, b) => b._n - a._n);
    out.forEach(o => { delete o._n; });
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
