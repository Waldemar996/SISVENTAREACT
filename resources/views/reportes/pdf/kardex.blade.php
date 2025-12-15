@extends('reportes.pdf.layout')

@section('title', 'Kardex de Producto')
@section('report-name', 'Kardex: ' . ($producto->nombre ?? 'DESCONOCIDO'))

@section('content')
    <div style="margin-bottom: 10px; font-size: 11px;">
        <strong>Código SKU:</strong> {{ $producto->codigo_sku }} <br>
        <strong>Existencia Actual:</strong> {{ $producto->stock_total }}
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 15%;">Fecha</th>
                <th style="width: 15%;">Tipo</th>
                <th style="width: 25%;">Referencia / Glosa</th>
                <th style="width: 10%;" class="text-right">Entrada</th>
                <th style="width: 10%;" class="text-right">Salida</th>
                <th style="width: 10%;" class="text-right">Saldo</th>
                <th style="width: 15%;" class="text-right">Costo Unit.</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $mov)
                <tr>
                    <td>{{ $mov->fecha->format('d/m/Y H:i') }}</td>
                    <td style="font-size: 9px;">{{ $mov->tipo_movimiento }}</td>
                    <td style="font-size: 9px;">
                        {{ $mov->referencia_tipo }} #{{ $mov->referencia_id }} <br>
                        <span style="color: #666;">{{ $mov->glosa }}</span>
                    </td>
                    <td class="text-right" style="color: green;">
                        {{ $mov->cantidad > 0 ? '+' . $mov->cantidad : '' }}
                    </td>
                    <td class="text-right" style="color: red;">
                        {{ $mov->cantidad < 0 ? $mov->cantidad : '' }}
                    </td>
                    <td class="text-right bold">{{ $mov->stock_nuevo }}</td>
                    <td class="text-right">{{ number_format($mov->costo_unitario, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
