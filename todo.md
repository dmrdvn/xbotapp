# Twitter Bot Güvenli Kullanım Notları

## Twitter Rate Limitleri ve Spam Önlemleri

### Minimum Zaman Aralıkları
- İdeal minimum paylaşım aralığı: 30-60 dakika
- Güvenli minimum paylaşım aralığı: 2 saat
- ⚠️ 30 dakikadan sık paylaşımlar spam riski oluşturur

### Günlük Tweet Limitleri
- Güvenli günlük tweet sayısı: 15-20 tweet
- Maksimum önerilen limit: 25 tweet/gün
- Not: Limitler hesap yaşına ve güvenilirliğine göre değişebilir

### Aktif Saatler Önerileri
- Optimal aktif saat aralığı: 8-10 saat
- Örnek zaman dilimi: 09:00 - 19:00
- Güvenli senaryo: Her 2 saatte bir tweet (~10 tweet/gün)
- Makul senaryo: Her 1 saatte bir tweet (~15 tweet/gün)

### En İyi Pratikler
1. Gece yarısı tweet atmaktan kaçınılmalı (bot algısı yaratır)
2. Tweet aralıkları tam saat başı yerine +/- 15 dk random olmalı
3. Yeni hesaplarda (3 aydan küçük) daha düşük limitler kullanılmalı
4. Etkileşim oranı düşük olan hesaplarda limitler azaltılmalı

## Mevcut Cron Yapılandırması
```json
{
  "crons": [
    {
      "path": "/api/cron/content-generator",
      "schedule": "0 0 * * *"     // Her gün gece yarısı içerik üretimi
    },
    {
      "path": "/api/cron/queue-manager",
      "schedule": "0 * * * *"     // Her saat başı kuyruk yönetimi
    },
    {
      "path": "/api/cron/tweet-publisher",
      "schedule": "0 * * * *"     // Her saat başı tweet kontrolü
    }
  ]
}
```

## Gelecek Güncellemeler İçin Öneriler
- [ ] Tweet aralıklarına random offset eklenebilir
- [ ] Hesap yaşına göre dinamik limit ayarlaması eklenebilir
- [ ] Etkileşim oranına göre otomatik limit ayarlaması eklenebilir
- [ ] Aktif saatler profil bazlı özelleştirilebilir
- [ ] Vercel Pro'ya geçilirse 30dk aralıklı kontrol eklenebilir

