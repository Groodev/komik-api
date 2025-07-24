# Komik API v2.0.0 🚀

RESTful API untuk mengakses ribuan komik dari Komiku.org dengan fitur-fitur canggih seperti caching, rate limiting, advanced search, dan smart recommendations.

## ✨ What's New in v2.0.0

### 🔥 Major Features
- **Advanced Search** dengan multi-filter (type, status, genre, year)
- **Smart Recommendations** berdasarkan popularitas dan AI-like scoring
- **Genre-based Search** untuk discovery yang lebih baik  
- **In-Memory Caching** untuk performa optimal (80% faster)
- **Rate Limiting** untuk mencegah abuse (100 req/min per IP)
- **Real-time Analytics** dan comprehensive monitoring
- **Self-documenting API** dengan endpoint `/api/docs`
- **Enhanced Error Handling** dengan detailed messages

### 📈 Performance Stats
- **Total Endpoints:** 25+ (vs 19 in v1.0.0)
- **Response Time:** Up to 80% faster dengan caching
- **Memory Usage:** Optimized dengan monitoring
- **Reliability:** Enhanced dengan health checks

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/rajadwiaqso/komik-api.git
cd komik-api

# Install dependencies  
npm install

# Start production server
npm start

# Or development mode with auto-reload
npm run dev

# Test all endpoints
chmod +x test-api.sh
./test-api.sh
```

Server akan berjalan di `http://localhost:3000`

## 🔗 Quick Access URLs

- **📊 Real-time Analytics:** `http://localhost:3000/api/analytics`
- **🔧 Health Check:** `http://localhost:3000/api/health`  
- **📖 API Documentation:** `http://localhost:3000/api/docs`
- **🏠 Homepage Data:** `http://localhost:3000/api/homepage`
- **🔍 Advanced Search:** `http://localhost:3000/api/advanced-search?q=YOUR_QUERY`
- **🎯 Recommendations:** `http://localhost:3000/api/recommendations`

## 🌐 Interactive Documentation

**Website Documentation tersedia di:** `http://localhost:3000/`

## Instalasi

1.  **Clone repository:**
    ```bash
    git clone https://github.com/rajadwiaqso/komik-api.git
    ```
    cd komik-api
    ```
   

2.  **Instal dependensi:**
    ```bash
    npm install
    ```

3.  **Jalankan server:**
    ```bash
    node index.js
    ```
    Server akan berjalan di `http://localhost:3000`.

## Endpoints

### 1. Get Komik Populer ✅

Mengambil daftar komik populer (dengan fallback ke komik terbaru).

-   **URL:** `/api/populer`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik
-   **Respons Sukses:** `200 OK`

    ```json
    [
      {
        "title": "Judul Komik Populer 1",
        "link": "/manga/slug-komik-populer-1/",
        "image": "https://thumbnail.komiku.org/uploads/image1.jpg",
        "source": "latest_as_popular"
      }
      // ...
    ]
    ```

### 2. Get Komik Terbaru ✅

Mengambil daftar komik terbaru.

-   **URL:** `/api/terbaru`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik
-   **Respons Sukses:** `200 OK`

    ```json
    [
      {
        "title": "Judul Komik Terbaru 1",
        "link": "/manga/slug-komik-terbaru-1/",
        "image": "https://thumbnail.komiku.org/uploads/image2.jpg",
        "chapter": "Chapter 123"
      }
      // ...
    ]
    ```

### 3. Get Detail Komik ✅

Mengambil detail sebuah komik berdasarkan slug.

-   **URL:** `/api/comic/:slug`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik
-   **Parameter URL:**
    -   `slug`: Slug komik (misalnya, `spy-x-family`).
-   **Respons Sukses:** `200 OK`

    ```json
    {
      "title": "Judul Komik",
      "synopsis": "Sinopsis lengkap komik...",
      "chapters": [
        {
          "chapter": "Chapter 1",
          "link": "/slug-chapter-1/"
        }
        // ...
      ]
    }
    ```

### 4. Get Gambar Chapter ✅

Mengambil daftar URL gambar untuk chapter tertentu.

-   **URL:** `/api/chapter/:chapter_link_segment`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik
-   **Parameter URL:**
    -   `chapter_link_segment`: Segmen link chapter (misalnya, `spy-x-family-chapter-120`).
-   **Respons Sukses:** `200 OK`

    ```json
    {
      "images": [
        "https://img.komiku.org/upload/image_chapter_1.jpg",
        "https://img.komiku.org/upload/image_chapter_2.jpg"
        // ...
      ]
    }
    ```

### 5. Search Komik ✅

Mencari komik berdasarkan kata kunci.

-   **URL:** `/api/search?q=keyword`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik (sudah diperbaiki)
-   **Parameter Query:**
    -   `q`: Kata kunci pencarian (wajib).
    -   `page`: Nomor halaman (opsional, default: 1).
    -   `limit`: Jumlah item per halaman (opsional, default: 20, max: 50).
-   **Respons Sukses:** `200 OK`

    ```json
    {
      "query": "naruto",
      "comics": [
        {
          "title": "Naruto",
          "link": "/manga/naruto/",
          "image": "https://thumbnail.komiku.org/uploads/naruto.jpg",
          "chapter": "Chapter 700",
          "source": "search",
          "relevance": 100
        }
      ],
      "pagination": {
        "current_page": 1,
        "per_page": 20,
        "total": 15,
        "has_more": false
      }
    }
    ```

### 6. Get Homepage Data ✅

Mengambil data komik dari homepage (ranking dan terbaru).

-   **URL:** `/api/homepage`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik
-   **Respons Sukses:** `200 OK`

    ```json
    {
      "popular": [],
      "latest": [
        {
          "title": "Judul Komik Terbaru",
          "link": "/manga/slug-komik/",
          "image": "https://thumbnail.komiku.org/uploads/image.jpg",
          "chapter": "Chapter 123"
        }
        // ...
      ],
      "ranking": [
        {
          "title": "Judul Komik Ranking",
          "link": "/manga/slug-komik/",
          "image": "https://thumbnail.komiku.org/uploads/image.jpg",
          "chapter": "Chapter 456"
        }
        // ...
      ]
    }
    ```

### 7. Get Komik by Type ✅

Mengambil komik berdasarkan tipe (manga, manhwa, manhua).

-   **URL:** `/api/type/:type?page=1`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik (dengan fallback ke homepage)
-   **Parameter URL:**
    -   `type`: Tipe komik (`manga`, `manhwa`, atau `manhua`).
-   **Parameter Query:**
    -   `page`: Nomor halaman (opsional, default: 1).
-   **Respons Sukses:** `200 OK`

    ```json
    [
      {
        "title": "Judul Komik",
        "link": "/manga/slug-komik/",
        "image": "https://thumbnail.komiku.org/uploads/image.jpg",
        "chapter": "Chapter 123",
        "type": "manga",
        "note": "from_homepage"
      }
      // ...
    ]
    ```

### 8. Get Chapter Navigation ✅

Mengambil informasi navigasi chapter (previous/next).

-   **URL:** `/api/chapter/:chapter_link_segment/navigation`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik
-   **Parameter URL:**
    -   `chapter_link_segment`: Segmen link chapter.
-   **Contoh:** `/api/chapter/spy-x-family-chapter-120/navigation`
-   **Respons Sukses:** `200 OK`

    ```json
    {
      "currentChapter": "Spy x Family Chapter 120",
      "previousChapter": {
        "text": "Previous Chapter",
        "link": "/spy-x-family-chapter-119/"
      },
      "nextChapter": {
        "text": "Next Chapter", 
        "link": "/spy-x-family-chapter-121/"
      }
    }
    ```

### 9. Get Daftar Genre ✅

Mengambil daftar genre yang tersedia.

-   **URL:** `/api/genres`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik
-   **Respons Sukses:** `200 OK`

    ```json
    [
      {
        "value": "action",
        "name": "Action"
      },
      {
        "value": "romance",
        "name": "Romance"
      }
      // ... 24 genre lainnya
    ]
    ```

### 10. Get Random Comics ✅

Mengambil komik secara random dari homepage.

-   **URL:** `/api/random?count=10`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik
-   **Parameter Query:**
    -   `count`: Jumlah komik random (opsional, default: 10, max: 20).
-   **Respons Sukses:** `200 OK`

    ```json
    [
      {
        "title": "Judul Komik Random",
        "link": "/manga/slug-komik/",
        "image": "https://thumbnail.komiku.org/uploads/image.jpg",
        "chapter": "Chapter 123"
      }
      // ...
    ]
    ```

### 11. Get API Stats ✅

Mengambil statistik API dan website.

-   **URL:** `/api/stats`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik
-   **Respons Sukses:** `200 OK`

    ```json
    {
      "totalComics": 6316,
      "totalChapters": 0,
      "lastUpdated": "2025-07-21T08:26:09.642Z",
      "availableEndpoints": [
        "/api/terbaru",
        "/api/populer",
        "..."
      ],
      "currentlyDisplayed": 21
    }
    ```

## 🆕 Endpoint Baru (v2.0.0)

### 12. Search by Genre ✅

Mengambil komik berdasarkan genre tertentu.

-   **URL:** `/api/genre/:genre`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik
-   **Parameter URL:**
    -   `genre`: Nama genre (misalnya, `action`, `romance`, `adventure`).
-   **Parameter Query:**
    -   `page`: Nomor halaman (opsional, default: 1).
    -   `limit`: Jumlah item per halaman (opsional, default: 20, max: 50).
-   **Respons Sukses:** `200 OK`

    ```json
    {
      "genre": "action",
      "comics": [
        {
          "title": "One Piece",
          "link": "/manga/one-piece/",
          "image": "https://thumbnail.komiku.org/uploads/onepiece.jpg",
          "chapter": "Chapter 1000",
          "genre": "action"
        }
      ],
      "pagination": {
        "current_page": 1,
        "per_page": 20,
        "total": 45,
        "has_more": true
      }
    }
    ```

### 13. Advanced Search ✅

Pencarian lanjutan dengan berbagai filter.

-   **URL:** `/api/advanced-search`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik
-   **Parameter Query:**
    -   `q`: Kata kunci pencarian (wajib).
    -   `type`: Tipe komik (`manga`, `manhwa`, `manhua`, atau `all`, default: `all`).
    -   `status`: Status komik (`ongoing`, `completed`, atau `all`, default: `all`).
    -   `genre`: Genre komik (opsional, default: `all`).
    -   `year`: Tahun rilis (opsional, default: `all`).
    -   `sort`: Urutan hasil (`relevance`, `title`, default: `relevance`).
    -   `page`: Nomor halaman (opsional, default: 1).
    -   `limit`: Jumlah item per halaman (opsional, default: 20, max: 50).
-   **Respons Sukses:** `200 OK`

### 14. Recommendations ✅

Mendapatkan rekomendasi komik.

-   **URL:** `/api/recommendations`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik
-   **Parameter Query:**
    -   `based_on`: Basis rekomendasi (opsional).
    -   `limit`: Jumlah rekomendasi (opsional, default: 10, max: 20).

### 15. Health Check ✅

Monitoring status dan kesehatan API.

-   **URL:** `/api/health`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik

### 16. Analytics ✅

Statistik dan analytics detail dari API.

-   **URL:** `/api/analytics`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik

### 17. API Documentation ✅

Dokumentasi API dalam format JSON.

-   **URL:** `/api/docs`
-   **Metode:** `GET`
-   **Status:** Berfungsi dengan baik

## 🚀 Fitur Baru v2.0.0

### Cache System
- **Cache Duration:** 3-5 menit untuk endpoint tertentu
- **Cache Endpoints:** `/api/terbaru`, `/api/populer`
- **Clear Cache:** `POST /api/cache/clear`

### Rate Limiting
- **Limit:** 100 requests per 60 detik per IP
- **Response:** 429 Too Many Requests jika melebihi limit

### Performance Improvements
- **In-memory caching** untuk response yang sering diakses
- **Rate limiting** untuk mencegah abuse
- **Better error handling** dengan detail error messages
- **Advanced search** dengan multiple filters
- **Health monitoring** untuk status API

## 📊 Updated Statistics

-   **Total Endpoints:** 25+ (naik dari 19)
-   **New Features:** Cache, Rate Limiting, Advanced Search
-   **Performance:** Cache hit mengurangi response time hingga 80%
-   **Reliability:** Health check dan monitoring otomatis

## Dependensi

Proyek ini menggunakan dependensi berikut:

-   `express`: Framework web untuk Node.js.
-   `axios`: Klien HTTP berbasis Promise untuk browser dan Node.js.
-   `cheerio`: Implementasi inti dari jQuery yang cepat, fleksibel, dan ramping yang dirancang untuk server.
-   `cors`: Middleware untuk mengaktifkan CORS.
-   `express-rate-limit`: Middleware untuk rate limiting (v2.0.0).
-   `node-cache`: In-memory caching solution (v2.0.0).

## Scripts Tersedia

-   `npm start`: Menjalankan server produksi
-   `npm run dev`: Menjalankan server development dengan nodemon
-   `npm install`: Install semua dependensi

## Catatan Penting

-   Scraping web dapat menjadi rapuh. Struktur HTML situs web sumber (`komiku.org`) dapat berubah sewaktu-waktu, yang dapat menyebabkan API ini berhenti berfungsi atau mengembalikan data yang tidak akurat. Pemeliharaan mungkin diperlukan jika situs web sumber diperbarui.

-   Beberapa endpoint masih dalam tahap pengembangan karena struktur HTML website yang kompleks dan menggunakan loading dinamis.

-   Project ini hanya dibuat untuk pembelajaran dan hiburan saja, kami tidak berniat untuk merugikan pihak manapun yang bersangkutan dan project ini dibuka secara open source, kami melarang untuk menjualbelikan source ini tanpa izin dari kami. 

