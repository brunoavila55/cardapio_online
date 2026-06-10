const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// 1. Helper to parse .env file manually (zero external dependencies)
function loadEnv() {
  const envPath = path.join(__dirname, '.env')
  if (!fs.existsSync(envPath)) {
    console.error('Erro: Arquivo .env não encontrado na raiz do projeto! Crie-o primeiro.')
    process.exit(1)
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  const env = {}
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (match) {
      let value = match[2] ? match[2].trim() : ''
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
      env[match[1]] = value;
    }
  })
  return env
}

const env = loadEnv()
const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos no seu arquivo .env!')
  process.exit(1)
}

console.log('Iniciando conexão com o Supabase:', supabaseUrl)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 2. Beautifully Consolidated 8 Macro-Categories (instead of 6)
const categoriesData = [
  { name: 'Bebidas & Vinhos', order: 1 },
  { name: 'Entradas & Petiscos', order: 2 },
  { name: 'Saladas', order: 3 },
  { name: 'Peixes', order: 4 },
  { name: 'Carnes & Grelhados', order: 5 },
  { name: 'Massas & Risotos', order: 6 },
  { name: 'Lanches & Pizzas', order: 7 },
  { name: 'Sobremesas', order: 8 }
]

// 3. Consolidated Products Mapping with clean subcategories
const productsData = {
  'Bebidas & Vinhos': [
    { name: 'Água mineral (com ou sem gás)', price: 5.00, subcategory: 'Refrigerantes, Águas & Sucos' },
    { name: 'Refrigerante (lata 350ml)', price: 7.00, subcategory: 'Refrigerantes, Águas & Sucos' },
    { name: 'H2O (limão copo 400ml)', price: 8.00, subcategory: 'Refrigerantes, Águas & Sucos' },
    { name: 'Suco Natural (laranja ou abacaxi copo 400ml)', price: 12.00, subcategory: 'Refrigerantes, Águas & Sucos' },
    { name: 'Suco de Limão (copo 400ml)', price: 8.00, subcategory: 'Refrigerantes, Águas & Sucos' },
    
    { name: 'Cerveja (Budwaiser, Spaten e Original 600ml)', price: 19.00, subcategory: 'Cervejas' },
    { name: 'Cerveja (Skol 600ml)', price: 17.00, subcategory: 'Cervejas' },
    { name: 'Cerveja preta (Brahma Malzebier lata 350ml)', price: 10.00, subcategory: 'Cervejas' },
    { name: 'Cerveja Heineken Long Neck', price: 14.00, subcategory: 'Cervejas' },
    
    { name: 'Caipira Morango', price: 26.00, subcategory: 'Coquetéis & Doses' },
    { name: 'Caipira Vodka', price: 25.00, subcategory: 'Coquetéis & Doses' },
    { name: 'Caipira Velho Barreiro', price: 20.00, subcategory: 'Coquetéis & Doses' },
    { name: 'Caipira Absolute', price: 30.00, subcategory: 'Coquetéis & Doses' },
    { name: 'Martini', price: 10.00, subcategory: 'Coquetéis & Doses' },
    { name: 'Campari', price: 10.00, subcategory: 'Coquetéis & Doses' },
    { name: 'Rum', price: 10.00, subcategory: 'Coquetéis & Doses' },
    { name: 'Vodca', price: 10.00, subcategory: 'Coquetéis & Doses' },
    { name: 'Gin', price: 10.00, subcategory: 'Coquetéis & Doses' },
    { name: 'Underberg', price: 10.00, subcategory: 'Coquetéis & Doses' },
    { name: 'Aperol Spritz (Aperol c/ espumante)', price: 35.00, subcategory: 'Coquetéis & Doses' },
    
    { name: 'Chivas (12 anos)', price: 20.00, subcategory: 'Uísques' },
    { name: 'Logan (12 anos)', price: 18.00, subcategory: 'Uísques' },
    { name: 'Johnnie Walker', price: 19.00, subcategory: 'Uísques' },
    { name: 'Old Eight', price: 10.00, subcategory: 'Uísques' },
    
    { name: 'Freixenet (semi sec)', price: 109.00, subcategory: 'Espumantes' },
    { name: 'Freixenet Mia', price: 89.00, subcategory: 'Espumantes' },
    { name: 'Freixenet Gordon negro Brut', price: 109.00, subcategory: 'Espumantes' },
    { name: 'Chandon Extra Brut', price: 130.00, subcategory: 'Espumantes' },
    
    { name: '8 KM Cabernet Souvignon', price: 58.00, subcategory: 'Vinhos Importados' },
    { name: 'Casillero Del Diablo Cabernet', price: 109.00, subcategory: 'Vinhos Importados' },
    { name: 'Casillero Del Diablo Sauvignon Blanc', price: 109.00, subcategory: 'Vinhos Importados' },
    { name: 'Casillero Del Diablo Carmeniere', price: 109.00, subcategory: 'Vinhos Importados' },
    { name: 'Casillero Del Diablo Chardonay', price: 109.00, subcategory: 'Vinhos Importados' },
    { name: 'Gato Negro Cabernet Sauvignon', price: 89.00, subcategory: 'Vinhos Importados' },
    { name: 'Gato Negro Merlot', price: 89.00, subcategory: 'Vinhos Importados' },
    { name: 'Reservado Concha Y Toro Cabernet Sauvignon', price: 89.00, subcategory: 'Vinhos Importados' },
    { name: 'Reservado Concha Y Toro Sauvignon Blanco', price: 89.00, subcategory: 'Vinhos Importados' },
    
    { name: 'Don Laurindo Cabernet Sauvignon', price: 104.00, subcategory: 'Vinhos Nacionais' },
    { name: 'Don Laurindo Merlot', price: 118.00, subcategory: 'Vinhos Nacionais' },
    { name: 'Don Laurindo Tannat', price: 120.00, subcategory: 'Vinhos Nacionais' },
    { name: 'Don Laurindo Malbec', price: 115.00, subcategory: 'Vinhos Nacionais' },
    { name: 'Don Pedrito Cabernet Sauvignon', price: 95.00, subcategory: 'Vinhos Nacionais' },
    { name: 'Don Pedrito Malbec', price: 99.00, subcategory: 'Vinhos Nacionais' },
    { name: 'Don Pedrito Merlot', price: 99.00, subcategory: 'Vinhos Nacionais' },
    { name: 'Taça de Vinho Tinto Seco Colonial (300ml)', price: 18.00, subcategory: 'Vinhos Nacionais' },
    { name: 'Taça de Vinho Tinto Suave Colonial (300ml)', price: 18.00, subcategory: 'Vinhos Nacionais' },
    
    { name: 'Rutini Malbec', price: 279.00, subcategory: 'Vinhos Argentinos' },
    { name: 'DV Catena Malbec', price: 199.00, subcategory: 'Vinhos Argentinos' },
    { name: 'DV Catena Cabernet Malbec', price: 179.00, subcategory: 'Vinhos Argentinos' },
    { name: 'Angelica Zapata Cabernet', price: 269.00, subcategory: 'Vinhos Argentinos' },
    { name: 'Angelica Zapata Malbec', price: 279.00, subcategory: 'Vinhos Argentinos' },
    { name: 'Cordero com Piel de Lobo Malbec', price: 79.00, subcategory: 'Vinhos Argentinos' },
    { name: 'Cordero del Lobo Chardonay', price: 79.00, subcategory: 'Vinhos Argentinos' },
    { name: 'Cordero Rose Malbec', price: 79.00, subcategory: 'Vinhos Argentinos' },
    { name: 'Perro Callejero Malbec', price: 109.00, subcategory: 'Vinhos Argentinos' },
    { name: 'La Linda Chardonay', price: 109.00, subcategory: 'Vinhos Argentinos' },
    { name: 'La Linda Rose Malbec', price: 109.00, subcategory: 'Vinhos Argentinos' },
    { name: 'Latitude 33 Malbec', price: 109.00, subcategory: 'Vinhos Argentinos' }
  ],
  'Entradas & Petiscos': [
    { name: 'Pastéis Presunto e Queijo (6 unidades)', price: 9.00, subcategory: 'Pastéis & Bolinhos' },
    { name: 'Pastéis carne (6 unidades)', price: 16.00, subcategory: 'Pastéis & Bolinhos' },
    { name: 'Pastéis camarão (6 unidades)', price: 22.00, subcategory: 'Pastéis & Bolinhos' },
    { name: 'Bolinho de Peixe (5 unidades)', price: 9.50, subcategory: 'Pastéis & Bolinhos' },
    { name: 'Bolinho de Bacalhau (6 unidades)', price: 32.00, subcategory: 'Pastéis & Bolinhos' },
    { name: 'Camarão a Milanesa', price: 89.00, subcategory: 'Pastéis & Bolinhos' },
    { name: 'Iscas de Peixe a Milanesa', price: 50.00, description: '350g de iscas de peixe a milanesa', subcategory: 'Pastéis & Bolinhos' },
    { name: 'Tilápia a Milanesa', price: 40.00, description: '350g de iscas de peixe a milanesa', subcategory: 'Pastéis & Bolinhos' },
    
    { name: 'Picadinho de Filé', price: 45.00, subcategory: 'Porções & Acompanhamentos' },
    { name: 'Iscas de Frango a Milanesa', price: 30.00, description: '250g de iscas de frango a milanesa', subcategory: 'Porções & Acompanhamentos' },
    { name: 'Tábua de Frios', price: 50.00, description: 'Queijo, presunto, pepino, azeitona e salame', subcategory: 'Porções & Acompanhamentos' },
    { name: 'Batata Frita', price: 30.00, description: '300g de batata palito', subcategory: 'Porções & Acompanhamentos' },
    { name: 'Batata Frita c/ chedder e bacon', price: 55.00, description: 'Batata palito, bacon e queijo chedder', subcategory: 'Porções & Acompanhamentos' },
    { name: 'Arroz', price: 13.00, subcategory: 'Porções & Acompanhamentos' },
    { name: 'Feijão', price: 13.00, subcategory: 'Porções & Acompanhamentos' },
    { name: 'Ovo', price: 4.00, subcategory: 'Porções & Acompanhamentos' },
    { name: 'Batata frita (adicional)', price: 5.00, subcategory: 'Porções & Acompanhamentos' },
    
    { name: 'Canja * Servido na sopeira, p/1 pessoa', price: 27.00, description: 'Arroz, frango, cenoura e batata', subcategory: 'Sopas & Caldos' },
    { name: 'Sopa de Capeletti * Servido na sopeira, p/1 pessoa', price: 33.00, description: 'Carne ou frango', subcategory: 'Sopas & Caldos' },
    { name: 'Sopa de Capeletti * Servido na sopeira, p/2 pessoas', price: 60.00, description: 'Carne ou frango', subcategory: 'Sopas & Caldos' }
  ],
  'Saladas': [
    { name: 'Mix de folhas * Empratado, porção p/1 pessoa', price: 19.00, description: 'Alface, rúcula, tomate e cebola roxa' },
    { name: 'Salada Ceasar * Empratado, porção p/1 pessoa', price: 33.00, description: 'Frango grelhado, alface americana, uva passa, molho e crótons' },
    { name: 'Salpicão * Empratado, porção p/1 pessoa', price: 22.00, description: 'Frango desfiado, maionese, cenoura ralada, pimentões picados, batata palha, presunto e queijo' }
  ],
  'Peixes': [
    { name: 'Salmão ao molho mostarda', price: 104.00, description: 'Salmão grelhado no azeite de oliva, acompanhado de molho de mostarda, mel e nata; batata elegante (com molho branco e queijo ralado gratinado) e arroz', subcategory: 'Salmão' },
    { name: 'Salmão ao molho maracujá', price: 92.00, description: 'Salmão grelhado com molho de maracujá, arroz e gratinado de batatas', subcategory: 'Salmão' },
    { name: 'Salmão ao molho alcaparras', price: 116.00, description: 'Salmão grelhado, molho com alcaparras (molho branco com alcaparras), champignon, batata souté e arroz', subcategory: 'Salmão' },
    
    { name: 'Tilápia da Casa', price: 72.00, description: 'Filé de tilápia a milanesa, cenoura, cebola, brócolis grelhados e arroz', subcategory: 'Tilápia' },
    { name: 'Tilápia a siciliana', price: 65.00, description: 'Filé de tilápia grelhado crisp de cebola (cebola meia lua frita), arroz e batata chips', subcategory: 'Tilápia' },
    
    { name: 'Traíra da Casa', price: 87.00, description: 'Filé de traíra a milanesa acompanhada de legumes cozidos, ovos e arroz.', subcategory: 'Traíra' },
    { name: 'Traíra a siciliana', price: 76.00, description: 'Filé de traíra frita, crisp de cebola (cebola meia lua frita), batata chips, molho com limão e arroz', subcategory: 'Traíra' },
    { name: 'Traíra ao molho escabeche', price: 73.00, description: 'Filé de traíra frita, arroz e molho ao escabeche (tomate e cebola)', subcategory: 'Traíra' },
    { name: 'Traíra ao molho de camarão', price: 113.00, description: 'Filé de traíra frita, de molho de camarão e arroz', subcategory: 'Traíra' }
  ],
  'Carnes & Grelhados': [
    { name: 'Filé Acebolado', price: 65.00, description: 'Medalhões de filé (200g) com cebola grelhada, arroz, batata frita mix de folhas e ovo', subcategory: 'Carnes Vermelhas' },
    { name: 'Filé Grelhado', price: 58.00, description: 'Arroz, filé grelhado (200g), alface e tomate', subcategory: 'Carnes Vermelhas' },
    { name: 'Filé a Milanesa', price: 68.00, description: 'Filé a milanesa (200g), arroz, batata frita, mix de folhas e ovo', subcategory: 'Carnes Vermelhas' },
    { name: 'Filé a Parmegiana', price: 87.00, description: 'Filé empanado (200g), presunto, molho de tomate, queijo gratinado, arroz, batata frita', subcategory: 'Carnes Vermelhas' },
    { name: 'Tornedos de Filé', price: 85.00, description: 'Medalhões de filé (200g) envolto com tiras de bacon ao molho de vinho, arroz, batata frita', subcategory: 'Carnes Vermelhas' },
    { name: 'Medalhões de Filé', price: 77.00, description: 'Medalhões de filé (200g) envolto com tiras de bacon, arroz, batata frita', subcategory: 'Carnes Vermelhas' },
    { name: 'A La Minuta de Filé', price: 78.00, description: 'Filé grelhado (200g), arroz, feijão, batata frita, mix de folhas e ovo', subcategory: 'Carnes Vermelhas' },
    { name: 'Estrogonof de Filé', price: 81.00, description: 'Iscas de filé grelhado (250g), molho de strogonof, arroz e batata palha', subcategory: 'Carnes Vermelhas' },
    { name: 'Carreteiro de Charque * Servido na panela de ferro, p/ 1 pessoa', price: 55.00, description: 'Charque receita tradicional de carreteiro de charque.', subcategory: 'Carnes Vermelhas' },
    { name: 'Carreteiro de Filé * Servido na panela de ferro, p/ 1 pessoa', price: 58.00, description: 'Iscas de filé, cebola, tomate, molho de tomate e arroz', subcategory: 'Carnes Vermelhas' },
    
    { name: 'Frango Grelhado', price: 45.00, description: 'Frango grelhado (200g), arroz branco, mix de folhas', subcategory: 'Aves & Frangos' },
    { name: 'Frango a parmegiana', price: 69.00, description: 'Filé de frango (200g) empanado e frito, arroz, batata frita e mix de folhas', subcategory: 'Aves & Frangos' },
    { name: 'Frango a milanesa', price: 48.00, description: 'Filé de frango (200g), arroz branco, alface e tomate', subcategory: 'Aves & Frangos' },
    { name: 'A La minuta de Frango', price: 60.00, description: 'Filé de frango grelhado (200g), arroz, batata frita, feijão, mix de folas e ovo', subcategory: 'Aves & Frangos' },
    { name: 'Strogonof de Frango', price: 62.00, description: 'Iscas de frango (200g), arroz, batata palha e molho strogonof', subcategory: 'Aves & Frangos' },
    
    { name: 'Omeletes de legumes', price: 27.00, subcategory: 'Omeletes' },
    { name: 'Omelete de presunto e queijo', price: 31.00, subcategory: 'Omeletes' },
    { name: 'Omelete de presunto, queijo e salaminho', price: 35.00, subcategory: 'Omeletes' }
  ],
  'Massas & Risotos': [
    { name: 'Espaguete á bolonhesa', price: 57.00, description: 'Espaguete artesanal, molho vermelho, queijo e iscas de filé', subcategory: 'Massas Artesanais' },
    { name: 'Espaguete á Carbonara', price: 62.00, description: 'Espaguete artesanal, bacon, gemas, molho branco e parmesão', subcategory: 'Massas Artesanais' },
    { name: 'Espaguete da Casa', price: 68.00, description: 'Espaguete artesanal, molho branco, com iscas de filé e champignon', subcategory: 'Massas Artesanais' },
    { name: 'Espaguete ao funghi', price: 85.00, description: 'Espaguete artesanal, molho branco, funghi grelhado e iscas de filé', subcategory: 'Massas Artesanais' },
    { name: 'Espaguete camarão', price: 92.00, description: 'Espaguete artesanal, molho branco, camarão grelhado', subcategory: 'Massas Artesanais' },
    { name: 'Fettuccine da Casa', price: 85.00, description: 'Fettuccine artesanal, rúcula, tomate seco, escalopes de filé e molho 4 queijos.', subcategory: 'Massas Artesanais' },
    { name: 'Nhoque á bolonhesa', price: 65.00, description: 'Nhoque de batata, molho de tomate e carne', subcategory: 'Massas Artesanais' },
    { name: 'Sorrentino de presunto e queijo', price: 65.00, description: 'Sorrentino de presunto e queijo e molho Rosse', subcategory: 'Massas Artesanais' },
    { name: 'Sorrentino de presunto e queijo á bolonhesa', price: 70.00, description: 'Sorrentino de presunto e queijo, molho vermelho e iscas de filé', subcategory: 'Massas Artesanais' },
    { name: 'Ravióli de Espinafre e Ricota', price: 70.00, description: 'Ravióli de espinafre e ricota flambado na manteiga com tempo verde', subcategory: 'Massas Artesanais' },
    { name: 'Ravióli de Espinafre e Ricota á bolonhesa', price: 75.00, description: 'Ravióli de espinafre e ricota, molho vermelho e iscas de filé', subcategory: 'Massas Artesanais' },
    
    { name: 'Risoto de Camarão * Empratado, porção p/1 pessoa', price: 62.00, description: 'Arroz arbóreo, cebola, alho poro, manteiga, parmesão, vinho branco e camarão grelhado', subcategory: 'Risotos Especiais' },
    { name: 'Risoto ao Funghi * Empratado, porção p/1 pessoa', price: 61.00, description: 'Arroz arbóreo, cebola, alho poro, manteiga, parmesão, vinho branco, Funghi e medalhões de filé grelhado', subcategory: 'Risotos Especiais' },
    { name: 'Risoto de abóbora cabotiá * Empratado, porção p/1 pessoa', price: 61.00, description: 'Arroz arbóreo, cebola, alho poro, manteiga, abóbora cabotiá, parmesão, vinho branco e medalhões de filé grelhado', subcategory: 'Risotos Especiais' },
    { name: 'Risoto de salmão e limão silciliano * Empratado, porção p/1 pessoa', price: 69.00, description: 'Arroz arbóreo, raspas de limão siciliano, salmão grelhado, cebola, alho poro, manteiga, palmito, parmesão, vinho branco', subcategory: 'Risotos Especiais' },
    { name: 'Risoto de rúcula c/ salmão * Empratado, porção p/1 pessoa', price: 69.00, description: 'Arroz arbóreo, rúcula, salmão grelhado, tomate seco, cebola, alho poro, manteiga, palmito, parmesão, vinho branco', subcategory: 'Risotos Especiais' },
    { name: 'Risoto de gorgonzola c/ filé * Empratado, porção p/1 pessoa', price: 64.00, description: 'Arroz arbóreo, cebola, alho poro, gorgonzola, manteiga, parmesão, vinho branco e filé grelhado', subcategory: 'Risotos Especiais' }
  ],
  'Lanches & Pizzas': [
    { name: 'Bauru da Casa', price: 44.00, description: 'Iscas de filé (200g), queijo, presunto, alface, tomate, milho, ervilha, Fritas e ovo', subcategory: 'Lanches Completos' },
    { name: 'Xis Bacon', price: 48.00, description: 'Bacon, presunto, queijo, milho, ervilha, tomate, alface, maionese, ovo', subcategory: 'Lanches Completos' },
    { name: 'Torrada Simples', price: 16.00, description: 'Presunto e queijo', subcategory: 'Lanches Completos' },
    { name: 'Torrada completa', price: 24.00, description: 'Presunto, queijo, tomate, alface, ovo', subcategory: 'Lanches Completos' },
    
    { name: 'Pizza Família', price: 70.00, description: 'Frango com requeijão, mussarela, calabresa, lombo com requeijão, bacon e chedder', subcategory: 'Pizzas Especiais' },
    { name: 'Pizza Média', price: 58.00, description: 'Frango com requeijão, mussarela, calabresa, lombo com requeijão, bacon e chedder', subcategory: 'Pizzas Especiais' }
  ],
  'Sobremesas': [
    { name: 'Pudim (leite, leite condensado e ovos)', price: 8.00, subcategory: 'Sobremesas' },
    { name: 'Petit gâteau c/ sorvete de creme', price: 25.00, subcategory: 'Sobremesas' }
  ]
}

// 4. Helper to generate slug from name
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

async function run() {
  try {
    let isAuthenticated = false

    // Check if key is secret/service_role (bypasses RLS)
    if (supabaseAnonKey.startsWith('sb_secret_') || supabaseAnonKey.includes('service_role')) {
      console.log('Chave do tipo SECRET/SERVICE_ROLE detectada. A inserção ignorará as políticas RLS automaticamente.')
      isAuthenticated = true
    } else {
      console.log('Chave do tipo PUBLISHABLE detectada. Tentando autenticação como administrador...')
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@admin.com',
        password: 'admin123'
      })

      if (authError) {
        console.warn('Alerta: Não foi possível autenticar localmente:', authError.message)
        console.log('Dica: Certifique-se de criar o usuário "admin@admin.com" com a senha "admin123" no painel Authentication do Supabase.')
        console.log('Continuando tentativa direta no banco de dados (pode falhar se RLS estiver ativo)...')
      } else {
        console.log('Autenticação de administrador realizada com sucesso! Token de sessão obtido.')
        isAuthenticated = true
      }
    }

    console.log('\n--- 0. LIMPANDO BANCO DE DADOS (RESET COMPLETO) ---')
    const { error: clearProductsError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (clearProductsError) throw new Error('Erro ao limpar produtos: ' + clearProductsError.message)
    
    const { error: clearCategoriesError } = await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (clearCategoriesError) throw new Error('Erro ao limpar categorias: ' + clearCategoriesError.message)
    
    console.log('Banco de dados limpo com sucesso!')

    console.log('\n--- 1. CADASTRANDO CATEGORIAS ---')
    const categoryMap = {}

    for (const cat of categoriesData) {
      const slug = slugify(cat.name)
      
      // Check if category already exists to avoid duplicates
      const { data: existing, error: findError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (existing) {
        console.log(`[Categoria] "${cat.name}" já cadastrada. Atualizando display_order...`)
        const { error: updateError } = await supabase
          .from('categories')
          .update({ display_order: cat.order })
          .eq('id', existing.id)
        
        categoryMap[cat.name] = existing.id
      } else {
        const { data: created, error: createError } = await supabase
          .from('categories')
          .insert([{ name: cat.name, slug, display_order: cat.order }])
          .select()
          .single()

        if (createError) {
          throw new Error(`Erro ao criar categoria "${cat.name}": ${createError.message}`)
        }
        console.log(`[Categoria] "${cat.name}" criada com sucesso!`)
        categoryMap[cat.name] = created.id
      }
    }

    console.log('\n--- 2. CADASTRANDO PRODUTOS ---')
    let totalInserted = 0

    for (const categoryName of Object.keys(productsData)) {
      const categoryId = categoryMap[categoryName]
      if (!categoryId) {
        console.warn(`Alerta: Categoria "${categoryName}" não encontrada no mapeamento. Pulando pratos...`)
        continue
      }

      const productsList = productsData[categoryName]
      console.log(`\nInserindo pratos para Categoria "${categoryName}" (total: ${productsList.length})...`)

      for (const prod of productsList) {
        // Check if product already exists to avoid duplication
        const { data: existing, error: findError } = await supabase
          .from('products')
          .select('*')
          .eq('name', prod.name)
          .eq('category_id', categoryId)
          .maybeSingle()

        if (existing) {
          console.log(`  [Produto] "${prod.name}" já cadastrado. Atualizando preço e subcategoria...`)
          await supabase
            .from('products')
            .update({
              price: prod.price,
              description: prod.description || '',
              subcategory: prod.subcategory || ''
            })
            .eq('id', existing.id)
          continue
        }

        const { error: insertError } = await supabase
          .from('products')
          .insert([{
            category_id: categoryId,
            name: prod.name,
            price: prod.price,
            description: prod.description || '',
            subcategory: prod.subcategory || '',
            available: true,
            display_order: 0
          }])

        if (insertError) {
          console.error(`  [Erro] Falha ao cadastrar "${prod.name}":`, insertError.message)
        } else {
          console.log(`  [Produto] "${prod.name}" cadastrado - R$ ${prod.price.toFixed(2)}`)
          totalInserted++
        }
      }
    }

    console.log(`\n🎉 SEEDING CONCLUÍDO COM SUCESSO!`)
    console.log(`Total de novas categorias inseridas/verificadas: ${categoriesData.length}`)
    console.log(`Total de novos produtos inseridos com sucesso: ${totalInserted}`)

  } catch (err) {
    console.error('\n❌ Erro fatal durante a carga de dados:', err.message)
  }
}

run()
