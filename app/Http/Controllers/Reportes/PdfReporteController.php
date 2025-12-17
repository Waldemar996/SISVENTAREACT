<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use App\Models\Config\SysConfiguracion;
use App\Models\Inventario\InvProducto;
use App\Models\Operaciones\OperVenta;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class PdfReporteController extends Controller
{
    private function getEmpresa()
    {
        return SysConfiguracion::first(); // Data for Header
    }

    public function downloadCompras(Request $request)
    {
        $query = \App\Models\Operaciones\OperCompra::with(['proveedor', 'usuario'])
            ->orderBy('fecha_emision', 'desc');

        $filtros = [];
        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
            $filtros[] = 'Desde: '.$request->fecha_inicio;
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
            $filtros[] = 'Hasta: '.$request->fecha_fin;
        }

        $data = $query->get();
        $empresa = $this->getEmpresa();
        $filtrosStr = implode(' | ', $filtros);

        $pdf = Pdf::loadView('reportes.pdf.compras', compact('data', 'empresa', 'filtrosStr'));

        return $pdf->stream('reporte_compras.pdf');
    }

    public function downloadHistorialCajas(Request $request)
    {
        $query = \App\Models\Tesoreria\TesSesionCaja::with(['usuario', 'caja'])
            ->orderBy('fecha_apertura', 'desc');

        $filtros = [];
        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_apertura', '>=', $request->fecha_inicio);
            $filtros[] = 'Desde: '.$request->fecha_inicio;
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_apertura', '<=', $request->fecha_fin);
            $filtros[] = 'Hasta: '.$request->fecha_fin;
        }

        $data = $query->get();
        $empresa = $this->getEmpresa();
        $filtrosStr = implode(' | ', $filtros);

        $pdf = Pdf::loadView('reportes.pdf.cajas', compact('data', 'empresa', 'filtrosStr'));

        return $pdf->stream('reporte_cajas.pdf');
    }

    public function downloadKardex(Request $request)
    {
        $request->validate([
            'producto_id' => 'required',
        ]);

        $query = \App\Models\Inventario\InvKardex::with(['bodega'])
            ->where('producto_id', $request->producto_id)
            ->orderBy('fecha', 'asc'); // Ascendent for Kardex to follow logic

        $filtros = [];
        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha', '>=', $request->fecha_inicio);
            $filtros[] = 'Desde: '.$request->fecha_inicio;
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha', '<=', $request->fecha_fin);
            $filtros[] = 'Hasta: '.$request->fecha_fin;
        }

        $data = $query->get();
        $producto = InvProducto::find($request->producto_id);
        $empresa = $this->getEmpresa();
        $filtrosStr = 'Producto: '.($producto->nombre ?? 'N/A').' | '.implode(' | ', $filtros);

        $pdf = Pdf::loadView('reportes.pdf.kardex', compact('data', 'empresa', 'filtrosStr', 'producto'));

        return $pdf->stream('reporte_kardex.pdf');
    }

    public function downloadVentas(Request $request)
    {
        $query = OperVenta::with(['cliente', 'usuario'])
            ->orderBy('fecha_emision', 'desc');

        $filtros = [];
        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
            $filtros[] = 'Desde: '.$request->fecha_inicio;
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
            $filtros[] = 'Hasta: '.$request->fecha_fin;
        }
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
            $filtros[] = 'Estado: '.$request->estado;
        }

        $data = $query->get();
        $empresa = $this->getEmpresa();
        $filtrosStr = implode(' | ', $filtros);

        $pdf = Pdf::loadView('reportes.pdf.ventas', compact('data', 'empresa', 'filtrosStr'));

        return $pdf->stream('reporte_ventas.pdf');
    }

    public function downloadInventario(Request $request)
    {
        $query = InvProducto::with(['categoria', 'marca', 'bodegaProductos.bodega'])
            ->where('activo', true)
            ->whereHas('bodegaProductos', function ($q) {
                $q->where('existencia', '>', 0);
            });

        $productos = $query->get()->map(function ($prod) {
            $stock = $prod->stock_total;
            $valor = $stock * $prod->costo_promedio;

            return [
                'codigo_sku' => $prod->codigo_sku,
                'nombre' => $prod->nombre,
                'categoria' => $prod->categoria->nombre ?? 'N/A',
                'stock_total' => $stock,
                'costo_promedio' => $prod->costo_promedio,
                'valor_total' => $valor,
            ];
        });

        $total_valorizado = $productos->sum('valor_total');
        $empresa = $this->getEmpresa();
        $filtros = 'Inventario General Activo';

        $pdf = Pdf::loadView('reportes.pdf.inventario', [
            'data' => $productos,
            'empresa' => $empresa,
            'total_valorizado' => $total_valorizado,
            'filtros' => $filtros,
        ]);

        return $pdf->stream('reporte_inventario.pdf');
    }

    public function downloadCxc(Request $request)
    {
        $ventas = OperVenta::with(['cliente'])
            ->where('estado', 'PENDIENTE')
            ->orderBy('fecha_emision', 'asc')
            ->get()
            ->map(function ($venta) {
                $pagado = \App\Models\Finanzas\FinPagoCliente::where('venta_id', $venta->id)->sum('monto');

                return [
                    'fecha' => $venta->fecha_emision,
                    'cliente' => $venta->cliente->razon_social ?? 'Consumidor',
                    'total' => $venta->total_venta,
                    'pagado' => $pagado,
                    'saldo' => $venta->total_venta - $pagado,
                    'dias_mora' => \Carbon\Carbon::parse($venta->fecha_emision)->diffInDays(now()),
                ];
            })
            ->filter(function ($row) {
                return $row['saldo'] > 0;
            });

        $total_cxc = $ventas->sum('saldo');
        $empresa = $this->getEmpresa();
        $filtros = 'Cuentas por Cobrar (Saldos Pendientes)';

        $pdf = Pdf::loadView('reportes.pdf.cxc', [
            'data' => $ventas,
            'empresa' => $empresa,
            'total_cxc' => $total_cxc,
            'filtros' => $filtros,
        ]);

        return $pdf->stream('reporte_cxc.pdf');
    }
}
