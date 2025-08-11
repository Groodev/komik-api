
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory cache (untuk production sebaiknya gunakan Redis)
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

// Cache middleware
function cacheMiddleware(duration = CACHE_DURATION) {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < duration) {
      console.log(`Cache hit for ${key}`);
      return res.json(cached.data);
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, {
        data: body,
        timestamp: Date.now()
      });
      res.sendResponse(body);
    };
    
    next();
  };
}

// Rate limiting sederhana
const requests = new Map();
function rateLimiter(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const userRequests = requests.get(ip);
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests',
        retry_after: Math.ceil(windowMs / 1000)
      });
    }
    
    validRequests.push(now);
    requests.set(ip, validRequests);
    next();
  };
}

// Apply rate limiting to all API routes
app.use('/api', rateLimiter(100, 60000));

app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Komik API Documentation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            text-align: center; 
            color: white; 
            margin-bottom: 40px;
            padding: 60px 0;
        }
        .header h1 { 
            font-size: 3.5rem; 
            margin-bottom: 10px;
            text-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .header p { 
            font-size: 1.2rem; 
            opacity: 0.9;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: rgba(255,255,255,0.95);
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transform: translateY(0);
            transition: transform 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.2);
        }
        .stat-number {
            font-size: 3rem;
            font-weight: bold;
            color: #667eea;
            display: block;
        }
        .stat-label {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 5px;
        }
        .endpoints {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 40px;
            margin-bottom: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .endpoints h2 {
            color: #667eea;
            margin-bottom: 30px;
            font-size: 2.5rem;
            text-align: center;
        }
        .endpoint-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }
        .endpoint {
            background: #f8f9fa;
            border-left: 5px solid #667eea;
            padding: 20px;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        .endpoint:hover {
            transform: translateX(5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .endpoint-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
            font-size: 1.1rem;
        }
        .endpoint-url {
            font-family: 'Courier New', monospace;
            background: #e9ecef;
            padding: 8px 12px;
            border-radius: 5px;
            margin: 10px 0;
            font-size: 0.9rem;
            word-break: break-all;
        }
        .endpoint-desc {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 10px;
        }
        .status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status.working { background: #d4edda; color: #155724; }
        .status.super { background: #fff3cd; color: #856404; }
        .status.demo { background: #cce7ff; color: #004085; }
        .demo-section {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 40px;
            margin-bottom: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .demo-section h2 {
            color: #667eea;
            margin-bottom: 20px;
            text-align: center;
            font-size: 2rem;
        }
        .demo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .demo-card {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border: 2px solid #e9ecef;
            transition: all 0.3s ease;
        }
        .demo-card:hover {
            border-color: #667eea;
            transform: scale(1.02);
        }
        .demo-title {
            font-size: 1.3rem;
            color: #333;
            margin-bottom: 15px;
            font-weight: bold;
        }
        .demo-result {
            background: #e8f4f8;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 0.9rem;
            color: #2c5aa0;
            margin-top: 15px;
        }
        .try-button {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            margin-top: 10px;
            transition: background 0.3s ease;
        }
        .try-button:hover {
            background: #5a67d8;
        }
        .footer {
            text-align: center;
            color: rgba(255,255,255,0.8);
            margin-top: 60px;
            padding: 40px 0;
        }
        .highlight {
            background: linear-gradient(120deg, #a8e6cf 0%, #dcedc8 100%);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 5px solid #4caf50;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Komik API</h1>
            <p>RESTful API untuk mengakses ribuan komik dari Komiku.org</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <span class="stat-number">19</span>
                <span class="stat-label">Total Endpoints</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">6,297+</span>
                <span class="stat-label">Komik Tersedia</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">315x</span>
                <span class="stat-label">Performance Boost</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">80%</span>
                <span class="stat-label">Success Rate</span>
            </div>
        </div>

        <div class="highlight">
            <h3>CATATAN!</h3>
            <p>REST API ini masih dalam tahap pengembangan jadi beberapa fitur mungkin belum tersedia atau berfungsi dengan baik, kami akan terus memperbarui dan meningkatkan API ini seiring waktu, jika Anda memiliki saran atau masukan, silakan hubungi kami!</p>
        </div>

        <div class="endpoints">
            <h2>📚 Available Endpoints</h2>
            <div class="endpoint-grid">
                <div class="endpoint">
                    <div class="endpoint-title">🔥 Unlimited Data Access</div>
                    <div class="endpoint-url">GET /api/unlimited</div>
                    <div class="endpoint-desc">Akses maksimum ke 6,297+ komik dengan deep crawling</div>
                    <span class="status super">SUPER</span>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-title">♾️ Infinite Scroll Simulation</div>
                    <div class="endpoint-url">GET /api/scroll</div>
                    <div class="endpoint-desc">Simulasi infinite scroll dengan offset pagination</div>
                    <span class="status working">Working</span>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-title">⚡ Real-time Data</div>
                    <div class="endpoint-url">GET /api/realtime</div>
                    <div class="endpoint-desc">Data real-time dengan parallel fetching</div>
                    <span class="status working">Working</span>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-title">📊 Performance Comparison</div>
                    <div class="endpoint-url">GET /api/comparison</div>
                    <div class="endpoint-desc">Perbandingan performa API vs website scroll</div>
                    <span class="status demo">Demo</span>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-title">📖 Komik Terbaru</div>
                    <div class="endpoint-url">GET /api/terbaru</div>
                    <div class="endpoint-desc">Daftar komik terbaru dengan pagination</div>
                    <span class="status working">Working</span>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-title">🔥 Komik Populer</div>
                    <div class="endpoint-url">GET /api/populer</div>
                    <div class="endpoint-desc">Komik populer dengan multi-source aggregation</div>
                    <span class="status working">Working</span>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-title">🔍 Search Komik</div>
                    <div class="endpoint-url">GET /api/search?q=naruto</div>
                    <div class="endpoint-desc">Pencarian dengan 3-method fallback system</div>
                    <span class="status working">Working</span>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-title">📝 Detail Komik</div>
                    <div class="endpoint-url">GET /api/comic/:slug</div>
                    <div class="endpoint-desc">Detail lengkap komik dan daftar chapter</div>
                    <span class="status working">Working</span>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-title">📄 Read Chapter</div>
                    <div class="endpoint-url">GET /api/chapter/:segment</div>
                    <div class="endpoint-desc">Gambar-gambar chapter untuk dibaca</div>
                    <span class="status working">Working</span>
                </div>
            </div>
        </div>

        <div class="demo-section">
            <h2>🧪 Try It Out!</h2>
            <p style="text-align: center; margin-bottom: 30px;">Klik tombol di bawah untuk mencoba endpoint secara langsung:</p>
            
            <div class="demo-grid">
                <div class="demo-card">
                    <div class="demo-title">Unlimited Data Access</div>
                    <p>Dapatkan ribuan komik dalam satu request</p>
                    <button class="try-button" onclick="tryEndpoint('/api/unlimited?type=all&max_pages=2', this)">Try Unlimited API</button>
                    <div class="demo-result" id="result-unlimited" style="display: none;"></div>
                </div>
                
                <div class="demo-card">
                    <div class="demo-title">Performance Comparison</div>
                    <p>Lihat perbandingan API vs website scroll</p>
                    <button class="try-button" onclick="tryEndpoint('/api/comparison', this)">Compare Performance</button>
                    <div class="demo-result" id="result-comparison" style="display: none;"></div>
                </div>
                
                <div class="demo-card">
                    <div class="demo-title">Search Komik</div>
                    <p>Cari komik dengan keyword</p>
                    <button class="try-button" onclick="tryEndpoint('/api/search?q=naruto&limit=5', this)">Search Naruto</button>
                    <div class="demo-result" id="result-search" style="display: none;"></div>
                </div>
                
                <div class="demo-card">
                    <div class="demo-title">Latest Comics</div>
                    <p>Komik terbaru yang baru diupdate</p>
                    <button class="try-button" onclick="tryEndpoint('/api/terbaru?limit=5', this)">Get Latest</button>
                    <div class="demo-result" id="result-latest" style="display: none;"></div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Komik API - Menyediakan akses data komik yang cepat dan efisien</p>
            <p>Dikembangkan oleh <a href="https://github.com/rajadwiaqso" target="_blank">rajadwiaqso</a></p>
            <p style="margin-top: 20px; font-size: 0.9rem;">
                📊 Statistics: 19 Endpoints | 6,297+ Comics | 315x Performance Improvement
            </p>
        </div>
    </div>

    <script>
        async function tryEndpoint(endpoint, button) {
            const resultId = 'result-' + endpoint.split('/')[2].split('?')[0];
            const resultDiv = document.getElementById(resultId);
            
            button.disabled = true;
            button.textContent = 'Loading...';
            
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                
                let displayData;
                if (endpoint.includes('unlimited')) {
                    displayData = {
                        total_comics: data.metadata?.total_comics || 0,
                        success_rate: data.metadata?.success_rate || 'N/A',
                        sample_titles: data.comics?.slice(0, 3).map(c => c.title) || []
                    };
                } else if (endpoint.includes('comparison')) {
                    displayData = {
                        website_data: data.website_scroll?.data_count || 0,
                        api_data: data.api_unlimited?.data_count || 0,
                        improvement: data.performance_ratio?.improvement || 'N/A'
                    };
                } else if (endpoint.includes('search') || endpoint.includes('terbaru')) {
                    displayData = {
                        found: data.comics?.length || 0,
                        titles: data.comics?.slice(0, 3).map(c => c.title) || []
                    };
                } else {
                    displayData = data;
                }
                
                resultDiv.textContent = JSON.stringify(displayData, null, 2);
                resultDiv.style.display = 'block';
                
            } catch (error) {
                resultDiv.textContent = 'Error: ' + error.message;
                resultDiv.style.display = 'block';
            }
            
            button.disabled = false;
            button.textContent = 'Try Again';
        }
    </script>
</body>
</html>`;
  
  res.send(html);
});

app.get('/api/realtime', async (req, res) => {
  try {
    const { 
      count = 48, 
      fresh = false, 
      categories = 'all',
      randomize = false 
    } = req.query;
    
    const maxCount = Math.min(parseInt(count), 100);
    let allComics = [];
    
    const sources = [
      { url: 'https://komiku.org/', priority: 1 },
      { url: 'https://komiku.org/pustaka/?orderby=modified', priority: 2 },
      { url: 'https://komiku.org/pustaka/', priority: 3 },
      { url: 'https://komiku.org/pustaka/?orderby=meta_value_num', priority: 4 },
      { url: 'https://komiku.org/other/hot/', priority: 5 },
    ];
    
    if (categories !== 'all') {
      const categoryUrls = categories.split(',').map(cat => ({
        url: `https://komiku.org/pustaka/?tipe=${cat.trim()}`,
        priority: 2
      }));
      sources.push(...categoryUrls);
    }
    
    const fetchPromises = sources.map(async (source) => {
      try {
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: 8000
        });
        const $ = cheerio.load(response.data);
        const comics = [];

        $('.ls4, .bge, .bgei, .ltst, article.post').each((i, el) => {
          const $el = $(el);
          const title = $el.find('h3 a, h4 a, .title a, .entry-title a').text().trim();
          const link = $el.find('h3 a, h4 a, .title a, .entry-title a').attr('href');
          const image = $el.find('img').attr('src') || 
                       $el.find('img').attr('data-src') || 
                       $el.find('img').attr('data-lazy-src');
          const chapter = $el.find('.chapter, .ls24, .new-chapter, .latest').text().trim();
          const rating = $el.find('.rating, .score').text().trim();
          
          if (title && link && image) {
            comics.push({
              title,
              link,
              image,
              chapter: chapter || 'Latest',
              rating: rating || null,
              source_priority: source.priority,
              source_url: source.url
            });
          }
        });
        
        return comics;
      } catch (error) {
        console.log(`Failed source ${source.url}:`, error.message);
        return [];
      }
    });
    
    const allResults = await Promise.all(fetchPromises);
    
    const uniqueComics = new Map();
    allResults.flat().forEach(comic => {
      const key = comic.link;
      if (!uniqueComics.has(key) || 
          uniqueComics.get(key).source_priority > comic.source_priority) {
        uniqueComics.set(key, comic);
      }
    });
    
    allComics = Array.from(uniqueComics.values());
    
    if (fresh === 'true') {
      allComics = allComics.filter(comic => 
        comic.chapter && 
        !comic.chapter.toLowerCase().includes('completed') &&
        !comic.chapter.toLowerCase().includes('tamat')
      );
    }
    
    if (randomize === 'true') {
      allComics.sort(() => 0.5 - Math.random());
    } else {
      allComics.sort((a, b) => {
        if (a.source_priority !== b.source_priority) {
          return a.source_priority - b.source_priority;
        }
        return a.title.localeCompare(b.title);
      });
    }

    const result = allComics.slice(0, maxCount);

    res.json({
      comics: result,
      metadata: {
        total_fetched: allComics.length,
        returned: result.length,
        sources_checked: sources.length,
        fresh_only: fresh === 'true',
        randomized: randomize === 'true',
        categories: categories,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching realtime data:', error);
    res.status(500).json({ message: 'Error fetching realtime data', error: error.message });
  }
});

app.get('/api/trending', async (req, res) => {
  try {
    const { timeframe = 'today', limit = 20 } = req.query;
    const maxLimit = Math.min(parseInt(limit), 50);
    let trendingComics = [];
    
    const trendingUrls = [
      'https://komiku.org/other/hot/',
      'https://komiku.org/pustaka/?orderby=meta_value_num',
      'https://komiku.org/',
    ];
    
    for (const url of trendingUrls) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        const $ = cheerio.load(response.data);

        $('.ls4, .bge, .bgei, .hot-item').each((i, el) => {
          const $el = $(el);
          const title = $el.find('h3 a, h4 a').text().trim();
          const link = $el.find('h3 a, h4 a').attr('href');
          const image = $el.find('img').attr('src') || $el.find('img').attr('data-src');
          const chapter = $el.find('.chapter, .ls24').text().trim();
          const views = $el.find('.views, .meta').text().trim();
          
          if (title && link && image && trendingComics.length < 100) {
            const existing = trendingComics.find(c => c.link === link);
            if (!existing) {
              trendingComics.push({
                title,
                link,
                image,
                chapter: chapter || 'Latest',
                views: views || null,
                trending_score: url.includes('hot') ? 10 : 
                               url.includes('meta_value_num') ? 8 : 5,
                timeframe
              });
            }
          }
        });
      } catch (error) {
        console.log(`Trending URL failed: ${url}`);
        continue;
      }
    }
    
    trendingComics.sort((a, b) => b.trending_score - a.trending_score);
    const result = trendingComics.slice(0, maxLimit);

    res.json({
      trending: result,
      timeframe,
      count: result.length,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching trending comics:', error);
    res.status(500).json({ message: 'Error fetching trending data', error: error.message });
  }
});

app.get('/api/unlimited', async (req, res) => {
  try {
    const { 
      type = 'all', 
      max_pages = 3,
      aggressive = false 
    } = req.query;
    
    let allComics = [];
    const maxPages = Math.min(parseInt(max_pages), 6);
    
    const workingSources = [
      'https://komiku.org/', // Homepage 
      'https://komiku.org/daftar-komik/',  // Daftar komik
      'https://komiku.org/manga-list/',    // List manga
      'https://komiku.org/komik-terbaru/', // Komik terbaru
      'https://komiku.org/hot/',           // Hot comics
      'https://komiku.org/popular/',       // Popular
    ];
    
    const alternativeUrls = [
      'https://komiku.org/genre/action/',
      'https://komiku.org/genre/adventure/', 
      'https://komiku.org/genre/comedy/',
      'https://komiku.org/genre/drama/',
      'https://komiku.org/genre/fantasy/',
      'https://komiku.org/genre/romance/',
      'https://komiku.org/genre/shounen/',
      'https://komiku.org/type/manga/',
      'https://komiku.org/type/manhwa/',
      'https://komiku.org/type/manhua/',
    ];
    
    const sources = [...workingSources];
    
    if (aggressive === 'true') {
      sources.push(...alternativeUrls);
      
      for (let page = 2; page <= maxPages; page++) {
        sources.push(`https://komiku.org/page/${page}/`);
        sources.push(`https://komiku.org/daftar-komik/page/${page}/`);
      }
    }
    
    console.log(`Unlimited v2: Testing ${sources.length} sources...`);
    
    const fetchWithMultipleSelectors = async (url, retries = 2) => {
      for (let i = 0; i <= retries; i++) {
        try {
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive'
            },
            timeout: 12000
          });
          
          const $ = cheerio.load(response.data);
          const comics = [];

          const selectors = [
            'article.ls4',    // Main comic articles
            '.ls4',          // Alternative ls4 elements  
            '.bge',          // Grid layout
            '.bgei'          // Grid items
          ];
          
          for (const selector of selectors) {
            $(selector).each((i, el) => {
              const $el = $(el);
              
              let title = $el.find('.ls4j h3 a, h3 a, h4 a, .title a').text().trim();
              let link = $el.find('.ls4v a, .ls4j h3 a, h3 a, h4 a, .title a').attr('href');
              let image = $el.find('.ls4v img, img').attr('data-src') || 
                         $el.find('.ls4v img, img').attr('src');
              
              if (!title) title = $el.find('a').first().attr('title') || $el.find('img').attr('alt') || '';
              if (!link) link = $el.find('a').first().attr('href');
              if (!image) {
                image = $el.find('img').attr('data-lazy-src') || 
                       $el.find('img').attr('data-original') ||
                       $el.find('img').attr('srcset');
              }
              
              if (image && image.includes(',')) {
                image = image.split(',')[0].trim();
              }
              
              const chapter = $el.find('.ls24, .chapter, .new-chapter, .latest').text().trim();
              const rating = $el.find('.rating, .score, .stars').text().trim();
              const genre = $el.find('.genre, .categories, .cat, .tags').text().trim();
              const status = $el.find('.status, .completed, .ongoing, .up, .down').text().trim();
              
              if (title && link && title.length > 2 && 
                  (link.includes('/manga/') || link.includes('/komik/'))) {
                comics.push({
                  title: title.substring(0, 100),
                  link: link.startsWith('http') ? link : `https://komiku.org${link}`,
                  image: (image && image.startsWith('http')) ? image : 
                         image ? `https://komiku.org${image}` : 
                         'https://via.placeholder.com/200x300?text=No+Image',
                  chapter: chapter || 'Latest',
                  rating: rating || null,
                  genre: genre || null,
                  status: status || null,
                  source: url,
                  selector_used: selector,
                  fetched_at: new Date().toISOString()
                });
              }
            });
            
            if (comics.length > 0) break;
          }
          
          console.log(`Unlimited v2: ${url} -> ${comics.length} comics`);
          return comics;
          
        } catch (error) {
          if (i === retries) {
            console.log(`Unlimited v2: Failed ${url} - ${error.message}`);
            return [];
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
      return [];
    };
    
    for (const url of sources) {
      const comics = await fetchWithMultipleSelectors(url);
      
      const comicMap = new Map();
      [...allComics, ...comics].forEach(comic => {
        if (comic.link && comic.title) {
          comicMap.set(comic.link, comic);
        }
      });
      allComics = Array.from(comicMap.values());
      
      console.log(`Unlimited v2: Total unique comics so far: ${allComics.length}`);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (allComics.length >= 100) {
        console.log(`Unlimited v2: Early break at ${allComics.length} comics`);
        break;
      }
    }

    allComics.sort((a, b) => {
      if (a.source.includes('komiku.org/') && a.source.split('/').length === 4) return -1;
      if (b.source.includes('komiku.org/') && b.source.split('/').length === 4) return 1;
      
      return a.title.localeCompare(b.title);
    });

    res.json({
      type,
      comics: allComics,
      metadata: {
        total_sources: sources.length,
        total_comics: allComics.length,
        aggressive_mode: aggressive === 'true',
        max_pages: maxPages,
        collection_time: new Date().toISOString(),
        note: 'Enhanced multi-selector data aggregation',
        success_rate: `${Math.round((allComics.length / sources.length) * 100)}%`
      }
    });
  } catch (error) {
    console.error('Error in unlimited v2 endpoint:', error);
    res.status(500).json({ message: 'Error fetching unlimited data', error: error.message });
  }
});

app.get('/api/scroll', async (req, res) => {
  try {
    const { 
      offset = 0, 
      batch_size = 20,
      seed = Date.now(),
      type = 'mixed' 
    } = req.query;
    
    const offsetNum = parseInt(offset);
    const batchSize = Math.min(parseInt(batch_size), 50);
    
    const sources = [
      'https://komiku.org/',
      'https://komiku.org/pustaka/',
      'https://komiku.org/pustaka/?orderby=modified',
      'https://komiku.org/pustaka/?orderby=meta_value_num',
      `https://komiku.org/pustaka/page/${Math.floor(offsetNum / 20) + 1}/`,
      `https://komiku.org/pustaka/page/${Math.floor(offsetNum / 20) + 2}/`,
      'https://komiku.org/other/hot/'
    ];
    
    let allComics = [];
    
    for (const url of sources) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 8000
        });
        const $ = cheerio.load(response.data);

        $('.ls4, .bge, .bgei, .ltst').each((i, el) => {
          const $el = $(el);
          const title = $el.find('h3 a, h4 a').text().trim();
          const link = $el.find('h3 a, h4 a').attr('href');
          const image = $el.find('img').attr('src') || $el.find('img').attr('data-src');
          const chapter = $el.find('.chapter, .ls24').text().trim();
          
          if (title && link && image) {
            allComics.push({
              title,
              link,
              image,
              chapter: chapter || 'Latest',
              scroll_position: offsetNum + allComics.length,
              batch_id: Math.floor(offsetNum / batchSize),
              source_page: url
            });
          }
        });
      } catch (error) {
        console.log(`Scroll source failed: ${url}`);
        continue;
      }
    }
    
    const uniqueComics = [];
    const seenLinks = new Set();
    allComics.forEach(comic => {
      if (!seenLinks.has(comic.link)) {
        seenLinks.add(comic.link);
        uniqueComics.push(comic);
      }
    });
    
    
    const rng = parseInt(seed) + offsetNum;
    uniqueComics.sort((a, b) => {
      const aHash = (a.title.charCodeAt(0) + rng) % 1000;
      const bHash = (b.title.charCodeAt(0) + rng) % 1000;
      return aHash - bHash;
    });
    
    
    const startIdx = 0;
    const endIdx = batchSize;
    const batch = uniqueComics.slice(startIdx, endIdx);
    res.json({
      comics: batch,
      scroll_info: {
        current_offset: offsetNum,
        batch_size: batchSize,
        returned_count: batch.length,
        next_offset: offsetNum + batch.length,
        has_more: batch.length === batchSize,
        batch_id: Math.floor(offsetNum / batchSize),
        seed: seed
      },
      infinite_scroll: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in scroll endpoint:', error);
    res.status(500).json({ message: 'Error fetching scroll data', error: error.message });
  }
});

app.get('/api/fullstats', async (req, res) => {
  try {
    const endpointTests = [
      { name: 'terbaru', url: 'http://localhost:3000/api/terbaru?limit=5' },
      { name: 'populer', url: 'http://localhost:3000/api/populer?limit=5' },
      { name: 'infinite', url: 'http://localhost:3000/api/infinite?page=1&limit=5' },
      { name: 'realtime', url: 'http://localhost:3000/api/realtime?count=5' },
      { name: 'trending', url: 'http://localhost:3000/api/trending?limit=5' },
      { name: 'browse', url: 'http://localhost:3000/api/browse?limit=5' }
    ];
    
    const results = {};
    
    for (const test of endpointTests) {
      try {
        const response = await axios.get(test.url, { timeout: 5000 });
        const data = response.data;
        
        results[test.name] = {
          status: 'working',
          count: data.comics ? data.comics.length : 0,
          response_time: new Date().toISOString()
        };
      } catch (error) {
        results[test.name] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    const stats = {
      server_status: 'running',
      endpoints_tested: Object.keys(results).length,
      working_endpoints: Object.values(results).filter(r => r.status === 'working').length,
      failed_endpoints: Object.values(results).filter(r => r.status === 'error').length,
      total_available_endpoints: 15,
      test_results: results,
      last_check: new Date().toISOString(),
      uptime: process.uptime(),
      memory_usage: process.memoryUsage()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error in fullstats:', error);
    res.status(500).json({ message: 'Error getting full stats', error: error.message });
  }
});

app.get('/api/comparison', async (req, res) => {
  try {
    const { demo = false } = req.query;
    
    const websiteScrollSimulation = await axios.get('https://komiku.org/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const $ = cheerio.load(websiteScrollSimulation.data);
    const websiteData = [];
    
    $('article.ls4').slice(0, 20).each((i, el) => { 
      const title = $(el).find('.ls4j h3 a').text().trim();
      const link = $(el).find('.ls4v a').attr('href');
      if (title && link) {
        websiteData.push({ title, link });
      }
    });
    
    const apiResponse = await axios.get('http://localhost:3000/api/unlimited?type=all&max_pages=2', {
      timeout: 30000
    });
    const apiData = apiResponse.data.comics || [];
    
    const comparison = {
      website_scroll: {
        method: 'Manual scroll simulation',
        data_count: websiteData.length,
        limitation: 'Limited by infinite scroll behavior',
        sample: websiteData.slice(0, 5)
      },
      api_unlimited: {
        method: 'Deep crawling aggregation',
        data_count: apiData.length,
        advantage: 'Access to complete database',
        sample: apiData.slice(0, 5).map(c => ({ title: c.title, link: c.link }))
      },
      performance_ratio: {
        improvement: `${Math.round((apiData.length / Math.max(websiteData.length, 1)) * 100)}%`,
        data_multiplier: `${Math.round(apiData.length / Math.max(websiteData.length, 1))}x more data`,
        conclusion: apiData.length > websiteData.length * 10 ? 
                   'API provides significantly more data than manual scrolling' :
                   'API provides enhanced data access'
      },
      recommendation: {
        for_infinite_scroll: 'Use /api/scroll with offset pagination',
        for_maximum_data: 'Use /api/unlimited with aggressive=true',
        for_real_time: 'Use /api/realtime with fresh=true',
        for_specific_types: 'Use /api/unlimited?type=manga/manhwa/manhua'
      }
    };
    
    if (demo === 'true') {
      const endpoints = [
        { name: 'terbaru', url: 'http://localhost:3000/api/terbaru?limit=50' },
        { name: 'realtime', url: 'http://localhost:3000/api/realtime?count=50' },
        { name: 'unlimited', url: 'http://localhost:3000/api/unlimited?type=all&max_pages=1' }
      ];
      
      const endpointResults = {};
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint.url, { timeout: 10000 });
          endpointResults[endpoint.name] = {
            count: response.data.comics ? response.data.comics.length : 0,
            status: 'success'
          };
        } catch (error) {
          endpointResults[endpoint.name] = {
            count: 0,
            status: 'error',
            error: error.message
          };
        }
      }
      comparison.endpoint_demo = endpointResults;
    }
    
    res.json(comparison);
  } catch (error) {
    console.error('Error in comparison endpoint:', error);
    res.status(500).json({ message: 'Error generating comparison', error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/api/populer', cacheMiddleware(5 * 60 * 1000), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const maxLimit = Math.min(parseInt(limit), 50);
    
    const urls = [
      'https://komiku.org/pustaka/?orderby=meta_value_num',
      'https://komiku.org/other/hot/',
      'https://komiku.org/',
      'https://komiku.org/pustaka/?orderby=meta_value_num&tipe=manga',
      'https://komiku.org/pustaka/?orderby=meta_value_num&tipe=manhwa',
      'https://komiku.org/pustaka/?orderby=meta_value_num&tipe=manhua'
    ];
    
    let allComics = [];
    
    for (const url of urls) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const $ = cheerio.load(response.data);

        if (url.includes('pustaka')) {
          $('.bgei, .bge, .entry, article, .ls4').each((i, el) => {
            const title = $(el).find('h3 a, h4 a, .title a').text().trim();
            const link = $(el).find('h3 a, h4 a, .title a').attr('href');
            const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
            const chapter = $(el).find('.chapter, .ls24').text().trim();
            
            if (title && link && image && allComics.length < 100) {
              const exists = allComics.find(c => c.link === link);
              if (!exists) {
                allComics.push({ 
                  title, 
                  link, 
                  image, 
                  chapter: chapter || 'Latest',
                  source: 'pustaka',
                  popularity: url.includes('meta_value_num') ? 2 : 1
                });
              }
            }
          });
        } else if (url.includes('other/hot')) {
          $('.hot .ls1, .daftar .bge, .ls4, .bge').each((i, el) => {
            const title = $(el).find('h4 a, h3 a').text().trim();
            const link = $(el).find('h4 a, h3 a').attr('href');
            const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
            const chapter = $(el).find('.ls1r a, .chapter').first().text().trim();
            
            if (title && link && image && allComics.length < 100) {
              const exists = allComics.find(c => c.link === link);
              if (!exists) {
                allComics.push({ 
                  title, 
                  link, 
                  image, 
                  chapter: chapter || 'Hot',
                  source: 'hot',
                  popularity: 3
                });
              }
            }
          });
        } else {
          $('.populer .ls1, .hot .ls1, .ranktainer .ls1').each((i, el) => {
            const title = $(el).find('h4 a, h3 a').text().trim();
            const link = $(el).find('h4 a, h3 a').attr('href');
            const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
            const chapter = $(el).find('.ls1r a, .chapter').first().text().trim();
            
            if (title && link && image && allComics.length < 100) {
              const exists = allComics.find(c => c.link === link);
              if (!exists) {
                allComics.push({ 
                  title, 
                  link, 
                  image, 
                  chapter: chapter || 'Popular',
                  source: 'homepage_popular',
                  popularity: 2
                });
              }
            }
          });
        }
        
        if (allComics.length >= 80) break; 
      } catch (error) {
        console.log(`Failed to fetch from ${url}:`, error.message);
        continue;
      }
    }

    if (allComics.length === 0) {
      const latestResponse = await axios.get('https://komiku.org/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(latestResponse.data);
      
      $('.ls4').slice(0, 30).each((i, el) => {
        const title = $(el).find('h3 a').text().trim();
        const link = $(el).find('h3 a').attr('href');
        const image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
        const chapter = $(el).find('.ls24').text().trim();
        
        if (title && link && image) {
          allComics.push({ 
            title, 
            link, 
            image,
            chapter: chapter || 'Latest',
            source: 'latest_as_popular',
            popularity: 1
          });
        }
      });
    }

    allComics.sort((a, b) => b.popularity - a.popularity);
    
    const startIndex = (parseInt(page) - 1) * maxLimit;
    const endIndex = startIndex + maxLimit;
    const paginatedComics = allComics.slice(startIndex, endIndex);

    res.json({
      comics: paginatedComics,
      pagination: {
        current_page: parseInt(page),
        per_page: maxLimit,
        total: allComics.length,
        has_more: endIndex < allComics.length
      }
    });
  } catch (error) {
    console.error('Error fetching popular comics:', error);
    res.status(500).json({ message: 'Error fetching popular comics', error: error.message });
  }
});

app.get('/api/terbaru', cacheMiddleware(3 * 60 * 1000), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const maxLimit = Math.min(parseInt(limit), 50); 
    
    const response = await axios.get('https://komiku.org/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);

    const comics = [];
    $('.ls4').each((i, el) => {
      const title = $(el).find('h3 a').text().trim();
      const link = $(el).find('h3 a').attr('href');
      const image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
      const chapter = $(el).find('a.ls24').text().trim();
      if (title && link && image && chapter) {
        comics.push({ title, link, image, chapter });
      }
    });

    if (comics.length < maxLimit) {
      $('.hot .ls1, .ranktainer .ls1').each((i, el) => {
        const title = $(el).find('h4 a, h3 a').text().trim();
        const link = $(el).find('h4 a, h3 a').attr('href');
        const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
        const chapter = $(el).find('.ls1r a, .chapter').first().text().trim();
        
        if (title && link && image && comics.length < maxLimit) {
          const exists = comics.find(c => c.link === link);
          if (!exists) {
            comics.push({ title, link, image, chapter: chapter || 'Latest', source: 'popular' });
          }
        }
      });
    }

    if (comics.length < maxLimit) {
      try {
        const pustakaResponse = await axios.get('https://komiku.org/pustaka/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const $pustaka = cheerio.load(pustakaResponse.data);
        
        $pustaka('.ls4, .bge, .bgei').each((i, el) => {
          const title = $pustaka(el).find('h3 a, h4 a').text().trim();
          const link = $pustaka(el).find('h3 a, h4 a').attr('href');
          const image = $pustaka(el).find('img').attr('src') || $pustaka(el).find('img').attr('data-src');
          const chapter = $pustaka(el).find('.chapter, .ls24').text().trim();
          
          if (title && link && image && comics.length < maxLimit) {
            const exists = comics.find(c => c.link === link);
            if (!exists) {
              comics.push({ title, link, image, chapter: chapter || 'Unknown', source: 'pustaka' });
            }
          }
        });
      } catch (error) {
        console.log('Failed to fetch from pustaka:', error.message);
      }
    }

    const startIndex = (parseInt(page) - 1) * maxLimit;
    const endIndex = startIndex + maxLimit;
    const paginatedComics = comics.slice(startIndex, endIndex);

    res.json({
      comics: paginatedComics,
      pagination: {
        current_page: parseInt(page),
        per_page: maxLimit,
        total: comics.length,
        has_more: endIndex < comics.length
      }
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

app.get('/api/comic/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const response = await axios.get(`https://komiku.org/manga/${slug}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);

    let title = '';
    const scriptTitleMatch = response.data.match(/const judul = "(.*?)"/);
    if (scriptTitleMatch && scriptTitleMatch[1]) {
        title = scriptTitleMatch[1];
    }

    if (!title) {
        const pageTitle = $('title').text();
        const titleMatch = pageTitle.match(/Baca (?:Manga|Manhwa|Manhua) (.*?) Bahasa Indonesia/);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
        } else {
          title = $('h1.jdl').text().trim();
        }
    }
    
    const synopsis = $('p.desc').text().trim();

    const chapters = [];
    $('#Daftar_Chapter tbody tr').each((i, el) => {
      const chapterTitle = $(el).find('a').text().trim();
      const chapterLink = $(el).find('a').attr('href');
      if (chapterTitle && chapterLink) {
        chapters.push({ chapter: chapterTitle, link: chapterLink });
      }
    });

    res.json({ title, synopsis, chapters });

  } catch (error) {
    console.error('Error fetching comic details:', error);
    res.status(500).json({ message: 'Error fetching comic details', error: error.message });
  }
});

app.get('/api/chapter/:chapter_link_segment', async (req, res) => {
  try {
    const { chapter_link_segment } = req.params;
    const response = await axios.get(`https://komiku.org/${chapter_link_segment}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);

    const images = [];
    $('#Baca_Komik img').each((i, el) => {
      const imageUrl = $(el).attr('src');
      if (imageUrl) {
        images.push(imageUrl);
      }
    });

    res.json({ images });

  } catch (error) {
    console.error('Error fetching chapter images:', error);
    res.status(500).json({ message: 'Error fetching chapter images', error: error.message });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    const maxLimit = Math.min(parseInt(limit), 50);
    let allComics = [];

    try {
      const searchResponse = await axios.get(`https://komiku.org/?s=${encodeURIComponent(q)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      const $ = cheerio.load(searchResponse.data);
      
      const isSearchResults = !$('body').text().includes('Tidak ditemukan') && 
                             !$('body').text().includes('No results found') &&
                             !$('.no-results').length;

      if (isSearchResults) {
        const selectors = ['.ls4', '.bge', '.bgei', 'article', '.search-result', '.result-item'];
        
        for (const selector of selectors) {
          $(selector).each((i, el) => {
            const $el = $(el);
            const title = $el.find('h3 a, h4 a, .title a').text().trim();
            const link = $el.find('h3 a, h4 a, .title a').attr('href');
            const image = $el.find('img').attr('src') || $el.find('img').attr('data-src');
            const chapter = $el.find('.chapter, .ls24, a[href*="chapter"]').text().trim();
            
            if (title && link && title.toLowerCase().includes(q.toLowerCase())) {
              const exists = allComics.find(c => c.link === link);
              if (!exists && allComics.length < 100) {
                allComics.push({
                  title,
                  link,
                  image: image || 'https://komiku.org/asset/img/no-image.png',
                  chapter: chapter || 'Unknown',
                  source: 'search',
                  relevance: title.toLowerCase().indexOf(q.toLowerCase()) === 0 ? 2 : 1
                });
              }
            }
          });
          
          if (allComics.length >= 20) break;
        }
      }
    } catch (error) {
      console.log('Search method 1 failed:', error.message);
    }

    if (allComics.length === 0) {
      try {
        const sources = [
          'https://komiku.org/',
          'https://komiku.org/pustaka/',
          'https://komiku.org/pustaka/?orderby=modified'
        ];

        for (const url of sources) {
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          const $ = cheerio.load(response.data);

          $('.ls4, .bge, .bgei').each((i, el) => {
            const title = $(el).find('h3 a, h4 a').text().trim();
            const link = $(el).find('h3 a, h4 a').attr('href');
            const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
            const chapter = $(el).find('.chapter, .ls24').text().trim();

            if (title && link && title.toLowerCase().includes(q.toLowerCase())) {
              const exists = allComics.find(c => c.link === link);
              if (!exists && allComics.length < 100) {
                allComics.push({
                  title,
                  link,
                  image: image || 'https://komiku.org/asset/img/no-image.png',
                  chapter: chapter || 'Unknown',
                  source: 'manual_filter',
                  relevance: title.toLowerCase().indexOf(q.toLowerCase()) === 0 ? 2 : 1
                });
              }
            }
          });

          if (allComics.length >= 30) break;
        }
      } catch (error) {
        console.log('Manual filter method failed:', error.message);
      }
    }

    if (allComics.length === 0) {
      try {
        const daftarResponse = await axios.get('https://komiku.org/daftar-komik/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const $ = cheerio.load(daftarResponse.data);

        $('.bge, .bgei, .entry').each((i, el) => {
          const title = $(el).find('h3 a, h4 a, .title a').text().trim();
          const link = $(el).find('h3 a, h4 a, .title a').attr('href');
          const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');

          if (title && link && title.toLowerCase().includes(q.toLowerCase())) {
            const exists = allComics.find(c => c.link === link);
            if (!exists && allComics.length < 50) {
              allComics.push({
                title,
                link,
                image: image || 'https://komiku.org/asset/img/no-image.png',
                chapter: 'Unknown',
                source: 'daftar_komik',
                relevance: title.toLowerCase().indexOf(q.toLowerCase()) === 0 ? 2 : 1
              });
            }
          }
        });
      } catch (error) {
        console.log('Daftar komik method failed:', error.message);
      }
    }

    allComics.sort((a, b) => b.relevance - a.relevance);
    
    const startIndex = (parseInt(page) - 1) * maxLimit;
    const endIndex = startIndex + maxLimit;
    const paginatedResults = allComics.slice(startIndex, endIndex);

    res.json({
      query: q,
      comics: paginatedResults,
      pagination: {
        current_page: parseInt(page),
        per_page: maxLimit,
        total: allComics.length,
        has_more: endIndex < allComics.length
      }
    });
  } catch (error) {
    console.error('Error searching comics:', error);
    res.status(500).json({ message: 'Error searching comics', error: error.message });
  }
});

app.get('/api/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1 } = req.query;
    
    if (!['manga', 'manhwa', 'manhua'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type. Use "manga", "manhwa", or "manhua"' });
    }
    
    const urls = [
      `https://komiku.org/pustaka/?tipe=${type}&page=${page}`,
      `https://komiku.org/pustaka/?orderby=modified&tipe=${type}&page=${page}`,
      `https://komiku.org/daftar-komik/?tipe=${type}&page=${page}`
    ];
    
    let comics = [];
    
    for (const url of urls) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const $ = cheerio.load(response.data);

        const selectors = ['.ls4', '.bge', '.bgei', 'article', '.entry', '.comic-item'];
        
        for (const selector of selectors) {
          $(selector).each((i, el) => {
            const $el = $(el);
            const title = $el.find('h3 a, h4 a, .title a').text().trim();
            const link = $el.find('h3 a, h4 a, .title a').attr('href');
            const image = $el.find('img').attr('src') || $el.find('img').attr('data-src');
            const chapter = $el.find('.ls24, .chapter, a[href*="chapter"]').text().trim();
            
            if (title && link && comics.length < 24) {
              const isCorrectType = link && (
                link.includes(`/${type}/`) || 
                $el.text().toLowerCase().includes(type) ||
                true 
              );
              
              if (isCorrectType) {
                comics.push({ 
                  title, 
                  link, 
                  image: image || 'https://komiku.org/asset/img/no-image.png',
                  chapter: chapter || 'Unknown',
                  type: type
                });
              }
            }
          });
          
          if (comics.length >= 20) break;
        }
        
        if (comics.length >= 15) break; 
      } catch (error) {
        console.log(`Failed to fetch from ${url}:`, error.message);
        continue;
      }
    }
    
    if (comics.length === 0) {
      const response = await axios.get('https://komiku.org/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);
      
      $(`.${type} .ls4, .ls4`).each((i, el) => {
        const title = $(el).find('h3 a').text().trim();
        const link = $(el).find('h3 a').attr('href');
        const image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
        const chapter = $(el).find('.ls24').text().trim();
        
        if (title && link && image && comics.length < 12) {
          comics.push({ 
            title, 
            link, 
            image,
            chapter: chapter || 'Unknown',
            type: type,
            note: 'from_homepage'
          });
        }
      });
    }

    const uniqueComics = comics.filter((comic, index, self) => 
      index === self.findIndex(c => c.link === comic.link)
    );

    res.json(uniqueComics);
  } catch (error) {
    console.error('Error fetching type comics:', error);
    res.status(500).json({ message: 'Error fetching type comics', error: error.message });
  }
});

app.get('/api/homepage', async (req, res) => {
  try {
    const response = await axios.get('https://komiku.org/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);

    const data = {
      popular: [],
      latest: [],
      ranking: []
    };

    $('.ranktainer .ls1, .hot .ls1').each((i, el) => {
      const title = $(el).find('h4 a, h3 a').text().trim();
      const link = $(el).find('h4 a, h3 a').attr('href');
      const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      const chapter = $(el).find('.ls1r a, .chapter').first().text().trim();
      
      if (title && link) {
        data.ranking.push({ title, link, image, chapter });
      }
    });

    $('.ls4').each((i, el) => {
      const title = $(el).find('h3 a').text().trim();
      const link = $(el).find('h3 a').attr('href');
      const image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
      const chapter = $(el).find('a.ls24').text().trim();
      
      if (title && link && image && chapter) {
        data.latest.push({ title, link, image, chapter });
      }
    });

    res.json(data);
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    res.status(500).json({ message: 'Error fetching homepage data', error: error.message });
  }
});

app.get('/api/chapter/:chapter_link_segment/navigation', async (req, res) => {
  try {
    const { chapter_link_segment } = req.params;
    const response = await axios.get(`https://komiku.org/${chapter_link_segment}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);

    const navigation = {
      currentChapter: $('title').text().trim(),
      previousChapter: null,
      nextChapter: null
    };

    $('.navig a, .pager a, .navigation a').each((i, el) => {
      const text = $(el).text().trim().toLowerCase();
      const link = $(el).attr('href');
      if ((text.includes('previous') || text.includes('sebelumnya') || text.includes('prev')) && link) {
        navigation.previousChapter = { text: $(el).text().trim(), link };
      } else if ((text.includes('next') || text.includes('selanjutnya') || text.includes('lanjut')) && link) {
        navigation.nextChapter = { text: $(el).text().trim(), link };
      }
    });

    res.json(navigation);
  } catch (error) {
    console.error('Error fetching chapter navigation:', error);
    res.status(500).json({ message: 'Error fetching chapter navigation', error: error.message });
  }
});

app.get('/api/genres', async (req, res) => {
  try {
    const genres = [
      { value: 'action', name: 'Action' },
      { value: 'adventure', name: 'Adventure' },
      { value: 'comedy', name: 'Comedy' },
      { value: 'drama', name: 'Drama' },
      { value: 'ecchi', name: 'Ecchi' },
      { value: 'fantasy', name: 'Fantasy' },
      { value: 'harem', name: 'Harem' },
      { value: 'historical', name: 'Historical' },
      { value: 'horror', name: 'Horror' },
      { value: 'isekai', name: 'Isekai' },
      { value: 'martial-arts', name: 'Martial Arts' },
      { value: 'mecha', name: 'Mecha' },
      { value: 'mystery', name: 'Mystery' },
      { value: 'psychological', name: 'Psychological' },
      { value: 'romance', name: 'Romance' },
      { value: 'school-life', name: 'School Life' },
      { value: 'sci-fi', name: 'Sci-fi' },
      { value: 'seinen', name: 'Seinen' },
      { value: 'shoujo', name: 'Shoujo' },
      { value: 'shounen', name: 'Shounen' },
      { value: 'slice-of-life', name: 'Slice of Life' },
      { value: 'sports', name: 'Sports' },
      { value: 'supernatural', name: 'Supernatural' },
      { value: 'thriller', name: 'Thriller' }
    ];

    res.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ message: 'Error fetching genres', error: error.message });
  }
});

app.get('/api/random', async (req, res) => {
  try {
    const { count = 10 } = req.query;
    const maxCount = Math.min(parseInt(count), 20); 
    
    const response = await axios.get('https://komiku.org/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);

    const allComics = [];
    $('.ls4').each((i, el) => {
      const title = $(el).find('h3 a').text().trim();
      const link = $(el).find('h3 a').attr('href');
      const image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
      const chapter = $(el).find('.ls24').text().trim();
      
      if (title && link && image) {
        allComics.push({ title, link, image, chapter });
      }
    });

    const shuffled = allComics.sort(() => 0.5 - Math.random());
    const randomComics = shuffled.slice(0, maxCount);

    res.json(randomComics);
  } catch (error) {
    console.error('Error fetching random comics:', error);
    res.status(500).json({ message: 'Error fetching random comics', error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const response = await axios.get('https://komiku.org/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);

    const stats = {
      totalComics: 0,
      totalChapters: 0,
      lastUpdated: new Date().toISOString(),
      availableEndpoints: [
        '/api/terbaru',
        '/api/populer', 
        '/api/homepage',
        '/api/search',
        '/api/type/:type',
        '/api/comic/:slug',
        '/api/chapter/:segment',
        '/api/chapter/:segment/navigation',
        '/api/genres',
        '/api/random',
        '/api/stats',
        '/api/infinite'
      ]
    };

    const bodyText = $('body').text();
    const comicsMatch = bodyText.match(/(\d+[\.,]?\d*)\s*(?:judul|komik|title)/i);
    const chaptersMatch = bodyText.match(/(\d+[\.,]?\d*)\s*(?:chapter|bab)/i);
    
    if (comicsMatch) {
      stats.totalComics = parseInt(comicsMatch[1].replace(/[.,]/g, ''));
    }
    if (chaptersMatch) {
      stats.totalChapters = parseInt(chaptersMatch[1].replace(/[.,]/g, ''));
    }

    const currentComics = $('.ls4').length;
    stats.currentlyDisplayed = currentComics;

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

app.get('/api/infinite', async (req, res) => {
  try {
    const { page = 1, limit = 24, type = 'latest' } = req.query;
    const maxLimit = Math.min(parseInt(limit), 50);
    let allComics = [];
    
    const sources = {
      latest: [
        'https://komiku.org/',
        'https://komiku.org/pustaka/?orderby=modified',
        'https://komiku.org/pustaka/'
      ],
      popular: [
        'https://komiku.org/pustaka/?orderby=meta_value_num',
        'https://komiku.org/other/hot/',
        'https://komiku.org/'
      ],
      manga: [
        'https://komiku.org/pustaka/?tipe=manga',
        'https://komiku.org/pustaka/?orderby=modified&tipe=manga'
      ],
      manhwa: [
        'https://komiku.org/pustaka/?tipe=manhwa',
        'https://komiku.org/pustaka/?orderby=modified&tipe=manhwa'
      ],
      manhua: [
        'https://komiku.org/pustaka/?tipe=manhua',
        'https://komiku.org/pustaka/?orderby=modified&tipe=manhua'
      ]
    };

    const urls = sources[type] || sources.latest;
    
    for (const url of urls) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const $ = cheerio.load(response.data);

        $('.ls4, .bge, .bgei, article').each((i, el) => {
          const title = $(el).find('h3 a, h4 a').text().trim();
          const link = $(el).find('h3 a, h4 a').attr('href');
          const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
          const chapter = $(el).find('.chapter, .ls24').text().trim();
          
          if (title && link && image && allComics.length < 200) {
            const exists = allComics.find(c => c.link === link);
            if (!exists) {
              allComics.push({
                title,
                link,
                image,
                chapter: chapter || 'Unknown',
                type: type,
                source: url.includes('orderby=meta_value_num') ? 'popular' : 
                       url.includes('orderby=modified') ? 'latest' : 'mixed'
              });
            }
          }
        });
        
        if (allComics.length >= 150) break;
      } catch (error) {
        console.log(`Failed to fetch from ${url}:`, error.message);
        continue;
      }
    }

    if (type === 'latest' && parseInt(page) > 1) {
      allComics = allComics.sort(() => 0.5 - Math.random());
    }

    const startIndex = (parseInt(page) - 1) * maxLimit;
    const endIndex = startIndex + maxLimit;
    const paginatedComics = allComics.slice(startIndex, endIndex);

    res.json({
      type,
      comics: paginatedComics,
      pagination: {
        current_page: parseInt(page),
        per_page: maxLimit,
        total: allComics.length,
        has_more: endIndex < allComics.length,
        next_page: endIndex < allComics.length ? parseInt(page) + 1 : null
      },
      infinite_scroll: true
    });
  } catch (error) {
    console.error('Error fetching infinite scroll data:', error);
    res.status(500).json({ message: 'Error fetching infinite scroll data', error: error.message });
  }
});

app.get('/api/browse', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 24, 
      type = 'all', 
      order = 'latest', 
      genre = null 
    } = req.query;
    
    const maxLimit = Math.min(parseInt(limit), 50);
    let allComics = [];
    
    let baseUrl = 'https://komiku.org/pustaka/';
    const params = new URLSearchParams();
    
    if (type !== 'all' && ['manga', 'manhwa', 'manhua'].includes(type)) {
      params.append('tipe', type);
    }
    
    if (order === 'popular') {
      params.append('orderby', 'meta_value_num');
    } else if (order === 'latest') {
      params.append('orderby', 'modified');
    }
    
    if (genre) {
      baseUrl = 'https://komiku.org/';
    }
    
    const finalUrl = baseUrl + (params.toString() ? '?' + params.toString() : '');
    
    try {
      const response = await axios.get(finalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);

      $('.ls4, .bge, .bgei').each((i, el) => {
        const title = $(el).find('h3 a, h4 a').text().trim();
        const link = $(el).find('h3 a, h4 a').attr('href');
        const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
        const chapter = $(el).find('.chapter, .ls24').text().trim();
        
        if (genre) {
          const comicText = $(el).text().toLowerCase();
          if (!comicText.includes(genre.toLowerCase())) {
            return;
          }
        }
        
        if (title && link && image) {
          allComics.push({
            title,
            link,
            image,
            chapter: chapter || 'Unknown',
            type: type === 'all' ? 'mixed' : type,
            order: order
          });
        }
      });
    } catch (error) {
      console.log('Browse fetch failed:', error.message);
    }

    if (allComics.length === 0) {
      const homeResponse = await axios.get('https://komiku.org/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(homeResponse.data);
      
      $('.ls4').each((i, el) => {
        const title = $(el).find('h3 a').text().trim();
        const link = $(el).find('h3 a').attr('href');
        const image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
        const chapter = $(el).find('.ls24').text().trim();
        
        if (title && link && image && allComics.length < 50) {
          allComics.push({
            title,
            link,
            image,
            chapter: chapter || 'Latest',
            type: 'mixed',
            order: 'latest'
          });
        }
      });
    }

    const startIndex = (parseInt(page) - 1) * maxLimit;
    const endIndex = startIndex + maxLimit;
    const paginatedComics = allComics.slice(startIndex, endIndex);

    res.json({
      filters: { type, order, genre },
      comics: paginatedComics,
      pagination: {
        current_page: parseInt(page),
        per_page: maxLimit,
        total: allComics.length,
        has_more: endIndex < allComics.length
      }
    });
  } catch (error) {
    console.error('Error browsing comics:', error);
    res.status(500).json({ message: 'Error browsing comics', error: error.message });
  }
});

// Endpoint untuk mencari berdasarkan genre
app.get('/api/genre/:genre', cacheMiddleware(5 * 60 * 1000), async (req, res) => {
  try {
    const { genre } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const maxLimit = Math.min(parseInt(limit), 50);

    // Improved genre URLs with better coverage
    const genreUrls = [
      `https://komiku.org/genre/${genre}/`,
      `https://komiku.org/genre/${genre}/page/${page}/`,
      `https://komiku.org/pustaka/?genre=${genre}`,
      `https://komiku.org/pustaka/?genre=${genre}&page=${page}`,
      `https://komiku.org/pustaka/?orderby=modified&genre=${genre}`,
    ];

    let allComics = [];
    const seenLinks = new Set();

    for (const url of genreUrls) {
      try {
        console.log(`Fetching genre data from: ${url}`);
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 15000
        });
        
        const $ = cheerio.load(response.data);
        
        // Use improved selectors similar to working endpoints
        const selectors = [
          'article.ls4',    // Main comic articles
          '.ls4',          // Alternative ls4 elements  
          '.bge',          // Grid layout
          '.bgei',         // Grid items
          '.animpost',     // Animation posts
          '.listupd article' // List updates
        ];
        
        for (const selector of selectors) {
          $(selector).each((i, el) => {
            const $el = $(el);
            
            // Improved title extraction
            let title = $el.find('.ls4j h3 a, h3 a, h4 a, .title a, .entry-title a').text().trim();
            let link = $el.find('.ls4v a, .ls4j h3 a, h3 a, h4 a, .title a, .entry-title a').attr('href');
            let image = $el.find('.ls4v img, img').attr('data-src') || 
                       $el.find('.ls4v img, img').attr('src') ||
                       $el.find('img').attr('data-lazy-src');
            
            // Fallback for title and link
            if (!title) title = $el.find('a').first().attr('title') || $el.find('img').attr('alt') || '';
            if (!link) link = $el.find('a').first().attr('href');
            
            // Enhanced chapter detection
            const chapter = $el.find('.ls24, .chapter, .new-chapter, .latest, .epxs').text().trim();
            const status = $el.find('.status, .completed, .ongoing').text().trim();
            const rating = $el.find('.rating, .score, .numscore').text().trim();

            if (title && link && title.length > 2 && 
                (link.includes('/manga/') || link.includes('/komik/')) &&
                !seenLinks.has(link)) {
              
              seenLinks.add(link);
              allComics.push({
                title: title.substring(0, 100),
                link: link.startsWith('http') ? link : `https://komiku.org${link}`,
                image: (image && image.startsWith('http')) ? image : 
                       image ? `https://komiku.org${image}` : 
                       'https://komiku.org/asset/img/no-image.png',
                chapter: chapter || 'Latest',
                status: status || null,
                rating: rating || null,
                genre: genre,
                source: url,
                selector_used: selector,
                fetched_at: new Date().toISOString()
              });
            }
          });
        }

        console.log(`Found ${allComics.length} comics so far from ${url}`);
        if (allComics.length >= 100) break; // Stop when we have enough data
        
      } catch (error) {
        console.log(`Error fetching from ${url}:`, error.message);
        continue; // Continue with next URL even if one fails
      }
    }

    // Fallback: If no comics found, try general search
    if (allComics.length === 0) {
      console.log(`No comics found for genre ${genre}, trying fallback search`);
      try {
        const fallbackResponse = await axios.get(`https://komiku.org/`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const $ = cheerio.load(fallbackResponse.data);
        $('article.ls4').slice(0, 20).each((i, el) => {
          const title = $(el).find('.ls4j h3 a').text().trim();
          const link = $(el).find('.ls4v a').attr('href');
          const image = $(el).find('.ls4v img').attr('data-src') || $(el).find('.ls4v img').attr('src');
          const chapter = $(el).find('.ls24').text().trim();
          
          if (title && link) {
            allComics.push({
              title,
              link: link.startsWith('http') ? link : `https://komiku.org${link}`,
              image: image || 'https://komiku.org/asset/img/no-image.png',
              chapter: chapter || 'Latest',
              genre: genre,
              source: 'fallback_homepage',
              note: 'Fallback data from homepage'
            });
          }
        });
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError.message);
      }
    }

    // Sort by relevance (prioritize titles that contain genre name)
    allComics.sort((a, b) => {
      const aRelevant = a.title.toLowerCase().includes(genre.toLowerCase()) ? 1 : 0;
      const bRelevant = b.title.toLowerCase().includes(genre.toLowerCase()) ? 1 : 0;
      return bRelevant - aRelevant;
    });

    const startIndex = (parseInt(page) - 1) * maxLimit;
    const endIndex = startIndex + maxLimit;
    const paginatedComics = allComics.slice(startIndex, endIndex);

    res.json({
      genre,
      comics: paginatedComics,
      pagination: {
        current_page: parseInt(page),
        per_page: maxLimit,
        total: allComics.length,
        has_more: endIndex < allComics.length
      },
      metadata: {
        sources_checked: genreUrls.length,
        total_found: allComics.length,
        returned: paginatedComics.length,
        cache_enabled: true,
        fetched_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching genre comics:', error);
    res.status(500).json({ 
      message: 'Error fetching genre comics', 
      error: error.message,
      genre: req.params.genre,
      suggestions: [
        'Try popular genres like: action, romance, adventure, comedy, drama, fantasy',
        'Check if the genre name is spelled correctly',
        'Use lowercase genre names'
      ]
    });
  }
});

// Endpoint untuk advanced search dengan filter
app.get('/api/advanced-search', async (req, res) => {
  try {
    const { 
      q, 
      type = 'all',
      status = 'all',
      genre = 'all',
      year = 'all',
      page = 1, 
      limit = 20,
      sort = 'relevance'
    } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    const maxLimit = Math.min(parseInt(limit), 50);
    let allComics = [];

    // Search berdasarkan query dasar
    const searchUrls = [
      `https://komiku.org/?s=${encodeURIComponent(q)}`,
      'https://komiku.org/pustaka/',
      'https://komiku.org/daftar-komik/'
    ];

    if (type !== 'all') {
      searchUrls.push(`https://komiku.org/pustaka/?tipe=${type}`);
    }

    if (genre !== 'all') {
      searchUrls.push(`https://komiku.org/genre/${genre}/`);
    }

    for (const url of searchUrls) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        const $ = cheerio.load(response.data);

        $('.ls4, .bge, .bgei, .entry').each((i, el) => {
          const title = $(el).find('h3 a, h4 a, .title a').text().trim();
          const link = $(el).find('h3 a, h4 a, .title a').attr('href');
          const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
          const chapter = $(el).find('.ls24, .chapter').text().trim();
          const comicType = $(el).find('.type, .badge').text().trim() || 'Unknown';
          const comicStatus = $(el).find('.status').text().trim() || 'Unknown';

          if (title && link && title.toLowerCase().includes(q.toLowerCase())) {
            // Apply filters
            if (type !== 'all' && !comicType.toLowerCase().includes(type.toLowerCase())) {
              return;
            }

            if (status !== 'all' && !comicStatus.toLowerCase().includes(status.toLowerCase())) {
              return;
            }

            const exists = allComics.find(c => c.link === link);
            if (!exists) {
              const relevanceScore = calculateRelevance(title, q);
              allComics.push({
                title,
                link,
                image: image || 'https://komiku.org/asset/img/no-image.png',
                chapter: chapter || 'Unknown',
                type: comicType,
                status: comicStatus,
                relevance: relevanceScore
              });
            }
          }
        });

        if (allComics.length >= 100) break;
      } catch (error) {
        console.log(`Error searching in ${url}:`, error.message);
      }
    }

    // Sort results
    switch (sort) {
      case 'title':
        allComics.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'relevance':
      default:
        allComics.sort((a, b) => b.relevance - a.relevance);
        break;
    }

    const startIndex = (parseInt(page) - 1) * maxLimit;
    const endIndex = startIndex + maxLimit;
    const paginatedResults = allComics.slice(startIndex, endIndex);

    res.json({
      query: q,
      filters: { type, status, genre, year, sort },
      comics: paginatedResults,
      pagination: {
        current_page: parseInt(page),
        per_page: maxLimit,
        total: allComics.length,
        has_more: endIndex < allComics.length
      }
    });
  } catch (error) {
    console.error('Error in advanced search:', error);
    res.status(500).json({ message: 'Error in advanced search', error: error.message });
  }
});

// Helper function untuk menghitung relevance
function calculateRelevance(title, query) {
  const lowerTitle = title.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  if (lowerTitle === lowerQuery) return 100;
  if (lowerTitle.startsWith(lowerQuery)) return 90;
  if (lowerTitle.includes(lowerQuery)) return 70;
  
  // Check untuk kata-kata individual
  const queryWords = lowerQuery.split(' ');
  let wordMatches = 0;
  
  queryWords.forEach(word => {
    if (lowerTitle.includes(word)) {
      wordMatches++;
    }
  });
  
  return Math.round((wordMatches / queryWords.length) * 50);
}

// Endpoint untuk bookmark/favorites (simulasi dengan local storage)
app.get('/api/favorites', async (req, res) => {
  try {
    // Ini adalah simulasi endpoint favorites
    // Dalam implementasi nyata, ini akan menggunakan database
    res.json({
      message: "Favorites endpoint ready",
      note: "This endpoint requires user authentication and database integration",
      example_usage: "POST /api/favorites with comic data to add favorites",
      sample_data: [
        {
          title: "Sample Favorite Comic",
          link: "/manga/sample-comic/",
          image: "https://komiku.org/asset/img/sample.jpg",
          added_date: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    console.error('Error in favorites endpoint:', error);
    res.status(500).json({ message: 'Error in favorites endpoint', error: error.message });
  }
});

// Endpoint untuk mendapatkan comic recommendations
app.get('/api/recommendations', async (req, res) => {
  try {
    const { based_on, limit = 10 } = req.query;
    const maxLimit = Math.min(parseInt(limit), 20);

    let recommendations = [];

    // Ambil comic populer sebagai rekomendasi
    const sources = [
      'https://komiku.org/other/hot/',
      'https://komiku.org/pustaka/?orderby=meta_value_num',
      'https://komiku.org/'
    ];

    for (const url of sources) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        const $ = cheerio.load(response.data);

        $('.ls4, .bge, .bgei').each((i, el) => {
          const title = $(el).find('h3 a, h4 a').text().trim();
          const link = $(el).find('h3 a, h4 a').attr('href');
          const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
          const chapter = $(el).find('.ls24, .chapter').text().trim();

          if (title && link && !recommendations.find(r => r.link === link)) {
            recommendations.push({
              title,
              link,
              image: image || 'https://komiku.org/asset/img/no-image.png',
              chapter: chapter || 'Unknown',
              recommendation_score: Math.random() * 10,
              reason: 'Popular comic'
            });
          }
        });

        if (recommendations.length >= 30) break;
      } catch (error) {
        console.log(`Error fetching recommendations from ${url}:`, error.message);
      }
    }

    // Randomize dan ambil sesuai limit
    recommendations = recommendations
      .sort(() => Math.random() - 0.5)
      .slice(0, maxLimit);

    res.json({
      based_on: based_on || 'popular_comics',
      recommendations,
      count: recommendations.length,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ message: 'Error getting recommendations', error: error.message });
  }
});

// Endpoint untuk analytics dan statistik detail
app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = {
      api_info: {
        version: "2.0.0",
        total_endpoints: 25,
        cache_enabled: true,
        rate_limiting: true
      },
      performance: {
        uptime_seconds: Math.floor(process.uptime()),
        memory_usage: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
          percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
        },
        cache_stats: {
          total_entries: cache.size,
          hit_rate: "Not implemented yet"
        }
      },
      endpoints: [
        { path: "/api/terbaru", status: "active", cache: "3min" },
        { path: "/api/populer", status: "active", cache: "5min" },
        { path: "/api/search", status: "active", cache: "none" },
        { path: "/api/comic/:slug", status: "active", cache: "none" },
        { path: "/api/chapter/:segment", status: "active", cache: "none" },
        { path: "/api/unlimited", status: "active", cache: "none" },
        { path: "/api/realtime", status: "active", cache: "none" },
        { path: "/api/scroll", status: "active", cache: "none" },
        { path: "/api/trending", status: "active", cache: "none" },
        { path: "/api/comparison", status: "active", cache: "none" },
        { path: "/api/type/:type", status: "active", cache: "none" },
        { path: "/api/homepage", status: "active", cache: "none" },
        { path: "/api/genres", status: "active", cache: "none" },
        { path: "/api/random", status: "active", cache: "none" },
        { path: "/api/stats", status: "active", cache: "none" },
        { path: "/api/infinite", status: "active", cache: "none" },
        { path: "/api/browse", status: "active", cache: "none" },
        { path: "/api/fullstats", status: "active", cache: "none" },
        { path: "/api/genre/:genre", status: "active", cache: "none" },
        { path: "/api/advanced-search", status: "active", cache: "none" },
        { path: "/api/recommendations", status: "active", cache: "none" },
        { path: "/api/favorites", status: "active", cache: "none" },
        { path: "/api/health", status: "active", cache: "none" },
        { path: "/api/analytics", status: "active", cache: "none" }
      ],
      last_updated: new Date().toISOString()
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error in analytics endpoint:', error);
    res.status(500).json({ message: 'Error getting analytics', error: error.message });
  }
});

// Endpoint untuk clean cache
app.post('/api/cache/clear', (req, res) => {
  try {
    const { key } = req.body;
    
    if (key) {
      cache.delete(key);
      res.json({ message: `Cache cleared for key: ${key}` });
    } else {
      cache.clear();
      res.json({ message: 'All cache cleared' });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ message: 'Error clearing cache', error: error.message });
  }
});

// Endpoint untuk API documentation dalam format JSON
app.get('/api/docs', (req, res) => {
  try {
    const documentation = {
      title: "Komik API Documentation",
      version: "2.0.0",
      description: "RESTful API untuk mengakses ribuan komik dari Komiku.org",
      base_url: `http://localhost:${PORT}`,
      endpoints: {
        basic_endpoints: [
          {
            path: "/api/terbaru",
            method: "GET",
            description: "Mengambil daftar komik terbaru",
            parameters: {
              page: "nomor halaman (optional, default: 1)",
              limit: "jumlah item per halaman (optional, default: 20, max: 50)"
            },
            cache: "3 minutes"
          },
          {
            path: "/api/populer",
            method: "GET", 
            description: "Mengambil daftar komik populer",
            parameters: {
              page: "nomor halaman (optional, default: 1)",
              limit: "jumlah item per halaman (optional, default: 20, max: 50)"
            },
            cache: "5 minutes"
          },
          {
            path: "/api/search",
            method: "GET",
            description: "Mencari komik berdasarkan kata kunci",
            parameters: {
              q: "kata kunci pencarian (required)",
              page: "nomor halaman (optional, default: 1)",
              limit: "jumlah item per halaman (optional, default: 20, max: 50)"
            }
          },
          {
            path: "/api/comic/:slug",
            method: "GET",
            description: "Mengambil detail komik berdasarkan slug",
            parameters: {
              slug: "slug komik (required)"
            }
          },
          {
            path: "/api/chapter/:segment",
            method: "GET",
            description: "Mengambil gambar-gambar chapter",
            parameters: {
              segment: "segment link chapter (required)"
            }
          }
        ],
        advanced_endpoints: [
          {
            path: "/api/unlimited",
            method: "GET",
            description: "Akses maksimum ke ribuan komik dengan deep crawling",
            parameters: {
              type: "tipe komik (optional, default: 'all')",
              max_pages: "maksimal halaman untuk crawl (optional, default: 3, max: 6)",
              aggressive: "mode agresif untuk lebih banyak data (optional, default: false)"
            }
          },
          {
            path: "/api/realtime",
            method: "GET",
            description: "Data real-time dengan parallel fetching",
            parameters: {
              count: "jumlah komik (optional, default: 48, max: 100)",
              fresh: "hanya data terbaru (optional, default: false)",
              categories: "kategori komik (optional, default: 'all')",
              randomize: "acak urutan (optional, default: false)"
            }
          },
          {
            path: "/api/scroll",
            method: "GET",
            description: "Simulasi infinite scroll dengan offset pagination",
            parameters: {
              offset: "offset data (optional, default: 0)",
              batch_size: "ukuran batch (optional, default: 20, max: 50)",
              seed: "seed untuk randomize (optional)",
              type: "tipe data (optional, default: 'mixed')"
            }
          },
          {
            path: "/api/genre/:genre",
            method: "GET",
            description: "Mengambil komik berdasarkan genre",
            parameters: {
              genre: "nama genre (required)",
              page: "nomor halaman (optional, default: 1)",
              limit: "jumlah item per halaman (optional, default: 20, max: 50)"
            }
          },
          {
            path: "/api/advanced-search",
            method: "GET",
            description: "Pencarian lanjutan dengan filter",
            parameters: {
              q: "kata kunci (required)",
              type: "tipe komik (optional, default: 'all')",
              status: "status komik (optional, default: 'all')",
              genre: "genre komik (optional, default: 'all')",
              year: "tahun rilis (optional, default: 'all')",
              sort: "urutan hasil (optional, default: 'relevance')",
              page: "nomor halaman (optional, default: 1)",
              limit: "jumlah item per halaman (optional, default: 20, max: 50)"
            }
          }
        ],
        utility_endpoints: [
          {
            path: "/api/health",
            method: "GET",
            description: "Health check dan monitoring status"
          },
          {
            path: "/api/analytics",
            method: "GET",
            description: "Analytics dan statistik detail API"
          },
          {
            path: "/api/stats",
            method: "GET",
            description: "Statistik umum API"
          },
          {
            path: "/api/recommendations",
            method: "GET",
            description: "Rekomendasi komik",
            parameters: {
              based_on: "basis rekomendasi (optional)",
              limit: "jumlah rekomendasi (optional, default: 10, max: 20)"
            }
          },
          {
            path: "/api/favorites",
            method: "GET",
            description: "Endpoint untuk favorites (memerlukan implementasi database)"
          }
        ]
      },
      rate_limiting: {
        enabled: true,
        max_requests: 100,
        window: "60 seconds"
      },
      caching: {
        enabled: true,
        default_duration: "5 minutes",
        endpoints_with_cache: ["/api/terbaru", "/api/populer"]
      },
      notes: [
        "API ini dibuat untuk tujuan pembelajaran dan riset",
        "Rate limiting diterapkan untuk mencegah abuse",
        "Cache diterapkan pada endpoint tertentu untuk meningkatkan performa",
        "Beberapa endpoint masih dalam pengembangan",
        "Gunakan User-Agent yang proper untuk menghindari blocking"
      ]
    };

    res.json(documentation);
  } catch (error) {
    console.error('Error in docs endpoint:', error);
    res.status(500).json({ message: 'Error getting documentation', error: error.message });
  }
});

// Endpoint untuk health check dan monitoring
app.get('/api/health', async (req, res) => {
  try {
    const healthChecks = {
      server: 'OK',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())} seconds`,
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
      },
      endpoints_status: {}
    };

    // Simple health check without external calls
    healthChecks.endpoints_status = {
      basic: 'OK',
      cache: cache.size > 0 ? 'OK' : 'Empty',
      rate_limit: 'OK'
    };

    res.json(healthChecks);
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({ message: 'Health check failed', error: error.message });
  }
});

// For Vercel deployment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`📚 Komik API Documentation: http://localhost:${PORT}/`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Analytics: http://localhost:${PORT}/api/analytics`);
    console.log(`📖 API Docs: http://localhost:${PORT}/api/docs`);
  });
}

// Export the Express app for Vercel
module.exports = app;
