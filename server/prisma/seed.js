import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const cats = [['smartphones','Телефоны'],['laptops','Ноутбуки'],['computers','Компьютеры'],['tablets','Планшеты'],['monitors','Мониторы'],['accessories','Аксессуары'],['gaming','Игровая техника']]
for (const [i,[slug,name]] of cats.entries()) await prisma.category.upsert({ where:{slug}, update:{}, create:{slug,name,image:`/images/${slug}-1.svg`,sortOrder:i} })

// [категория, бренд, модель, цена (сом), старая цена, остаток, популярность, характеристики]
const P = [
['smartphones','Samsung','Galaxy S24',74990,84990,25,95,{'ОЗУ':'8 ГБ','Память':'256 ГБ','Экран':'6.2"'}],
['smartphones','Apple','iPhone 15',89990,null,12,100,{'ОЗУ':'6 ГБ','Память':'128 ГБ','Экран':'6.1"'}],
['smartphones','Xiaomi','Redmi Note 13',22990,26990,40,80,{'ОЗУ':'8 ГБ','Память':'256 ГБ','Экран':'6.67"'}],
['smartphones','Honor','X8b',17990,null,30,55,{'ОЗУ':'8 ГБ','Память':'128 ГБ','Экран':'6.7"'}],
['laptops','Lenovo','IdeaPad 5',64990,72990,10,70,{'Процессор':'Core i5','ОЗУ':'16 ГБ','Память':'512 ГБ'}],
['laptops','ASUS','TUF Gaming F15',89990,null,8,90,{'Процессор':'Core i7','ОЗУ':'16 ГБ','Память':'1 ТБ'}],
['laptops','Apple','MacBook Air M2',109990,119990,6,98,{'Процессор':'Apple M2','ОЗУ':'8 ГБ','Память':'256 ГБ'}],
['laptops','HP','Pavilion 15',48990,null,14,50,{'Процессор':'Ryzen 5','ОЗУ':'8 ГБ','Память':'512 ГБ'}],
['computers','Intel','NUC Mini PC',42990,null,9,40,{'Процессор':'Core i5','ОЗУ':'16 ГБ','Тип':'Мини-ПК'}],
['computers','ASUS','ROG Strix G13',139990,149990,4,85,{'Процессор':'Core i7','ОЗУ':'32 ГБ','Тип':'Игровой ПК'}],
['computers','Apple','iMac 24',129990,null,5,75,{'Процессор':'Apple M3','ОЗУ':'8 ГБ','Тип':'Моноблок'}],
['tablets','Apple','iPad 10',44990,null,15,92,{'Память':'64 ГБ','Экран':'10.9"'}],
['tablets','Samsung','Galaxy Tab S9',64990,69990,7,78,{'Память':'128 ГБ','Экран':'11"'}],
['tablets','Xiaomi','Pad 6',29990,null,18,60,{'Память':'128 ГБ','Экран':'11"'}],
['monitors','LG','UltraGear 27',24990,28990,11,72,{'Диагональ':'27"','Разрешение':'2560x1440'}],
['monitors','Samsung','Odyssey G5',27990,null,8,68,{'Диагональ':'32"','Разрешение':'2560x1440'}],
['monitors','Dell','P2423',17990,null,20,45,{'Диагональ':'24"','Разрешение':'1920x1200'}],
['accessories','Sony','WH-1000XM5',32990,35990,13,88,{'Тип':'Наушники'}],
['accessories','Logitech','MX Master 3S',8990,null,25,70,{'Тип':'Мышь'}],
['accessories','Apple','AirPods Pro 2',21990,null,16,94,{'Тип':'Наушники'}],
['accessories','Anker','PowerCore 20000',3990,4990,50,52,{'Тип':'Powerbank'}],
['gaming','Sony','PlayStation 5',54990,null,6,99,{'Тип':'Консоль'}],
['gaming','Razer','DeathAdder V3',5990,6990,22,64,{'Тип':'Мышь'}],
['gaming','HyperX','Cloud II',7490,null,19,58,{'Тип':'Гарнитура'}]
]
const translit = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
let created = 0
for (const [cat,brand,model,price,oldPrice,stock,popularity,specs] of P) {
  const slug = translit(`${brand}-${model}`)
  if (await prisma.product.findUnique({ where:{slug} })) continue
  const category = await prisma.category.findUnique({ where:{slug:cat} })
  await prisma.product.create({ data:{
    slug, name:`${brand} ${model}`, brand, model, price, oldPrice, stock, popularity, categoryId:category.id,
    description:`${brand} ${model} — надёжное устройство с гарантией и доставкой по Кыргызстану.`,
    images:{ create:[1,2,3].map(n=>({ url:`/images/${cat}-${n}.svg`, sortOrder:n })) },
    specs:{ create:Object.entries(specs).map(([key,value])=>({key,value})) }
  }})
  created++
}

// Демо-баннеры (5 мест показа); добавляются один раз, дальше реклама управляется из админки
if ((await prisma.advertisement.count()) === 0) {
  const ADS = [
    ['Скидки на ноутбуки','Мощные ноутбуки для работы и игр','Выгодные цены на популярные модели с гарантией.','/images/laptops-1.svg','Посмотреть','/laptops','HOME_HERO',1],
    ['Новые смартфоны','Смартфоны нового поколения','Яркие экраны и мощные камеры.','/images/smartphones-1.svg','В каталог','/smartphones','HOME_HERO',2],
    ['Игровая техника','Всё для игр: консоли, мыши, гарнитуры','Соберите свой игровой уголок.','/images/gaming-1.svg','Перейти','/gaming','HORIZONTAL',1],
    ['Аксессуары','Наушники и аксессуары к покупке','Дополните свою технику.','/images/accessories-1.svg','Выбрать','/accessories','CATEGORY',1],
    ['Мониторы','Мониторы для офиса и игр','Чёткая картинка и высокая частота.','/images/monitors-1.svg','Смотреть','/monitors','CATALOG',1],
    ['Планшеты','Планшеты для учёбы и развлечений','Лёгкие и производительные модели.','/images/tablets-1.svg','Подробнее','/tablets','FOOTER',1]
  ]
  for (const [title, headline, description, imageUrl, buttonText, linkUrl, placement, sortOrder] of ADS)
    await prisma.advertisement.create({ data: { title, headline, description, imageUrl, buttonText, linkUrl, placement, status: 'ACTIVE', sortOrder } })
}
console.log(`Категории готовы. Добавлено новых товаров: ${created}`)
await prisma.$disconnect()
