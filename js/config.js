/*

[{
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
}]

*/

const defaultTransformations = { rules: [], toLowerCase: false, toUpperCase: false }

const defaultOptions = {
  fieldsets: [{
    name: 'Google Exact Match',
    transformations: defaultTransformations,
    url: 'https://www.google.com/search?q="%s"',
  }, {
    name: 'Google AI Mode',
    transformations: defaultTransformations,
    url: 'https://www.google.com/search?q=%s&udm=50',
  }, {
    name: 'Google Images',
    transformations: defaultTransformations,
    url: 'https://www.google.com/search?q=%s&udm=2',
  }, {
    name: 'Google Maps',
    transformations: defaultTransformations,
    url: 'https://www.google.com/maps?q=%s',
  }, {
    name: '_separator_',
  }, {
    name: 'Wikipedia',
    transformations: defaultTransformations,
    url: 'https://wikipedia.org/w/index.php?search=%s',
  }, {
    name: 'Facebook',
    transformations: defaultTransformations,
    url: 'https://www.facebook.com/search?q=%s',
  }, {
    name: 'YouTube',
    transformations: defaultTransformations,
    url: 'https://www.youtube.com/results?search_query=%s',
  }, {
    name: 'TikTok',
    transformations: defaultTransformations,
    url: 'https://www.tiktok.com/search?q=%s',
  }, {
    name: '_separator_',
  }, {
    name: 'Yandex',
    transformations: defaultTransformations,
    url: 'https://ya.ru/search/?clid=15525262&text=%s',
  }, {
    name: 'Yandex Maps',
    transformations: defaultTransformations,
    url: 'https://ya.ru/maps/?clid=15525262&text=%s',
  }],
  openInBackground: false,
  addUtmSource: true,
}
