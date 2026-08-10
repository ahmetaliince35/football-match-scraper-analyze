import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine

# 1. .env dosyasındaki değişkenleri yükle
load_dotenv()

# 2. DATABASE_URL'i çek
DATABASE_URL = "postgresql://postgres.gymllwbbwpzrlnbwuoau:Ahmetaliince.4207@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

if not DATABASE_URL:
    raise ValueError(".env dosyasında DATABASE_URL bulunamadı!")

# 3. SQLAlchemy motorunu başlat
engine = create_engine(DATABASE_URL)

# 4. CSV dosyaları ve Lig eşleşmeleri
csv_lig_haritasi = {
    "SuperLig.csv": "super_lig",
    "Premier_League.csv": "premier_league",
    "LaLiga.csv": "la_liga",
    "Serie-A.csv": "serie_a",
    "Lig-1.csv": "lig1_a"
}

tum_df_listesi = []

for csv_dosya, lig_kodu in csv_lig_haritasi.items():
    if os.path.exists(csv_dosya):
        df = pd.read_csv(csv_dosya)
        df['lig_code'] = lig_kodu  # Hangi lig olduğunu ayırt etmek için
        tum_df_listesi.append(df)
        print(f"Okundu: {csv_dosya}")
    else:
        print(f"Bulunamadı: {csv_dosya}")

if tum_df_listesi:
    birlesik_df = pd.concat(tum_df_listesi, ignore_index=True)

    print("\nSupabase'e aktarılıyor...")

    # Supabase'e TEK BIR 'matches' tablosu olarak aktarır
    birlesik_df.to_sql("matches", engine, if_exists='replace', index=False)

    print(f"\nİşlem Tamam! Toplam {len(birlesik_df)} satır 'matches' tablosuna aktarıldı.")