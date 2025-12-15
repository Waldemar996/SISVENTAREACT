<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Corte de Caja #{{ $sesion->id }}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            margin: 0;
            padding: 10px;
            width: 80mm; /* Standard Ticket Width */
        }
        .header {
            text-align: center;
            margin-bottom: 10px;
        }
        .header h2 { margin: 0; font-size: 16px; }
        .header p { margin: 2px 0; }
        .divider {
            border-top: 1px dashed #000;
            margin: 10px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
        }
        .totals {
            margin-top: 10px;
        }
        .totals .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .totals .row.bold {
            font-weight: bold;
            font-size: 14px;
        }
        .signatures {
            margin-top: 40px;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #000;
            margin-top: 30px;
            width: 80%;
            margin-left: auto;
            margin-right: auto;
        }
        @media print {
            @page { margin: 0; }
            body { padding: 10px; }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="header">
        <h2>{{ $empresa->nombre_empresa ?? 'MI NEGOCIO' }}</h2>
        <p>{{ $empresa->direccion ?? 'Ciudad' }}</p>
        <p>NIT: {{ $empresa->nit ?? 'C/F' }}</p>
        <br>
        <h3>COMPROBANTE DE CIERRE</h3>
        <p># {{ str_pad($sesion->id, 6, '0', STR_PAD_LEFT) }}</p>
    </div>

    <div class="divider"></div>

    <div class="info-row">
        <span>Caja:</span>
        <span>{{ $sesion->caja->nombre_caja }}</span>
    </div>
    <div class="info-row">
        <span>Cajero:</span>
        <span>{{ $sesion->usuario->username }}</span>
    </div>
    <div class="info-row">
        <span>Apertura:</span>
        <span>{{ $sesion->fecha_apertura->format('d/m/Y H:i') }}</span>
    </div>
    <div class="info-row">
        <span>Cierre:</span>
        <span>{{ $sesion->fecha_cierre ? $sesion->fecha_cierre->format('d/m/Y H:i') : 'EN CURSO' }}</span>
    </div>

    <div class="divider"></div>

    <div class="totals">
        <div class="row">
            <span>Fondo Inicial:</span>
            <span>Q {{ number_format($sesion->monto_inicial, 2) }}</span>
        </div>
        <div class="row">
            <span>(+) Ventas Efectivo:</span>
            <span>Q {{ number_format($sesion->total_efectivo, 2) }}</span>
        </div>
        
        <div class="divider"></div>

        <div class="row bold">
            <span>TOTAL EN CAJA:</span>
            <span>Q {{ number_format($sesion->monto_final_sistema, 2) }}</span>
        </div>

        <div class="row" style="margin-top: 10px; color: #555;">
            <span>Ventas Tarjeta/Digital:</span>
            <span>Q {{ number_format($sesion->total_tarjeta + $sesion->total_transferencia + $sesion->total_otros, 2) }}</span>
        </div>
    </div>

    <div class="signatures">
        <div class="signature-line"></div>
        <p>Firma Cajero</p>

        <div class="signature-line"></div>
        <p>Firma Supervisor</p>
    </div>

    <div class="divider"></div>
    <div style="text-align: center;">
        <p>Impreso: {{ now()->format('d/m/Y H:i:s') }}</p>
    </div>
</body>
</html>
