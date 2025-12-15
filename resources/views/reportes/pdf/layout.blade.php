<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>@yield('title')</title>
    <style>
        @page {
            margin: 1cm 1cm 2cm 1cm; /* Top, Right, Bottom, Left */
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            color: #333;
        }
        header {
            position: fixed;
            top: -20px;
            left: 0px;
            right: 0px;
            height: 80px;
            border-bottom: 2px solid #444;
            display: flex; /* dompdf has limited flex support, table preferred for layout */
        }
        footer {
            position: fixed; 
            bottom: -50px; 
            left: 0px; 
            right: 0px;
            height: 30px;
            font-size: 9px;
            text-align: right;
            border-top: 1px solid #ddd;
            padding-top: 5px;
        }
        .page-number:before {
            content: "Página " counter(page);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 5px;
            text-align: left;
        }
        th {
            background-color: #f4f4f4;
            font-weight: bold;
            color: #111;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bg-gray { background-color: #f9f9f9; }
        .bold { font-weight: bold; }
        .total-row td {
            border-top: 2px solid #333;
            font-weight: bold;
            background-color: #eee;
        }
        h1 { font-size: 16px; margin: 0; }
        h2 { font-size: 14px; margin: 2px 0; color: #555; }
        .meta { margin-top: 5px; font-size: 9px; }
    </style>
</head>
<body>
    <header>
        <table style="width: 100%; border: none; margin-top: 0;">
            <tr style="border: none;">
                <td style="border: none; width: 70%;">
                    <h1>{{ $empresa->nombre_empresa ?? 'MI EMPRESA S.A.' }}</h1>
                    <h2>{{ $empresa->direccion ?? 'Dirección de la Empresa' }}</h2>
                    <p class="meta">NIT: {{ $empresa->nit ?? 'C/F' }} | Tel: {{ $empresa->telefono ?? '' }}</p>
                </td>
                <td style="border: none; text-align: right; vertical-align: top;">
                    <h1>REPORTES</h1>
                    <p>Fecha: {{ now()->format('d/m/Y H:i') }}</p>
                    <p>Usuario: {{ auth()->user()->username ?? 'Sistema' }}</p>
                </td>
            </tr>
        </table>
    </header>

    <footer>
        <div class="page-number"></div>
        Sistema de Ventas e Inventario
    </footer>

    <main style="margin-top: 80px;">
        <h2 style="text-align: center; text-transform: uppercase;">@yield('report-name')</h2>
        @if(isset($filtros))
            <p style="text-align: center; font-size: 9px; color: #666; margin-bottom: 10px;">
                Filtros: {{ $filtros }}
            </p>
        @endif
        
        @yield('content')
    </main>
</body>
</html>
