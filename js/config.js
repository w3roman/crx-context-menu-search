
const defaultFieldsets = {
  addUtmSource: true,
  fieldsets: [{
    name: 'Google Exact Match',
    url: 'https://www.google.com/search?q="%s"',
  }, {
    name: 'Google AI Mode',
    url: 'https://www.google.com/search?q=%s&udm=50',
  }, {
    name: 'Google Images',
    url: 'https://www.google.com/search?q=%s&udm=2',
  }, {
    name: 'Google Maps',
    url: 'https://www.google.com/maps?q=%s',
  }, {
    name: '_separator_',
  }, {
    name: 'Wikipedia',
    url: 'https://wikipedia.org/w/index.php?search=%s',
  }, {
    name: 'Facebook',
    url: 'https://www.facebook.com/search?q=%s',
  }, {
    name: 'YouTube',
    url: 'https://www.youtube.com/results?search_query=%s',
  }, {
    name: 'TikTok',
    url: 'https://www.tiktok.com/search?q=%s',
  }, {
    name: '_separator_',
  }, {
    name: 'Yandex',
    url: 'https://ya.ru/search/?clid=15525262&text=%s',
  }, {
    name: 'Yandex Maps',
    url: 'https://ya.ru/maps/?clid=15525262&text=%s',
  }, {
    name: 'Yandex Images by Image URL',
    url: 'https://ya.ru/images/search?clid=15525262&rpt=imageview&url=%s',
  }],
  openInBackground: false,
}

const defaultTransformations = { rules: [], toLowerCase: false, toUpperCase: false }
