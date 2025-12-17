<?php

namespace Database\Seeders;

use App\Models\Comercial\ComProveedor;
use App\Models\Finanzas\FinTipoImpuesto;
use App\Models\Inventario\InvBodegaProducto;
use App\Models\Inventario\InvCategoria;
use App\Models\Inventario\InvMarca;
use App\Models\Inventario\InvProducto;
use App\Models\Inventario\InvUnidad;
use App\Models\Logistica\LogBodega;
use App\Models\Operaciones\OperCompra;
use App\Models\Operaciones\OperCompraDet;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SupermarketSeeder extends Seeder
{
    private $cats = [];

    private $brands = [];

    private $units = [];

    // Helper: Create/Get Category
    private function getCat($name, $parent = null)
    {
        $key = $name.($parent ? '_'.$parent : '');
        if (! isset($this->cats[$key])) {
            $this->cats[$key] = InvCategoria::create([
                'nombre' => $name,
                'categoria_padre_id' => $parent,
            ])->id;
        }

        return $this->cats[$key];
    }

    // Helper: Get/Create Brand
    private function getBrand($name, $country = 'GT')
    {
        if (! isset($this->brands[$name])) {
            $this->brands[$name] = InvMarca::create(['nombre' => $name, 'pais' => $country])->id;
        }

        return $this->brands[$name];
    }

    public function run()
    {
        // 1. FULL CLEANUP
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        InvBodegaProducto::truncate();
        InvProducto::truncate();
        InvCategoria::truncate();
        InvMarca::truncate();
        InvUnidad::truncate();
        OperCompraDet::truncate();
        OperCompra::truncate();
        ComProveedor::truncate();
        \App\Models\Comercial\ComCliente::truncate();
        \App\Models\Comercial\ComCotizacionDet::truncate();
        \App\Models\Comercial\ComCotizacion::truncate();
        FinTipoImpuesto::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('🚀 MODO HYPERMARKET (NORMALIZED): Generando catálogo masivo...');

        // CONFIG
        $iva = FinTipoImpuesto::create(['nombre' => 'IVA General', 'porcentaje' => 12.00, 'codigo_sat' => 'IVA']);

        $userId = DB::table('sys_usuarios')->where('username', 'admin')->value('id');
        if (! $userId) {
            $userId = DB::table('sys_usuarios')->insertGetId([
                'username' => 'admin', 'email' => 'admin@admin.com', 'password_hash' => Hash::make('password'),
                'rol' => 'superadmin', 'activo' => 1, 'created_at' => Carbon::now(), 'updated_at' => Carbon::now(),
            ]);
        }

        // PROVIDERS
        $prov1 = ComProveedor::create(['razon_social' => 'Distribuidora Universal S.A.', 'nit' => '111111-K', 'nombre_contacto' => 'Carlos Ruíz', 'telefono' => '2222-1111', 'email' => 'ventas@universal.com', 'regimen_fiscal' => 'general', 'dias_credito' => 30]);

        // UNITS
        $this->units['UN'] = InvUnidad::create(['nombre' => 'Unidad', 'abreviatura' => 'UN'])->id;
        $this->units['LB'] = InvUnidad::create(['nombre' => 'Libra', 'abreviatura' => 'LB'])->id;
        $this->units['PQT'] = InvUnidad::create(['nombre' => 'Paquete', 'abreviatura' => 'PQT'])->id;
        $this->units['BOT'] = InvUnidad::create(['nombre' => 'Botella', 'abreviatura' => 'BOT'])->id;
        $this->units['LAT'] = InvUnidad::create(['nombre' => 'Lata', 'abreviatura' => 'LAT'])->id;
        $this->units['GAL'] = InvUnidad::create(['nombre' => 'Galón', 'abreviatura' => 'GAL'])->id;
        $this->units['CAJ'] = InvUnidad::create(['nombre' => 'Caja', 'abreviatura' => 'CJA'])->id;
        $this->units['PAR'] = InvUnidad::create(['nombre' => 'Par', 'abreviatura' => 'PAR'])->id;
        $this->units['SET'] = InvUnidad::create(['nombre' => 'Set/Juego', 'abreviatura' => 'SET'])->id;
        $this->units['TUBO'] = InvUnidad::create(['nombre' => 'Tubo', 'abreviatura' => 'TUB'])->id;

        // --- CATALOGO MASIVO (STRICTLY 3 LEVELS: DEPT -> CAT -> SUBCAT -> PRODS) ---
        $catalog = [
            'Alimentos Frescos' => [
                'Frutas y Verduras' => [
                    'Frutas Importadas' => [
                        ['Manzana Gala', 'FRU-001', 'Granel', 'LB', 3.50, 2.00],
                        ['Manzana Verde', 'FRU-002', 'Granel', 'LB', 4.00, 2.50],
                        ['Uva Red Globe', 'FRU-003', 'Granel', 'LB', 12.00, 8.00],
                        ['Kiwi', 'FRU-004', 'Granel', 'UN', 3.00, 1.50],
                    ],
                    'Frutas Tropicales' => [
                        ['Banano Criollo', 'FRU-005', 'Granel', 'LB', 2.00, 1.00],
                        ['Piña Hawaiana', 'FRU-006', 'Granel', 'UN', 5.00, 3.00],
                        ['Papaya', 'FRU-007', 'Granel', 'UN', 8.00, 5.00],
                        ['Sandía', 'FRU-008', 'Granel', 'UN', 15.00, 10.00],
                    ],
                    'Vegetales' => [
                        ['Tomate Cocina', 'VEG-001', 'Granel', 'LB', 3.00, 1.50],
                        ['Cebolla Blanca', 'VEG-002', 'Granel', 'LB', 4.00, 2.50],
                        ['Chile Pimiento', 'VEG-003', 'Granel', 'UN', 2.00, 1.00],
                        ['Zanahoria', 'VEG-004', 'Granel', 'LB', 2.50, 1.25],
                        ['Lechuga Romana', 'VEG-005', 'Granel', 'UN', 5.00, 3.00],
                    ],
                ],
                'Carnes y Mariscos' => [
                    'Res' => [
                        ['Lomito Premium', 'CAR-001', 'Granel', 'LB', 55.00, 40.00],
                        ['Viuda de Res', 'CAR-002', 'Granel', 'LB', 35.00, 25.00],
                        ['Carne Molida Especial', 'CAR-003', 'Granel', 'LB', 28.00, 20.00],
                    ],
                    'Pollo' => [
                        ['Pechuga Sin Hueso', 'CAR-004', 'Granel', 'LB', 22.00, 16.00],
                        ['Alitas Marinadas', 'CAR-005', 'Pollo Rey', 'LB', 18.00, 12.00],
                        ['Pollo Entero', 'CAR-006', 'Pollo Rey', 'LB', 12.00, 9.00],
                    ],
                    'Pescados' => [
                        ['Filete de Tilapia', 'MAR-001', 'Granel', 'LB', 25.00, 18.00],
                        ['Camarón Cultivado', 'MAR-002', 'Granel', 'LB', 45.00, 35.00],
                    ],
                ],
                'Lácteos y Huevos' => [
                    'Leches' => [
                        ['Leche Entera 1L', 'LAC-001', 'Lala', 'CAJ', 12.00, 9.00],
                        ['Leche Descremada 1L', 'LAC-002', 'Dos Pinos', 'CAJ', 13.00, 9.50],
                        ['Leche Deslactosada', 'LAC-003', 'Lala', 'CAJ', 14.00, 10.00],
                    ],
                    'Quesos' => [
                        ['Queso Panela', 'LAC-004', 'Lala', 'PQT', 18.00, 14.00],
                        ['Queso Mozzarella Rallado', 'LAC-005', 'Dos Pinos', 'PQT', 25.00, 19.00],
                        ['Queso Kraft Singles', 'LAC-006', 'Kraft', 'PQT', 22.00, 16.00],
                    ],
                    'Huevos' => [
                        ['Cartón Huevos Mediano 30u', 'HUE-001', 'Granja Azul', 'CAJ', 45.00, 38.00],
                    ],
                ],
            ],
            'Despensa' => [
                'Abarrotes Básicos' => [
                    'Arroces y Frijoles' => [
                        ['Arroz Blanco 5lb', 'GRA-001', 'Gallo Dorado', 'PQT', 22.00, 18.00],
                        ['Arroz Precocido 1lb', 'GRA-002', 'B&B', 'PQT', 5.00, 3.50],
                        ['Frijol Negro Volteado', 'GRA-003', 'Ducal', 'PQT', 8.00, 6.00],
                    ],
                    'Aceites' => [
                        ['Aceite Vegetal 800ml', 'ACE-001', 'Ideal', 'BOT', 16.00, 13.00],
                        ['Aceite Oliva Extra Virgen', 'ACE-002', 'Carbonell', 'BOT', 55.00, 40.00],
                        ['Spray Cocina', 'ACE-003', 'Pam', 'BOT', 28.00, 22.00],
                    ],
                    'Pastas' => [
                        ['Spaghetti', 'PAS-001', 'Ina', 'PQT', 4.00, 2.50],
                        ['Coditos', 'PAS-002', 'Ina', 'PQT', 4.00, 2.50],
                        ['Lasaña Lista', 'PAS-003', 'Roma', 'CAJ', 15.00, 11.00],
                    ],
                ],
                'Desayuno' => [
                    'Cereales' => [
                        ['Corn Flakes', 'CER-001', 'Kelloggs', 'CAJ', 24.00, 18.00],
                        ['Zucaritas', 'CER-002', 'Kelloggs', 'CAJ', 28.00, 21.00],
                        ['Avena Mosh', 'CER-003', 'Quaker', 'PQT', 12.00, 9.00],
                    ],
                    'Café y Endulzantes' => [
                        ['Café Instantáneo', 'CAF-001', 'Nescafé', 'BOT', 35.00, 28.00],
                        ['Café Molido', 'CAF-002', 'Barista', 'PQT', 45.00, 35.00],
                        ['Azúcar Blanca 2.5kg', 'AZU-001', 'Caña Real', 'PQT', 20.00, 16.00],
                    ],
                ],
                'Snacks' => [
                    'Salados' => [
                        ['Pringles Original', 'SNK-001', 'Pringles', 'LAT', 18.00, 14.00],
                        ['Nachos Queso', 'SNK-002', 'Diana', 'PQT', 5.00, 3.50],
                        ['Maní Salado', 'SNK-003', 'Planters', 'PQT', 8.00, 5.00],
                    ],
                    'Dulces' => [
                        ['Chocolate con Almendras', 'SNK-004', 'Hersheys', 'UN', 12.00, 9.00],
                        ['Galletas Oreo', 'SNK-005', 'Nabisco', 'PQT', 6.00, 4.00],
                    ],
                ],
            ],
            'Bebidas' => [
                'Gaseosas' => [
                    'Colas' => [ // ADDED SUBCAT
                        ['Coca-Cola 2.5L', 'BEB-001', 'Coca-Cola', 'BOT', 16.00, 13.00],
                        ['Pepsi 3L', 'BEB-002', 'Pepsi', 'BOT', 18.00, 14.00],
                    ],
                    'Sabores' => [ // ADDED SUBCAT
                        ['Sprite 1.5L', 'BEB-003', 'Coca-Cola', 'BOT', 10.00, 8.00],
                    ],
                ],
                'Aguas y Jugos' => [
                    'Agua Pura' => [ // ADDED SUBCAT
                        ['Agua Pura 600ml', 'BEB-004', 'Salvavidas', 'BOT', 3.00, 1.50],
                    ],
                    'Jugos' => [ // ADDED SUBCAT
                        ['Jugo Naranja 1L', 'BEB-005', 'Del Valle', 'CAJ', 12.00, 9.00],
                        ['Gatorade Azul', 'BEB-006', 'Gatorade', 'BOT', 8.00, 6.00],
                    ],
                ],
                'Licores' => [
                    'Cervezas' => [ // ADDED SUBCAT
                        ['Cerveza Gallo SixPack', 'LIC-001', 'Gallo', 'PQT', 45.00, 38.00],
                    ],
                    'Destilados y Vinos' => [ // ADDED SUBCAT
                        ['Whisky Etiqueta Roja', 'LIC-002', 'Johnny Walker', 'BOT', 150.00, 110.00],
                        ['Vino Tinto Merlot', 'LIC-003', 'Casillero del Diablo', 'BOT', 65.00, 45.00],
                    ],
                ],
            ],
            'Hogar' => [
                'Limpieza Ropa' => [
                    'Detergentes' => [ // ADDED SUBCAT
                        ['Detergente Polvo 1kg', 'LIM-001', 'Ariel', 'PQT', 25.00, 19.00],
                        ['Suavizante', 'LIM-002', 'Suavitel', 'BOT', 18.00, 14.00],
                        ['Cloro Gel', 'LIM-003', 'Clorox', 'BOT', 15.00, 11.00],
                    ],
                ],
                'Papel y Desechables' => [
                    'Papeles' => [ // ADDED SUBCAT
                        ['Papel Higiénico 12 Rollos', 'PAP-001', 'Scott', 'PQT', 45.00, 35.00],
                        ['Servitoallas', 'PAP-002', 'Scott', 'PQT', 22.00, 16.00],
                        ['Platos Desechables', 'PAP-003', 'Reyma', 'PQT', 15.00, 10.00],
                    ],
                ],
            ],
            'Cuidado Personal' => [
                'Higiene' => [
                    'Cabello' => [ // ADDED SUBCAT
                        ['Shampoo Control Caspa', 'PER-001', 'Head & Shoulders', 'BOT', 38.00, 28.00],
                    ],
                    'Cuerpo' => [ // ADDED SUBCAT
                        ['Jabón Barra 3pack', 'PER-002', 'Dove', 'PQT', 25.00, 18.00],
                        ['Desodorante Spray', 'PER-003', 'Rexona', 'BOT', 22.00, 16.00],
                        ['Pasta Dental Total', 'PER-004', 'Colgate', 'CAJ', 18.00, 14.00],
                    ],
                ],
                'Farmacia OTC' => [
                    'Medicamentos' => [ // ADDED SUBCAT
                        ['Tabcin Día', 'FAR-001', 'Bayer', 'CAJ', 25.00, 18.00],
                        ['Alka-Seltzer', 'FAR-002', 'Bayer', 'CAJ', 20.00, 15.00],
                        ['Vitamina C', 'FAR-003', 'Cebion', 'TUBO', 45.00, 35.00],
                    ],
                ],
            ],
            'Mascotas' => [
                'Perros' => [
                    'Alimento y Premios' => [ // ADDED SUBCAT
                        ['Alimento Perro Adulto 4kg', 'MAS-001', 'Dog Chow', 'PQT', 85.00, 65.00],
                        ['Premios Carnaza', 'MAS-002', 'Pedigree', 'PQT', 15.00, 10.00],
                    ],
                ],
                'Gatos' => [
                    'Alimento y Arena' => [ // ADDED SUBCAT
                        ['Alimento Gato Pescado', 'MAS-003', 'Whiskas', 'PQT', 35.00, 28.00],
                        ['Arena para Gatos', 'MAS-004', 'Tidy Cats', 'GAL', 45.00, 35.00],
                    ],
                ],
            ],
            'Librería y Útiles' => [
                'Papelería' => [
                    'Escolar' => [ // ADDED SUBCAT
                        ['Cuaderno Espiral', 'LIB-001', 'Scribe', 'UN', 12.00, 8.00],
                        ['Bolígrafos Negro/Azul', 'LIB-002', 'Bic', 'PQT', 10.00, 6.00],
                        ['Resma Papel Bond', 'LIB-003', 'Xerox', 'PQT', 45.00, 38.00],
                    ],
                ],
            ],
        ];

        // --- PROCESSING ---
        $finalProds = [];

        foreach ($catalog as $deptName => $categories) {
            $deptId = $this->getCat($deptName);

            foreach ($categories as $catName => $subCatsOrProds) {
                $catId = $this->getCat($catName, $deptId);

                foreach ($subCatsOrProds as $subCatName => $prods) {
                    $subCatId = $this->getCat($subCatName, $catId);

                    foreach ($prods as $p) {
                        try {
                            $brandId = $this->getBrand($p[2]);

                            $uKey = $p[3];
                            if (! isset($this->units[$uKey])) {
                                $uKey = 'UN';
                            }
                            $unitId = $this->units[$uKey];

                            $finalProds[] = InvProducto::create([
                                'codigo_sku' => $p[1],
                                'nombre' => $p[0],
                                'descripcion_corta' => $p[0].' - '.$p[2],
                                'categoria_id' => $subCatId,
                                'marca_id' => $brandId,
                                'unidad_id' => $unitId,
                                'precio_venta_base' => round((float) $p[4], 2),
                                'costo_promedio' => round((float) $p[5], 2),
                                'impuesto_porcentaje' => 12.00,
                                'impuesto_id' => $iva->id,
                                'stock_minimo' => 5,
                                'activo' => true,
                                'controla_stock' => true,
                            ]);
                        } catch (\Exception $e) {
                            $this->command->error('FAILED PRODUCT: '.$p[0]);
                            $this->command->error('ERROR: '.$e->getMessage());
                        }
                    }
                }
            }
        }

        // STOCK
        $bodega = LogBodega::firstOrCreate(
            ['codigo_sucursal' => 'BOD-01'],
            ['nombre' => 'Bodega Central', 'direccion' => 'Zona 1', 'activa' => 1, 'tipo' => 'bodega_central']
        );

        $compra = OperCompra::create([
            'proveedor_id' => $prov1->id,
            'bodega_id' => $bodega->id,
            'usuario_id' => $userId,
            'fecha_emision' => Carbon::now(),
            'estado' => 'recibido',
            'numero_comprobante' => 'INI-MEGA-001',
            'total_compra' => 0,
        ]);

        $total = 0;
        foreach ($finalProds as $fp) {
            $qty = rand(10, 50);
            $c = round($fp->costo_promedio, 2);
            $sub = round($qty * $c, 2);

            OperCompraDet::create([
                'compra_id' => $compra->id,
                'producto_id' => $fp->id,
                'cantidad' => $qty,
                'costo_unitario' => $c,
                'subtotal' => $sub,
            ]);

            InvBodegaProducto::create([
                'bodega_id' => $bodega->id,
                'producto_id' => $fp->id,
                'existencia' => $qty,
                'pasillo' => 'GEN',
            ]);
            $total += $sub;
        }
        $compra->update(['total_compra' => $total]);

        $this->command->info('✅ HYPERMARKET Generado: '.count($finalProds).' productos en catálogo masivo.');

        // --- SECCIÓN COMERCIAL (CLIENTES, PROVEEDORES, COTIZACIONES) ---
        $this->command->info('👥 Generando Datos Comerciales (Clientes y Cotizaciones)...');

        try {
            // 1. CLIENTES
            $clientesData = [
                ['Tienda "La Bendición"', '123456-7', 'Calle Real 5-50', '5555-1010', 'tiendita@gmail.com', 'pequeno_contribuyente'],
                ['Restaurante "El Buen Sabor"', '987654-3', 'Zona Viva 10-20', '4444-2020', 'compras@buensabor.com', 'general_iva'],
                ['Hotel "Las Cumbres"', '456789-1', 'Km 15 Carr. Salvador', '3333-3030', 'admin@hotelcumbres.gt', 'general_iva'],
                ['Colegio "Los Pinitos"', '741852-9', 'Zona 15 VH', '2222-4040', 'admon@lospinitos.edu', 'exento'],
                ['Juan Pérez (Consumidor Final)', 'CF', 'Ciudad', '5555-0000', null, 'pequeno_contribuyente'],
                ['Tienda "La Esquina"', '369258-4', 'Avenida Petapa', '5555-8888', null, 'pequeno_contribuyente'],
            ];

            $clientes = [];
            foreach ($clientesData as $c) {
                $clientes[] = \App\Models\Comercial\ComCliente::create([
                    'razon_social' => $c[0],
                    'nit' => $c[1],
                    'direccion' => $c[2],
                    'telefono' => $c[3],
                    'email' => $c[4],
                    'tipo_contribuyente' => $c[5],
                    'dias_credito' => $c[5] == 'general_iva' ? 30 : 0,
                    'limite_credito' => $c[5] == 'general_iva' ? 5000 : 1000,
                    'vendedor_asignado_id' => $userId,
                ]);
            }

            // 2. MÁS PROVEEDORES (Específicos)
            $extraProviders = [
                ['Licores de Guatemala S.A.', 'LIC-111'],
                ['Distribuidora de Mascotas', 'PET-222'],
                ['Farmacéutica Nacional', 'FAR-333'],
                ['Papelera Internacional', 'PAP-444'],
            ];

            foreach ($extraProviders as $ep) {
                ComProveedor::create([
                    'razon_social' => $ep[0],
                    'nit' => $ep[1],
                    'dias_credito' => 45,
                    'regimen_fiscal' => 'general',
                ]);
            }

            // 3. COTIZACIONES
            // Cotización 1: Borrador
            $cot1 = \App\Models\Comercial\ComCotizacion::create([
                'codigo_cotizacion' => 'COT-'.time().'1',
                'cliente_id' => $clientes[0]->id,
                'usuario_id' => $userId,
                'fecha_emision' => Carbon::now(),
                'fecha_vencimiento' => Carbon::now()->addDays(7),
                'total' => 0,
                'estado' => 'borrador',
            ]);

            $totalCot1 = 0;
            $prodsCot1 = collect($finalProds)->random(5);

            foreach ($prodsCot1 as $p) {
                $qty = rand(5, 20);
                $price = (float) $p->precio_venta_base;
                $sub = round($qty * $price, 2);

                \App\Models\Comercial\ComCotizacionDet::create([
                    'cotizacion_id' => $cot1->id,
                    'producto_id' => $p->id,
                    'cantidad' => $qty,
                    'precio_unitario' => $price,
                    'subtotal' => $sub,
                ]);
                $totalCot1 += $sub;
            }
            $cot1->update(['total' => round($totalCot1, 2)]);

            // Cotización 2: Enviada
            $cot2 = \App\Models\Comercial\ComCotizacion::create([
                'codigo_cotizacion' => 'COT-'.time().'2',
                'cliente_id' => $clientes[1]->id,
                'usuario_id' => $userId,
                'fecha_emision' => Carbon::yesterday(),
                'fecha_vencimiento' => Carbon::now()->addDays(15),
                'total' => 0,
                'estado' => 'enviada',
            ]);

            $prodsCot2 = collect($finalProds)->random(8);
            $totalCot2 = 0;
            foreach ($prodsCot2 as $p) {
                $qty = rand(10, 50);
                $price = (float) $p->precio_venta_base;
                $sub = round($qty * $price, 2);

                \App\Models\Comercial\ComCotizacionDet::create([
                    'cotizacion_id' => $cot2->id,
                    'producto_id' => $p->id,
                    'cantidad' => $qty,
                    'precio_unitario' => $price,
                    'subtotal' => $sub,
                ]);
                $totalCot2 += $sub;
            }
            $cot2->update(['total' => round($totalCot2, 2)]);

            // Cotización 3: Aprobada
            $cot3 = \App\Models\Comercial\ComCotizacion::create([
                'codigo_cotizacion' => 'COT-'.time().'3',
                'cliente_id' => $clientes[3]->id,
                'usuario_id' => $userId,
                'fecha_emision' => Carbon::now()->subDays(2),
                'fecha_vencimiento' => Carbon::now()->addDays(5),
                'total' => 0,
                'estado' => 'aprobada',
            ]);

            $prodsCot3 = collect($finalProds)->random(10);
            $totalCot3 = 0;
            foreach ($prodsCot3 as $p) {
                $qty = rand(50, 100);
                $price = (float) $p->precio_venta_base;
                $sub = round($qty * $price, 2);

                \App\Models\Comercial\ComCotizacionDet::create([
                    'cotizacion_id' => $cot3->id,
                    'producto_id' => $p->id,
                    'cantidad' => $qty,
                    'precio_unitario' => $price,
                    'subtotal' => $sub,
                ]);
                $totalCot3 += $sub;
            }
            $cot3->update(['total' => round($totalCot3, 2)]);

            $this->command->info('✅ Datos Comerciales Generados Exitosamente.');

        } catch (\Exception $e) {
            $this->command->error('❌ Error Generando Datos Comerciales: '.$e->getMessage());
        }
    }
}
