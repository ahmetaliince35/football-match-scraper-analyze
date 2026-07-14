# Football Match Statistics Web Application

Bu proje, çeşitli futbol liglerine ait maç istatistiklerini görüntülemek amacıyla geliştirilmiş bir web uygulamasıdır.

Veriler belirli bir spor sitesinden alınarak işlenmiş ve kullanıcıların kolayca görüntüleyebileceği bir arayüz oluşturulmuştur.

## Özellikler

- Farklı liglerdeki maçları listeleme
- Takımlara göre filtreleme
- Maç istatistiklerini görüntüleme
- Grafiklerle verileri gösterme
- Backend API üzerinden verilere erişim

## Kullanılan Teknolojiler

### Frontend

- React
- Vite
- Tailwind CSS
- Recharts
- Axios

### Backend

- FastAPI
- Pandas

## Proje Yapısı

```
Frontend (React)
        │
        ▼
Backend API (FastAPI)
        │
        ▼
CSV Dosyaları (Maç Verileri)
```

## Çalıştırma

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Amaç

Bu proje, web geliştirme, API kullanımı ve veri görselleştirme konularında deneyim kazanmak amacıyla geliştirilmiştir.
