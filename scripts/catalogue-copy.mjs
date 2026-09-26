import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
const root = path.resolve('artifacts/catalogue-import')
const source = JSON.parse(await readFile(path.join(root, 'prepared.json'), 'utf8'))
// Names retain the source colour, style and numbered fabric references.
// Descriptions are based on the supplied photographs, not unverified composition claims.
const copy = {
  1: ['Blue Aso Oke Detail T-Shirt', 'A sky-blue short-sleeve tee with a bold chest graphic and striped Aso Oke detailing at the hem. Pair it with dark shorts or relaxed trousers for an easy statement look.'],
  2: ['Cream Aso Oke Patch T-Shirt', 'A cream crew-neck tee brought to life by a diagonal panel of colourful woven stripes. The relaxed shape pairs naturally with denim or wide-leg trousers.'],
  3: ['Green Aso Oke Detail T-Shirt', 'A bright green tee with an I Love Lagos graphic and contrasting striped patch details. Wear it with simple dark bottoms to let the colour and playful accents stand out.'],
  4: ['Orange Aso Oke Patch T-Shirt', 'An orange short-sleeve tee finished with a striped chest patch in contrasting tones. A lively everyday piece to style with shorts, jeans or relaxed trousers.'],
  5: ['Blue Adire Bubu', 'Blue-and-white Adire stripes frame a bold blue front panel on this relaxed bubu. Its loose silhouette and short sleeves make it an expressive choice for effortless dressing.'],
  6: ['Purple Adire Bubu', 'A purple bubu with colourful motifs and contrasting patterned sleeves. The open, relaxed silhouette brings a cheerful mix of colour and print to your wardrobe.'],
  7: ['Orange Zip-Front Bubu', 'A full-length orange bubu with dark graphic motifs and a visible front zip detail. The long line and contrasting print make this a striking one-piece look.'],
  8: ['Blue Abstract Chiffon Bubu', 'A blue chiffon bubu patterned with flowing abstract marks. Draped fabric and a gathered front create a fluid silhouette with plenty of visual texture.'],
  9: ['Blue Motif Chiffon Bubu', 'Deep blue chiffon is scattered with pale circular motifs on this full-length bubu. The loose sleeves and softly gathered waist create an elegant, easy-going outline.'],
  10: ['Burgundy Chiffon Bubu', 'A burgundy chiffon bubu with repeating pale medallion motifs. Its flowing length and roomy sleeves make the print the centrepiece of the outfit.'],
  11: ['Grey Chiffon Bubu', 'Muted grey and warm neutral motifs bring a subtle richness to this chiffon bubu. A gathered front gives shape to the loose, flowing silhouette.'],
  12: ['Pink Multicolour Chiffon Bubu', 'A vivid pink neckline panel meets an expressive multicolour print on this long chiffon bubu. Wear with understated accessories to keep the bold colour combination in focus.'],
  13: ['Multicolour Chiffon Bubu', 'Warm gold, rust and dark patterned sections flow across this full-length chiffon bubu. Generous sleeves and a relaxed cut create a strong, fluid silhouette.'],
  14: ['Mustard Chiffon Bubu', 'Mustard and burgundy colour blocks are softened by large pale floral motifs. This long chiffon bubu combines a flowing shape with an eye-catching contrast of colour.'],
  15: ['Orange Leaf Chiffon Bubu', 'An orange chiffon bubu with dark leaf-like motifs and a long, flowing outline. The expressive print gives this easy one-piece style a confident finish.'],
  16: ['Orange Patterned Chiffon Bubu', 'Orange and dark abstract patterns cover this draped chiffon bubu. Gathered fabric at the front creates movement and shape without losing the relaxed silhouette.'],
  17: ['Purple Floral Chiffon Bubu', 'Purple tonal panels and floral motifs give this chiffon bubu a layered, expressive look. The flowing full-length silhouette works beautifully with simple accessories.'],
  18: ['Purple and Gold Chiffon Bubu', 'Gold spiral and star-like motifs stand out against a deep purple background. This full-length chiffon bubu makes a colourful statement with a loose, flowing shape.'],
  19: ['Red and Yellow Chiffon Bubu', 'A red chiffon bubu with bold yellow-and-white geometric accents. Its gathered front and broad sleeves create a striking, fluid shape.'],
  20: ['Red Chiffon Bubu', 'A red-and-dark patterned chiffon bubu with a shorter draped silhouette and gathered detail. Style with simple heels or sandals for a polished look.'],
  21: ['Yellow Chiffon Bubu', 'Bright yellow chiffon is covered with pale spiral motifs in this long bubu. The wide sleeves and flowing shape keep the overall look relaxed and expressive.'],
  22: ["Kids' Green Adire Dress", 'A green sleeveless dress with playful white motifs and a softly gathered shape. An expressive children’s style that pairs easily with sandals.'],
  23: ["Kids' Multicolour Adire Dress", 'A colourful sleeveless dress with pink, yellow and blue patterning and a gently gathered neckline. Its lively print brings a joyful finish to a simple silhouette.'],
  24: ["Kids' Navy and Pink Adire Dress", 'A navy patterned dress brightened by a bold pink bow at the waist. The sleeveless, straight shape gives the contrasting colour detail room to shine.'],
  25: ["Kids' Blue Bow Dress", 'A blue patterned sleeveless dress with a statement waist bow and a gathered skirt. A playful shape for celebrations and colourful everyday outfits.'],
  26: ["Kids' Blue Stripe Adire Dress", 'Blue-and-white stripes combine with yellow and green accents on this short dress. A contrasting patterned front band adds a distinctive finishing touch.'],
  68: ['Black Embroidered Adire Jacket', 'A black jacket decorated with bold red, green and gold embroidered shapes. Its collarless neckline and front opening let the expressive detailing take centre stage.'],
  69: ['Blue Beaded Adire Jacket', 'A deep blue jacket with colourful beaded motifs, fine lines and a collarless neckline. Wear it over a simple base to highlight the detailed front panels.'],
  70: ['Bright Blue Beaded Adire Jacket', 'A bright blue jacket with geometric beading and contrasting vertical details. The collarless front gives this statement piece a clean, structured look.'],
  71: ['Maroon Beaded Adire Jacket', 'A maroon jacket with delicate geometric lines and small contrasting beaded accents. Pair the clean, collarless silhouette with dark trousers for a coordinated finish.'],
  72: ['Maroon Embroidered Adire Jacket', 'Large multicolour embroidered shapes stand out across this maroon jacket. Its simple collarless shape provides a strong canvas for the expressive surface details.'],
  73: ['Abstract Print Jumpsuit', 'A short-sleeve jumpsuit with an energetic abstract print and contrasting vertical panels. The wide legs create a long, striking silhouette.'],
  74: ["Women's Green Print Jumpsuit", 'Green, white and dark patterned sections combine in this wide-leg jumpsuit. A simple neckline and short sleeves keep the colourful print in focus.'],
  75: ['Pink Kaftan Jumpsuit', 'A pink kaftan-style jumpsuit with oversized pale motifs and a flowing silhouette. Broad sleeves and generous draping give the piece an expressive, relaxed presence.'],
  76: ["Women's Multicolour Jumpsuit", 'A wide-leg jumpsuit with mixed blue-green motifs and contrasting patterned panels. The short sleeves and simple neckline balance the bold print.'],
  77: ['Black Lattice Adire Basket Kimono', 'A black-and-white lattice-patterned kimono with bright accents along the trim. Layer the open-front silhouette over a simple top and trousers.'],
  78: ['Blue Adire Kimono', 'A blue Adire kimono with contrasting stripes and graphic white motifs. Wide sleeves and an open front make it a striking layering piece.'],
  79: ['Multicolour Adire Kimono', 'A patchwork-style arrangement of bold colours and patterns defines this Adire kimono. Its roomy sleeves and open front work well over understated separates.'],
  80: ['Brown Akwete and Aso Oke Kimono', 'A brown kimono with colourful patterned panels through the front and sides. The wide sleeves and open silhouette showcase the contrasting Akwete and Aso Oke details.'],
  81: ['Purple Akwete and Aso Oke Kimono', 'Purple accents frame monochrome patterned panels on this wide-sleeve kimono. The open front adds an easy layer of colour and texture to simple outfits.'],
  82: ['Green and Pink Ankara Aso Oke Kimono', 'Bright green patterned panels meet bold pink borders on this open-front kimono. Its broad sleeves and contrasting trim create a cheerful statement layer.'],
  83: ['Blue Fringe Aso Oke Kimono', 'A vivid blue Aso Oke kimono with textured stripes and fringe at the sleeves and hem. The long, open-front shape lets the fabric and fringe take the spotlight.'],
  84: ['Magenta Aso Oke Kimono', 'Magenta striped panels form a clean, open-front kimono with wide short sleeves. Pair with a dark base for a simple outfit with a strong colour accent.'],
  85: ['Multicolour Damask Kimono', 'A multicolour damask kimono with contrasting patchwork-style panels and a bold front border. The relaxed open shape brings texture and colour to layered outfits.'],
  86: ['Pink Damask and Aso Oke Kimono', 'Pink-and-gold patterned panels are edged with bold striped borders on this kimono. Its wide sleeves and open front create an expressive occasion-ready layer.'],
  87: ['Blue Damask Kimono', 'Rich blue damask panels meet contrasting purple-and-gold striped borders. A wide-sleeve, open-front silhouette keeps the focus on the textured colour combination.'],
  88: ['Blue Linen Kimono', 'A tonal blue linen kimono with contrasting patterned panels and a long open front. Layer it over dark separates for a coordinated, understated look.'],
  89: ['Black Mikado Kimono', 'A black Mikado kimono with red floral motifs and bold red front and sleeve accents. The long silhouette makes a striking layer over simple separates.'],
  90: ['Green Mikado Kimono', 'A green Mikado kimono with tonal patterning and an open-front shape. Its loose sleeves and long line create an elegant layer with a rich colour finish.'],
  91: ["Men's Beige Face-Print Two-Piece Set", 'A beige two-piece set featuring a jacket-style top with bold face-inspired panels and red accents. Coordinating trousers complete the graphic, head-to-toe look.'],
  92: ["Men's Beige Two-Piece Set", 'A beige long-sleeve tunic and trouser set with contrasting striped detailing at the chest. The clean lines make this an easy coordinated outfit.'],
  93: ["Men's Beige V-Neck Two-Piece Set", 'A beige two-piece set with a contrasting V-neck trim and matching trousers. The long-sleeve top keeps the silhouette simple and composed.'],
  94: ["Men's Green Two-Piece Set", 'A green patterned short-sleeve shirt and trouser set with contrasting dark collar details. The coordinated print gives this outfit a confident, expressive finish.'],
  95: ["Men's Green and Yellow Two-Piece Set", 'Green-and-yellow patchwork-style patterning runs across a short-sleeve shirt and matching trousers. Wear the set together for a bold colour statement.'],
  96: ["Men's Grey Print Two-Piece Set", 'A grey long-sleeve top with patterned chest accents is paired with boldly printed trousers. The mix of plain and patterned sections gives the set a distinctive balance.'],
  97: ["Men's Purple Two-Piece Set", 'A purple short-sleeve top and matching trousers create a clean monochrome outfit. Subtle front detailing adds interest while keeping the colour in focus.'],
  98: ["Men's Teal Two-Piece Set", 'A teal short-sleeve shirt and trouser set with oversized pale motifs. The coordinated pattern makes a lively, confident head-to-toe look.'],
  99: ["Women's Green Chiffon Two-Piece Set", 'A green patterned chiffon top and wide-leg trouser set with contrasting dark and pale motifs. The flowing shapes create a coordinated outfit with plenty of movement.'],
  100: ["Women's Mustard Cotton Two-Piece Set", 'A mustard cotton two-piece set with bold contrasting floral and abstract panels. Its relaxed top and wide-leg trousers create an expressive coordinated look.'],
  101: ["Women's Maroon Soft Cotton Two-Piece Set", 'A maroon soft cotton top and wide-leg trouser set with an all-over small-scale print. The loose top and gathered waist create a relaxed, flowing outline.'],
}
const adire = {
  1: ['Indigo Diagonal', 'An indigo base with pale diagonal bands and a softly mottled tie-dye pattern.'],
  2: ['Indigo Fan', 'Deep indigo fabric crossed by a broad fan of pale blue-and-white bands.'],
  3: ['Blue Fan', 'A deep blue ground with a sweeping pale fan pattern across the folded fabric.'],
  4: ['Indigo Ripple', 'Pale rippling bands curve across a deep indigo background.'],
  5: ['Indigo Rings', 'Loose pale circular motifs appear across a rich indigo base.'],
  6: ['White and Indigo Stripe', 'Fine indigo bands form a repeated horizontal pattern on a pale background.'],
  7: ['Blue Diagonal Bands', 'A blue ground with diagonal pale bands and softly varied dye effects.'],
  8: ['Blue Radiating Bands', 'Indigo and pale blue radiating bands create a bold contrasting pattern.'],
  9: ['Multicolour Crackle', 'Muted blue, green and yellow tones meet a dark crackle-like pattern.'],
  10: ['Blue and Orange Abstract', 'Vivid blue and orange areas are layered with darker abstract marks.'],
  11: ['Blue Narrow Stripe', 'Alternating deep and pale blue bands form a textured stripe pattern.'],
  12: ['Purple and Blue Stripe', 'Broad purple and bright blue stripes create a strong colour-block effect.'],
  13: ['Magenta Square', 'Magenta squares are outlined by a bold pale lattice.'],
  14: ['Blue and Turquoise Block', 'Turquoise blocks stand out against a bright blue ground.'],
  15: ['Navy and White Block', 'Large pale blocks contrast with a dark navy background.'],
  16: ['Indigo Broad Stripe', 'Bold blue and indigo stripes feature softly irregular edges.'],
  17: ['Blue Wave', 'A bright blue wave-like band flows across a deep indigo base.'],
  18: ['Rust and Gold Block', 'Warm gold blocks create a bold repeat on a rust-coloured base.'],
  19: ['Indigo Circle', 'Textured blue circles repeat against a dark indigo ground.'],
  20: ['Black and White Stripe', 'Wide black and pale stripes create a crisp, graphic repeat.'],
}
const ankara = {
  3241: ['Black and Cream Geometry', 'Black geometric panels combine stripes, chevrons and angular motifs on a cream background.'],
  3242: ['Blue and Gold Stars', 'Gold stars and dark outlined shapes scatter across a vivid blue background.'],
  3243: ['Multicolour Waves', 'Rows of red, green and yellow wavy motifs repeat against a dark ground.'],
  3244: ['Bright Stripe', 'Bright yellow, blue and pink stripes stand out against a dark base.'],
  3246: ['Dark Blue Motif', 'Small pale blue circular and floral-like motifs run in narrow vertical rows.'],
  3247: ['Black and White Cross', 'Large pale cross-like motifs create a bold repeat on a black ground.'],
  3248: ['Yellow and Pink Chevron', 'Small yellow-and-pink chevron-like marks form a dense repeat over a dark ground.'],
  3249: ['Blue Geometric', 'Pale angular motifs run across contrasting dark and bright blue sections.'],
  3250: ['Gold Geometric Patchwork', 'Gold, orange, cream and dark geometric panels form a lively patchwork-style print.'],
  3251: ['Pink Geometric Patchwork', 'Pink accents brighten a patchwork-style arrangement of monochrome geometric panels.'],
  3253: ['Mint and Dark Green Geometry', 'Mint and dark green interlocking shapes create a bold repeated pattern.'],
  3254: ['Blue Linear Motif', 'Fine pale lines, dots and angular motifs are arranged over a deep blue base.'],
  3255: ['Monochrome Cross', 'A black-and-pale cross motif repeats across the fabric in a striking graphic arrangement.'],
  3256: ['Teal and Magenta Bands', 'Teal, magenta and pale geometric bands form a detailed repeated stripe pattern.'],
  3257: ['Royal Blue Geometry', 'White angular motifs and small dotted shapes create a strong contrast on royal blue.'],
  3258: ['Multicolour Motif Blocks', 'Blue, red, purple and green blocks are layered with pale graphic motifs.'],
  3259: ['Mustard Motif Stripe', 'Mustard panels combine small dark motifs with contrasting patterned stripes.'],
  3260: ['Multicolour Geometric Stripe', 'Teal and magenta geometric bands alternate with finely patterned dark stripes.'],
  3261: ['Green and Mint Repeat', 'Dark green and mint angular shapes create an eye-catching interlocking repeat.'],
  3262: ['Yellow and Green Blocks', 'Yellow, green, rust and dark panels are covered with contrasting pale motifs.'],
  3263: ['Pink Circular Motif', 'Large pale circular motifs stand out against a vivid pink background.'],
}
const uuid = value => { const h = createHash('sha256').update(value).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}` }
const slug = value => value.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const products = source.map(p => {
  let name, description, fabric = 'Adire', department = 'women', category = 'women-bubu', price = 45000, styleGroup = 'Bubu', style = '', sizes = ['S', 'M', 'L', 'XL'], unit = 'piece'
  if (p.folder.startsWith('Fabrics/')) {
    const isAdire = p.folder.endsWith('adire fabrics'), number = Number(path.basename(p.sourceKey).replace('IMG_', '')), details = (isAdire ? adire : ankara)[number]
    fabric = isAdire ? 'Adire' : 'Ankara'; name = `${fabric} Fabric ${String(number).padStart(2, '0')} - ${details[0]}`
    description = `${details[1]} A patterned fabric option for your next dressmaking or creative sewing project. Confirm your required length before ordering.`
    department = 'fabrics'; category = 'fabrics'; price = isAdire ? 12000 : 10000; styleGroup = ''; sizes = ['1 yard']; unit = 'yard'
  } else {
    ;[name, description] = copy[p.index]
    if (p.folder.includes('chiffon')) fabric = 'Chiffon'
    if (p.folder === 'Aso oke tshirt') { fabric = 'Aso Oke'; department = [1, 4].includes(p.index) ? 'men' : 'women'; category = department === 'men' ? 'men-t-shirts' : 'women-tops'; price = 25000; styleGroup = 'Shirts'; style = 'T-shirts' }
    if (p.folder === 'Childrens wear') { department = 'kids'; category = 'kids'; price = 20000; styleGroup = 'Dress'; sizes = ['2–3 years', '4–5 years', '6–7 years', '8–9 years'] }
    if (p.folder === 'Jacket') { department = 'men'; category = 'men-jackets'; price = 65000; styleGroup = 'Jacket'; style = name.includes('Beaded') ? 'Beaded jacket' : 'Adire jacket' }
    if (p.folder === 'Jumpsuit') { category = 'women-jumpsuits'; price = 50000; styleGroup = '' }
    if (p.folder.startsWith('Kimono/')) {
      category = 'women-kimono'; price = 55000; styleGroup = 'Jacket'; style = 'Kimono'
      fabric = p.folder.includes('akwete') ? 'Akwete / Aso Oke' : p.folder.includes('ankara') ? 'Ankara / Aso Oke' : p.folder.includes('aso oke') ? 'Aso Oke' : p.folder.includes('damask') ? 'Damask' : p.folder.includes('linen') ? 'Linen' : p.folder.includes('micado') ? 'Mikado' : 'Adire'
    }
    if (p.folder === 'Male 2 piece') { department = 'men'; category = 'men-two-piece'; price = 60000; styleGroup = 'Sets'; style = 'Men’s Adire 2 piece'; unit = 'set' }
    if (p.folder === 'Womens 2 piece') { category = 'women-two-piece'; price = 55000; styleGroup = 'Sets'; style = ''; unit = 'set'; fabric = p.index === 99 ? 'Chiffon' : 'Cotton' }
  }
  const hash = createHash('sha256').update(p.sourceKey).digest('hex').slice(0, 10)
  return { ...p, id: uuid('adire-kaldoni:' + p.sourceKey), legacy_id: 'kaldoni:' + p.sourceKey, sku: 'AT-KAL-' + hash.toUpperCase(), name, slug: slug(name), description, fabric, department, category, price, currency: 'NGN', status: 'published', styleGroup, style, sizes, unit, demoStockPerSize: 5,
    images: p.prepared.map((file, i) => ({ local: file, storage: `kaldoni/${hash}/${p.hashes[i].slice(0, 16)}.webp`, id: uuid('adire-kaldoni-image:' + p.files[i]), alt: `${name} — ${i ? 'alternate view' : 'front view'}`, sort_order: i })) }
})
if (new Set(products.map(p => p.slug)).size !== products.length) throw Error('Duplicate product slugs')
await writeFile(path.join(root, 'products.json'), JSON.stringify(products, null, 2))
const quote = value => `"${String(value).replaceAll('"', '""')}"`
await writeFile(path.join(root, 'products.csv'), ['Name,Category,Price,Currency,Sample sizes,Sample units per size,Source,Description', ...products.map(p => [p.name, p.category, p.price, p.currency, p.sizes.join(' / '), p.demoStockPerSize, p.files.join(' | '), p.description].map(quote).join(','))].join('\n'))
console.log(JSON.stringify({ count: products.length, images: products.reduce((n, p) => n + p.images.length, 0), priceRange: [Math.min(...products.map(p => p.price)), Math.max(...products.map(p => p.price))], departments: products.reduce((m, p) => { m[p.department] = (m[p.department] || 0) + 1; return m }, {}) }, null, 2))
