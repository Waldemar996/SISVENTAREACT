@extends('reportes.pdf.layout')

@section('title', 'Reporte de Ventas')
@section('report-name', 'Reporte Detallado de Ventas')

@section('content')
    <table>
        <thead>
            <tr>
                <th style="width: 15%;">Fecha</th>
                <th style="width: 15%;">No. Comp.</th>
                <th style="width: 30%;">Cliente</th>
                <th style="width: 15%;">Forma Pago</th>
                <th style="width: 10%;" class="text-center">Estado</th>
                <th style="width: 15%;" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $venta)
                <tr>
                    <td>{{ $venta->fecha_emision->format('d/m/Y H:i') }}</td>
                    <td>{{ $venta->numero_comprobante }}</td>
                    <td>{{ $venta->cliente->razon_social ?? 'Consumidor Final' }}</td>
                    <td>{{ $venta->forma_pago }}</td>
                    <td class="text-center">{{ $venta->estado }}</td>
                    <td class="text-right">{{ number_format($venta->total_venta, 2) }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="5" class="text-right">TOTAL VENTAS</td>
                <td class="text-right">{{ number_format($data->sum('total_venta'), 2) }}</td>
            </tr>
        </tbody>
    </table>
@endsection
