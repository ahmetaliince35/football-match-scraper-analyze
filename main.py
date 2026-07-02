import json
from playwright.sync_api import sync_playwright
import os
import csv
with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)

    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )

    page = context.new_page()

    # Görselleri kapat (Hız için)
    page.route("**/*.{png,jpg,jpeg,gif,webp,svg}", lambda route: route.abort())

    print("Ana sayfa yükleniyor...")
    page.goto("https://www.flashscore.com.tr/futbol/turkiye/super-lig/sonuclar/")

    page.wait_for_load_state("domcontentloaded",timeout=15000)
    page.wait_for_timeout(1500)

    print("\nDoğrudan Maç Linklerini Toplama Başladı...")

    urls = []
    sayac = 0

    while True:
        # 🔥 Taktik: Her maç satırının tıklanabilir link elementini (a etiketi) yakalıyoruz.
        # Flashscore ana sayfasında maçların üzerine gitmeni sağlayan linkler genelde bu class'ı taşır.
        match_links = page.locator("a.eventRowLink").all()
        for link in match_links:
            href = link.get_attribute("href")

            if not href:
                continue

            if href.startswith("/"):
                href = "https://www.flashscore.com.tr" + href

            mid = ""

            if "?mid=" in href:
                mid = href.split("?mid=")[1]
                href = href.split("?mid=")[0]

            href = href.rstrip("/")

            stat_url = href + "/ozet/istatistik/genel"

            if mid:
                stat_url += f"?mid={mid}"

            if stat_url not in urls:
                urls.append(stat_url)

        print(f"Şu ana kadar toplanan link sayısı: {len(urls)}")

        # 2. Sayfayı Aşağı Kaydır
        page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
        page.wait_for_timeout(2000)

        # 3. "Daha Fazla Maç Göster" Butonu Kontrolü
        button = page.locator('[data-testid="wcl-buttonLink"], .event__more')

        if button.count() > 0:
            try:
                sayac += 1
                print(f"-> {sayac}. kez daha fazla maç yükleniyor...")

                btn = button.first
                btn.scroll_into_view_if_needed()
                page.wait_for_timeout(1000)

                page.evaluate("""
                              const b = document.querySelector('[data-testid="wcl-buttonLink"]') || document.querySelector('.event__more');
                              if (b) b.click();
                              """)

                page.wait_for_timeout(3000)
            except Exception:
                print("Buton tıklanamadı veya bitti, çıkılıyor...")
                break
        else:
            print("Daha fazla göster butonu yok → Tüm liste yüklendi.")
            break

    print(f"\nToplam toplanan kesin link sayısı: {len(urls)}")
    csv_file = "matches.csv"

    header_written = os.path.exists(csv_file) and os.path.getsize(csv_file) > 0

    # İlk 5 maçın detayına gidip istatistikleri çekiyoruz
    for url in urls:
        print(f"\nGidiliyor: {url}")

        try:
            page.goto(url)

            page.wait_for_load_state("domcontentloaded", timeout=15000)
            page.wait_for_timeout(1500)

            home_team, away_team = "Bilinmiyor", "Bilinmiyor"
            score_home, score_away = "-", "-"
            iy_score = "Veri Yok"

            try:
                # Detay sayfasındaki takım isimleri
                if page.locator(".participant__participantName").count() >= 2:
                    home_team = page.locator(".participant__participantName").nth(0).text_content().strip()
                    away_team = page.locator(".participant__participantName").nth(2).text_content().strip()
                    print(home_team, away_team)
                # Skorlar
                score_wrapper = page.locator(".detailScore__wrapper")
                if score_wrapper.count() > 0:
                    raw_score = score_wrapper.text_content().strip()
                    print(raw_score)
                    score_digits = [char for char in raw_score if char.isdigit()]
                    if len(score_digits) >= 2:
                        score_home = score_digits[0]
                        score_away = score_digits[1]

                # İlk Yarı Skoru
                iy_element = page.locator(".smv__commentary--period, .detailScore__period")
                if iy_element.count() > 0:
                    iy_score = iy_element.first.text_content().strip()
            except Exception as e:
                print(f"[!] Takım/Skor bilgisi okunamadı: {e}")
            match_date = page.locator(".duelParticipant__startTime > div").text_content().strip()
            # İstatistikleri Çekme
            cats = page.locator('[data-testid="wcl-statistics-category"]').all_text_contents()
            vals = page.locator('[data-testid="wcl-statistics-value"]').all_text_contents()

            final_data = {
                "match_info": {
                    "home_team": home_team,
                    "away_team": away_team,
                    "ms_score": f"{score_home}-{score_away}",
                    "iy_score": iy_score,
                    "url": page.url
                },
                "statistics": {}
            }

            stats = {}

            if len(cats) > 0 and len(vals) == len(cats) * 2:
                for i in range(len(cats)):
                    stats[cats[i]] = {
                        "home": vals[i * 2],
                        "away": vals[i * 2 + 1]
                    }


            def to_int(x):
                try:
                    return int(x.replace("%", "").strip())
                except:
                    return 0


            # Toplam goller
            home_goals = to_int(score_home)
            away_goals = to_int(score_away)
            total_goals = home_goals + away_goals
            karsilikli_gol= "var" if(home_goals>=1 and away_goals >=1) else "yok"
            # Karşılıklı gol
            offside = (
                    to_int(stats.get("Ofsayt", {}).get("home", "0")) +
                    to_int(stats.get("Ofsayt", {}).get("away", "0"))
            )

            # Sarı kart
            yellow_cards = (
                    to_int(stats.get("Sarı kart", {}).get("home", "0")) +
                    to_int(stats.get("Sarı kart", {}).get("away", "0"))
            )

            # Kırmızı kart
            red_cards = (
                    to_int(stats.get("Kırmızı kart", {}).get("home", "0")) +
                    to_int(stats.get("Kırmızı kart", {}).get("away", "0"))
            )

            # Korner
            corners = (
                    to_int(stats.get("Kornerler", {}).get("home", "0")) +
                    to_int(stats.get("Kornerler", {}).get("away", "0"))
            )

            # Kafa golü (Özet sayfasından çekilecek)

            events = page.locator(".smv__incident").all_text_contents()



            final_data = {
                "match_info": {
                    "home_team": home_team,
                    "away_team": away_team,
                    "ms_score": f"{home_goals}-{away_goals}",
                    "iy_score": iy_score,
                    "url": page.url
                },

                "features": {
                    "match-date":match_date,
                    "home_team": home_team,
                    "away_team": away_team,

                    "home_goals": home_goals,
                    "away_goals": away_goals,

                    "winner": (
                        home_team if home_goals > away_goals
                        else away_team if away_goals > home_goals
                        else "Beraberlik"
                    ),
                    "total_goals": total_goals,
                    "ofsayt": offside,
                    "yellow_cards": yellow_cards,
                    "red_cards": red_cards,
                    "total_corners": corners,
                    "karsilikligol": karsilikli_gol,
                    "over_0_5": "Üst" if(total_goals >= 1) else "Alt",
                    "over_1_5": "Üst" if(total_goals >= 2) else "Alt",
                    "over_2_5": "Üst" if(total_goals >= 3) else "Alt",
                    "over_3_5": "Üst" if(total_goals >= 4) else "Alt",
                    "over_4_5": "Üst" if(total_goals >= 5) else "Alt"
                },

                "statistics": stats
            }
            features = final_data["features"]

            with open(csv_file, "a", newline="", encoding="utf-8-sig") as f:
                writer = csv.DictWriter(f, fieldnames=features.keys())

                if not header_written:
                    writer.writeheader()
                    header_written = True

                writer.writerow(features)
            print(json.dumps(final_data["features"], indent=4, ensure_ascii=False))
        except Exception as e:
            print(f"Maç sayfasına gidilirken hata oluştu: {e}")

        print("-" * 50)

    browser.close()