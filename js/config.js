const defaultOptions = {
  fieldsets: [{
    enabled: true,
    name: 'Google Exact Match',
    url: 'https://www.google.com/search?q="%s"',
  }, {
    enabled: true,
    name: 'Google AI Mode',
    url: 'https://www.google.com/search?q=%s&udm=50',
  }, {
    enabled: true,
    name: 'Google Images',
    url: 'https://www.google.com/search?q=%s&udm=2',
  }, {
    enabled: true,
    name: 'Google Maps',
    url: 'https://www.google.com/maps?q=%s',
  }, {
    name: '_separator_',
  }, {
    enabled: true,
    name: 'Wikipedia',
    url: 'https://wikipedia.org/w/index.php?search=%s',
  }, {
    enabled: true,
    name: 'Facebook',
    url: 'https://www.facebook.com/search?q=%s',
  }, {
    enabled: true,
    name: 'YouTube',
    url: 'https://www.youtube.com/results?search_query=%s',
  }, {
    enabled: true,
    name: 'TikTok',
    url: 'https://www.tiktok.com/search?q=%s',
  }, {
    name: '_separator_',
  }, {
    enabled: true,
    name: 'Yandex',
    url: 'https://ya.ru/search/?clid=15525262&text=%s',
  }, {
    enabled: true,
    name: 'Yandex Maps',
    url: 'https://ya.ru/maps/?clid=15525262&text=%s',
  }, {
    enabled: true,
    name: 'Yandex Images by Image URL',
    url: 'https://ya.ru/images/search?clid=15525262&rpt=imageview&url=%s',
  }],
  openInBackground: false,
  addUtmSource: true,
}

const defaultTransformations = { rules: [], toLowerCase: false, toUpperCase: false }
