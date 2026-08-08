import json
from time import sleep
import random
from playwright.sync_api import sync_playwright
import os
import csv

def writeToCSV(csv_file,matchSummary):
      try:
          header_written = os.path.exists(csv_file) and os.path.getsize(csv_file) > 0
          with open(csv_file, "a", newline="", encoding="utf-8-sig") as f:
              writer = csv.DictWriter(f, fieldnames=matchSummary.keys())

              if not header_written:
                  writer.writeheader()
                  header_written = True

              writer.writerow(matchSummary)
      except Exception as e:
          print("CSV' ye yazılırken hata oluştu.Hata:",e)


def getMatchStatictics(matchURL,page):
    print(f"\nGidiliyor: {matchURL}")
    matchStatistics={}
    try:

        import random

        for i in range(5):
            try:
                page.goto(
                    matchURL,
                    wait_until="domcontentloaded",
                    timeout=60000
                )

                page.wait_for_selector(
                    ".participant__participantName",
                    timeout=10000
                )

                page.wait_for_selector(
                    '[data-testid="wcl-statistics-category"]',
                    timeout=10000
                )

                break

            except Exception:

                if i == 4:
                    raise

                page.wait_for_timeout(random.randint(3000, 7000))

        home_team, away_team = "Bilinmiyor", "Bilinmiyor"
        score_home, score_away = "-", "-"

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
        if len(cats) == 0:
            raise Exception("İstatistik yüklenmedi")
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
        kafagolu=(
                to_int(stats.get("Kafa golleri", {}).get("home", "0")) +
                to_int(stats.get("Kafa golleri", {}).get("away", "0"))
        )
        matchStatistics = {
            "Maç Tarihi": match_date,
            "Ev Sahibi Takım": home_team,
            "Deplasman Takım": away_team,

            "Ev Sahibi Gol": home_goals,
            "Deplasman Gol": away_goals,

            "Kazanan": (
                home_team if home_goals > away_goals
                else away_team if away_goals > home_goals
                else "Beraberlik"
            ),
            "Toplam Gol": total_goals,
            "ofsayt": offside,
            "Sarı Kart": yellow_cards,
            "Kırmızı Kart": red_cards,
            "Toplam Korner": corners,
            "Karşılıklı Gol":  "Var" if (home_goals >= 1 and away_goals >= 1) else "Yok",
            "Kafa Golü": "Var" if(kafagolu)!=0 else "Yok"
        }
    except Exception as e:
        print(f"[-] Fonksiyon genelinde bir hata oluştu: {e}")
    return matchStatistics

def getMatchListURL(seazonUrl, page):

    print(f"İşleniyor: {seazonUrl}")
    page.goto(seazonUrl, wait_until="domcontentloaded", timeout=60000)
    # 🔥 YENİ EKLENTİ: Sadece son maçları değil, TÜM sezon maçlarını açmak için filtreye tıklatıyoruz
    try:
        # "Tüm maçları göster" veya "Show all matches" yazan filtre butonunu arar
        all_matches_filter = page.locator(
            "a:has-text('Tüm maçları göster'), a:has-text('Show all matches'), .results__showAll")
        if all_matches_filter.count() > 0:
            print("[+] 'Tüm maçları göster' filtresi aktif ediliyor...")
            all_matches_filter.first.click()
            page.wait_for_timeout(2000)  # Listenin genişlemesi için ufak bir mola
    except Exception as filter_err:
        print("[-] Tüm maçları göster filtresine tıklanamadı (Belki de zaten açık):", filter_err)
    # 🔥 FIX 1: Sayfadaki ilk maç linki yüklenene kadar KESİN OLARAK BEKLE (Boş dönmesini engeller)
    try:
        page.wait_for_selector("a.eventRowLink", timeout=60000)
    except Exception:
        print("[!] Bu sayfada hiç maç bulunamadı veya sayfa yüklenemedi.")
        return []

    matchListURL = []
    sayac = 0

    while True:
        # O an sayfada kaç tane maç linki olduğunu sayıyoruz
        eski_mac_sayisi = page.locator("a.eventRowLink").count()

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

            if stat_url not in matchListURL:
                matchListURL.append(stat_url)

        print(f"Şu ana kadar toplanan link sayısı: {len(matchListURL)}")

        # Sayfayı Aşağı Kaydır
        page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
        page.wait_for_timeout(1000)

        # "Daha Fazla Maç Göster" Butonu Kontrolü
        button = page.locator('[data-testid="wcl-buttonLink"], .event__more')

        if button.count() > 0:
            try:
                sayac += 1
                print(f"-> {sayac}. kez daha fazla maç yükleniyor...")
                btn = button.first
                btn.scroll_into_view_if_needed()
                page.wait_for_timeout(500)

                button.first.click(force=True)
                # 🔥 FIX 2: Sabit 3 saniye beklemek yerine, yeni maçlar HTML'e düşene kadar dinamik olarak bekle!
                # Maksimum 8 saniye boyunca yeni elementlerin gelmesini gözler, gelirse anında devam eder.
                try:
                    page.wait_for_function(
                        f"document.querySelectorAll('a.eventRowLink').length > {eski_mac_sayisi}",
                        timeout=20000
                    )
                except Exception:
                    yeni_sayi = page.locator("a.eventRowLink").count()

                    if yeni_sayi == eski_mac_sayisi:

                        page.wait_for_timeout(3000)

                        try:
                            button.first.click(force=True)

                            page.wait_for_function(
                                f"document.querySelectorAll('a.eventRowLink').length>{eski_mac_sayisi}",
                                timeout=20000
                            )

                        except:
                            break

            except Exception:
                print("Buton tıklanamadı veya bitti, çıkılıyor...")
                break
        else:
            print("Daha fazla göster butonu yok → Tüm liste yüklendi.")
            break

    print(f"\nToplam toplanan kesin link sayısı: {len(matchListURL)}")
    return matchListURL


def getSeazonURL(page,LigUrl):
    seazonURLs = []
    try:
        print("Ana sayfa yükleniyor...")
        page.goto(LigUrl)

        page.wait_for_load_state("domcontentloaded", timeout=60000)
        page.wait_for_timeout(1500)
        season_links = page.locator("a.archiveTable__column--link").all()

        for link in season_links:
            href = link.get_attribute("href")
            if href.startswith("/"):
                href = "https://www.flashscore.com.tr" + href
            seazonURLs.append(href + "sonuclar/")
        print(seazonURLs)
    except Exception as e:
        print("Nedenini bilmediğimiz hata oluştu. Hata kodu ",e)
    return seazonURLs

def main():
    LigList=["https://www.flashscore.com.tr/futbol/ingiltere/premier-league/arsiv/",
             "https://www.flashscore.com.tr/futbol/turkiye/super-li-g/arsiv/",
             "https://www.flashscore.com.tr/futbol/ispanya/laliga/arsiv/",
             "https://www.flashscore.com.tr/futbol/fransa/lig-1/arsiv/",
             "https://www.flashscore.com.tr/futbol/almanya/bundesliga/arsiv/",
             "https://www.flashscore.com.tr/futbol/italya/serie-a/arsiv/"]
    csv_files = ["Premier_League.csv",
                 "SuperLig.csv",
                 "LaLiga.csv",
                 "Lig-1.csv",
                 "BundesLiga.csv",
                 "Serie-A.csv"]
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            for Lig,csv_file in zip(LigList,csv_files):
                page = context.new_page()
                page.route("**/*.{png,jpg,jpeg,gif,webp,svg}", lambda route: route.abort())
                seazonsUrl=getSeazonURL(page,Lig)
                for seazonUrl in seazonsUrl[1:13]:
                    matchListURL=getMatchListURL(seazonUrl,page)
                    for matchURL in matchListURL:
                        match=getMatchStatictics(matchURL,page)
                        print(json.dumps(match, indent=4, ensure_ascii=False))
                        writeToCSV(csv_file,match)
                        print("-"*50)
                        sleep(random.uniform(2.5, 5.5))
            browser.close()
    except Exception as e:
        print("Nedenini bilmediğimiz bir hata oluştu. Hata kodu ",e)
if __name__ == "__main__":
    main()