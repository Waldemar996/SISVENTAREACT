<?php

namespace Tests\Feature\Reports;

use App\Domain\Reports\Repositories\ReporteRepositoryInterface;
use App\Infrastructure\Persistence\Reports\SqlReporteRepository;
use App\Models\Comercial\ComCliente;
use App\Models\Inventario\InvProducto;
use App\Models\Logistica\LogBodega;
use App\Models\Operaciones\OperVenta;
use App\Models\RRHH\SysUsuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReportPerformanceTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        // Bind Interface if not already bound
        $this->app->bind(ReporteRepositoryInterface::class, SqlReporteRepository::class);
    }

    /** @test */
    public function it_generates_large_sales_report_under_performance_threshold()
    {
        // 1. Seed 1000 Sales (Raw Insert for Speed)
        $this->seedFastSales(1000);

        // 2. Measure Time
        $repository = app(ReporteRepositoryInterface::class);
        $start = microtime(true);

        $report = $repository->getVentasDiarias(now()->subDays(30), now());

        $end = microtime(true);
        $duration = ($end - $start) * 1000; // ms

        // 3. Assertions
        $this->assertNotEmpty($report, 'Report should not be empty');
        dump("Report Generation Time (1000 records): {$duration}ms");

        $this->assertTrue($duration < 500, "Report took too long: {$duration}ms (Threshold: 500ms)");

        // Verify Data Integrity of first row
        $firstRow = $report[0];
        $this->assertInstanceOf(\App\Application\Reports\DTOs\ReporteVentasDTO::class, $firstRow);
        $this->assertTrue($firstRow->total_ventas > 0);
    }

    private function seedFastSales(int $count)
    {
        $user = SysUsuario::factory()->create();
        $bodega = LogBodega::firstOrCreate(['nombre' => 'Bodega Perf'], ['activa' => true]);
        $cliente = ComCliente::firstOrCreate(['nit' => 'CF'], ['razon_social' => 'Consumidor Final']);
        // Create strict dependencies
        $categoria = \App\Models\Inventario\InvCategoria::firstOrCreate(['nombre' => 'Test Cat'], ['activa' => true]);
        $marca = \App\Models\Inventario\InvMarca::firstOrCreate(['nombre' => 'Test Brand'], ['activa' => true]);
        $unidad = \App\Models\Inventario\InvUnidad::firstOrCreate(['nombre' => 'Unit'], ['abreviatura' => 'u']);
        $impuesto = \App\Models\Finanzas\FinTipoImpuesto::firstOrCreate(['nombre' => 'IVA General'], ['porcentaje' => 12, 'codigo_sat' => 'IVA', 'activo' => true]);

        $producto = InvProducto::create([
            'codigo_sku' => 'PERF-PROD',
            'nombre' => 'Producto Performance',
            'precio_venta_base' => 100,
            'controla_stock' => false,
            'categoria_id' => $categoria->id,
            'marca_id' => $marca->id,
            'unidad_id' => $unidad->id,
            'impuesto_id' => $impuesto->id,
        ]);

        // Prepare arrays for batch insert
        $ventas = [];
        $detalles = [];

        $baseDate = now();

        for ($i = 0; $i < $count; $i++) {
            $ventas[] = [
                'tipo_comprobante' => 'FACTURA',
                'numero_comprobante' => 'PERF-'.$i,
                'cliente_id' => $cliente->id,
                'usuario_id' => $user->id,
                'bodega_id' => $bodega->id,
                'fecha_emision' => $baseDate->copy()->subDays(rand(0, 30))->format('Y-m-d H:i:s'),
                'subtotal' => 100,
                'total_impuestos' => 12,
                'total_venta' => 112,
                'estado' => 'COMPLETADO',
                'created_at' => now(),
                'updated_at' => now(),
                'subtotal' => 100,
                'total_impuestos' => 12,
                'descuento' => 0,
            ];
        }

        OperVenta::insert($ventas);

        // We need IDs for details, so we might need to fetch them back or do slightly slower seed.
        // For strictness, let's just do individual creates inside a transaction if INSERT ID is needed.
        // Or simplified: Just Query DB table to get IDs
        $ids = OperVenta::where('numero_comprobante', 'like', 'PERF-%')->pluck('id')->toArray();

        foreach ($ids as $id) {
            $detalles[] = [
                'venta_id' => $id,
                'producto_id' => $producto->id, // Use valid ID
                'cantidad' => 1,
                'precio_unitario' => 112,
                'impuesto_aplicado' => 12,
                'costo_unitario_historico' => 50,
                'subtotal' => 100,
            ];
        }

        // Chunk details to avoid query limit
        foreach (array_chunk($detalles, 500) as $chunk) {
            DB::table('oper_ventas_det')->insert($chunk);
        }
    }
}
