@extends('reportes.pdf.layout')

@section('title', 'Historial de Cajas')
@section('report-name', 'Historial de Cierres de Caja')

@section('content')
    <table>
        <thead>
            <tr>
                <th style="width: 15%;">Apertura</th>
                <th style="width: 15%;">Cierre</th>
                <th style="width: 15%;">Usuario</th>
                <th style="width: 15%;">Caja</th>
                <th style="width: 10%;" class="text-right">Inicial</th>
                <th style="width: 10%;" class="text-right">Sistema</th>
                <th style="width: 10%;" class="text-right">Real</th>
                <th style="width: 10%;" class="text-right">Diferencia</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $sesion)
                <tr>
                    <td>{{ $sesion->fecha_apertura->format('d/m/Y H:i') }}</td>
                    <td>{{ $sesion->fecha_cierre ? $sesion->fecha_cierre->format('d/m/Y H:i') : 'ABIERTA' }}</td>
                    <td>{{ $sesion->usuario->username ?? 'N/A' }}</td>
                    <td>{{ $sesion->caja->nombre ?? 'N/A' }}</td>
                    <td class="text-right">{{ number_format($sesion->monto_inicial, 2) }}</td>
                    <td class="text-right">{{ number_format($sesion->monto_final_sistema, 2) }}</td>
                    <td class="text-right">{{ number_format($sesion->monto_final_real, 2) }}</td>
                    <td class="text-right bold" style="color: {{ $sesion->diferencia < 0 ? 'red' : 'green' }};">
                        {{ number_format($sesion->diferencia, 2) }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
