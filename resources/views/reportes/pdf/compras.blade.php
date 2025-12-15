@extends('reportes.pdf.layout')

@section('title', 'Reporte de Compras')
@section('report-name', 'Reporte Detallado de Compras')

@section('content')
    <table>
        <thead>
            <tr>
                <th style="width: 15%;">Fecha</th>
                <th style="width: 15%;">No. Comp.</th>
                <th style="width: 30%;">Proveedor</th>
                <th style="width: 15%;">Usuario</th>
                <th style="width: 10%;" class="text-center">Estado</th>
                <th style="width: 15%;" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $compra)
                <tr>
                    <td>{{ $compra->fecha_emision->format('d/m/Y H:i') }}</td>
                    <td>{{ $compra->numero_comprobante }}</td>
                    <td>{{ $compra->proveedor->razon_social ?? 'Proveedor General' }}</td>
                    <td>{{ $compra->usuario->username ?? 'N/A' }}</td>
                    <td class="text-center">{{ $compra->estado }}</td>
                    <td class="text-right">{{ number_format($compra->total_compra, 2) }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="5" class="text-right">TOTAL COMPRAS</td>
                <td class="text-right">{{ number_format($data->sum('total_compra'), 2) }}</td>
            </tr>
        </tbody>
    </table>
@endsection
