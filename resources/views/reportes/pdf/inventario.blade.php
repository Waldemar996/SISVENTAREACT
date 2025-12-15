@extends('reportes.pdf.layout')

@section('title', 'Inventario Valorizado')
@section('report-name', 'Reporte de Inventario Valorizado')

@section('content')
    <table>
        <thead>
            <tr>
                <th style="width: 15%;">SKU</th>
                <th style="width: 35%;">Producto</th>
                <th style="width: 15%;">Categoría</th>
                <th style="width: 10%;" class="text-right">Stock</th>
                <th style="width: 10%;" class="text-right">Costo Prom.</th>
                <th style="width: 15%;" class="text-right">Valor Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $prod)
                <tr>
                    <td>{{ $prod['codigo_sku'] }}</td>
                    <td>{{ $prod['nombre'] }}</td>
                    <td>{{ $prod['categoria'] }}</td>
                    <td class="text-right">{{ $prod['stock_total'] }}</td>
                    <td class="text-right">Q {{ number_format($prod['costo_promedio'], 2) }}</td>
                    <td class="text-right">Q {{ number_format($prod['valor_total'], 2) }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="5" class="text-right">TOTAL VALORIZADO</td>
                <td class="text-right">Q {{ number_format($total_valorizado, 2) }}</td>
            </tr>
        </tbody>
    </table>
@endsection
