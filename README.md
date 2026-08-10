# ⚽ Football Match Scraper & Analyzer

**Football Match Scraper & Analyzer**, futbol maç verilerini otomatik olarak toplayan, işleyen ve kullanıcıya interaktif istatistikler halinde sunan full-stack bir web uygulamasıdır.

> 🕷️ **Web Scraping** → 🗄️ **PostgreSQL** → ⚡ **FastAPI** → ⚛️ **React**

## 🚀 Özellikler

* 🏆 Birden fazla lig desteği
* 📅 Sezon ve takım bazlı filtreleme
* ⚽ Detaylı maç istatistikleri
* 📊 İnteraktif veri görselleştirme
* 🔎 Maç filtreleme ve arama
* 🟨 Sarı / 🟥 kırmızı kart istatistikleri
* 🚩 Korner ve ofsayt istatistikleri
* 🤝 Karşılıklı gol analizi
* 🌐 REST API

## 🛠️ Kullanılan Teknolojiler

**Backend**

* Python
* FastAPI
* Playwright
* PostgreSQL
* Pandas
* SQLAlchemy

**Frontend**

* React
* Vite
* Tailwind CSS
* Recharts
* React Router

## 🏗️ Proje Mimarisi

```text
Futbol Veri Kaynağı
       ↓
Playwright Web Scraper
       ↓
PostgreSQL Veritabanı
       ↓
FastAPI REST API
       ↓
React + Vite
       ↓
İnteraktif İstatistik Paneli
```

## 📁 Proje Yapısı

```text
├── backend/
│   ├── main.py          # Web scraping
│   ├── backendmain.py   # FastAPI API
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   └── package.json
│
└── README.md
```

## ⚡ Kurulum

### Backend

```bash
cd backend
pip install -r requirements.txt
playwright install
uvicorn backendmain:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🎯 Proje Hakkında

Bu proje; **web scraping, veri işleme, REST API geliştirme, veritabanı yönetimi ve modern web teknolojileri** kullanılarak futbol verilerinin analiz edilebilmesi amacıyla geliştirilmiştir.

---

**Python 🐍 • React ⚛️ • FastAPI ⚡ • PostgreSQL 🗄️**
