# Komik API

RESTful API Komik/Manga dari Komiku.org.

## 🌐 Interactive Documentation

**Website Documentation tersedia di:** `http://localhost:3001/`

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
    Server akan berjalan di `http://localhost:3001`.

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

### 5. Search Komik (dalam pengembangan)

Mencari komik berdasarkan kata kunci.

-   **URL:** `/api/search?q=keyword`
-   **Metode:** `GET`
-   **Status:** Dalam pengembangan (selector perlu diperbaiki)
-   **Parameter Query:**
    -   `q`: Kata kunci pencarian (wajib).
-   **Respons Sukses:** `200 OK`

    ```json
    [
      {
        "title": "Judul Komik",
        "link": "/manga/slug-komik/",
        "image": "https://thumbnail.komiku.org/uploads/image.jpg",
        "type": "Manga",
        "status": "Ongoing",
        "chapter": "Chapter 123",
        "relevance": 1
      }
      // ...
    ]
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

## Dependensi

Proyek ini menggunakan dependensi berikut:

-   `express`: Framework web untuk Node.js.
-   `axios`: Klien HTTP berbasis Promise untuk browser dan Node.js.
-   `cheerio`: Implementasi inti dari jQuery yang cepat, fleksibel, dan ramping yang dirancang untuk server.
-   `cors`: Middleware untuk mengaktifkan CORS.

## Catatan Penting

-   Scraping web dapat menjadi rapuh. Struktur HTML situs web sumber (`komiku.org`) dapat berubah sewaktu-waktu, yang dapat menyebabkan API ini berhenti berfungsi atau mengembalikan data yang tidak akurat. Pemeliharaan mungkin diperlukan jika situs web sumber diperbarui.

-   Beberapa endpoint masih dalam tahap pengembangan karena struktur HTML website yang kompleks dan menggunakan loading dinamis.

-   Project ini hanya dibuat untuk pembelajaran dan hiburan saja, kami tidak berniat untuk merugikan pihak manapun yang bersangkutan dan project ini dibuka secara open source, kami melarang untuk menjualbelikan source ini tanpa izin dari kami. 

