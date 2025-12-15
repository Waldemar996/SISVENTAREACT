@extends('reportes.pdf.layout')

@section('title', 'Cuentas por Cobrar')
@section('report-name', 'Reporte de Cuentas por Cobrar (CXC)')

@section('content')
    <table>
        <thead>
            <tr>
                <th style="width: 15%;">Fecha</th>
                <th style="width: 30%;">Cliente</th>
                <th style="width: 15%;" class="text-right">Monto Original</th>
                <th style="width: 15%;" class="text-right">Abonado</th>
                <th style="width: 15%;" class="text-right">Saldo Pendiente</th>
                <th style="width: 10%;" class="text-center">Días Mora</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($row['fecha'])->format('d/m/Y') }}</td>
                    <td>{{ $row['cliente'] }}</td>
                    <td class="text-right">{{ number_format($row['total'], 2) }}</td>
                    <td class="text-right">{{ number_format($row['pagado'], 2) }}</td>
                    <td class="text-right bold" style="color: #c00;">{{ number_format($row['saldo'], 2) }}</td>
                    <td class="text-center">{{ $row['dias_mora'] }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="4" class="text-right">TOTAL POR COBRAR</td>
                <td class="text-right" style="color: #c00;">Q {{ number_format($total_cxc, 2) }}</td>
                <td></td>
            </tr>
        </tbody>
    </table>
@endsection
