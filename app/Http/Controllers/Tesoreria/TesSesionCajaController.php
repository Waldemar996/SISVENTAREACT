<?php

namespace App\Http\Controllers\Tesoreria;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TesSesionCajaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\Tesoreria\TesSesionCaja::with(['caja', 'usuario']);

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_apertura', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_apertura', '<=', $request->fecha_fin);
        }
        if ($request->filled('caja_id')) {
            $query->where('caja_id', $request->caja_id);
        }
        if ($request->filled('usuario_id')) {
            $query->where('usuario_id', $request->usuario_id);
        }

        $sesiones = $query->orderBy('id', 'desc')->paginate(20);
        return response()->json($sesiones);
    }

    public function show($id)
    {
        $sesion = \App\Models\Tesoreria\TesSesionCaja::with(['caja', 'usuario', 'ventas.detalles'])
                    ->findOrFail($id);
        
        // Calcular desgloses al vuelo para el reporte
        $ventas = $sesion->ventas()->where('estado', 'COMPLETADO')->get();
        $sesion->total_efectivo = $ventas->where('forma_pago', 'EFECTIVO')->sum('total_venta');
        $sesion->total_tarjeta = $ventas->where('forma_pago', 'TARJETA')->sum('total_venta');
        $sesion->total_transferencia = $ventas->where('forma_pago', 'TRANSFERENCIA')->sum('total_venta');
        $sesion->total_otros = $ventas->whereNotIn('forma_pago', ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'])->sum('total_venta');

        return response()->json($sesion);
    }

    /**
     * Obtener el estado de la sesión del usuario actual.
     * Esto permite al frontend saber si debe mostrar "Abrir Caja" o "Ir a Ventas/Cerrar Caja".
     */
    public function getEstado()
    {
        // Buscar si el usuario tiene una sesión ABIERTA
        // Nota: Asumimos que SysUsuario está vinculado al User de Auth. 
        // Si Auth user->id == SysUsuario->id (o mapeo), usaremos auth()->id() por ahora asumiendo simpleza.
        // Si hay una tabla intermedia, ajustar. En DemoDataSeeder, User se crea separado de SysUsuario?
        // Revisar AuthController o SysUsuario.
        // Asumiendo que el User de Laravel ESTÁ en sys_usuarios o tiene un vinculo.
        // En CoreDataSeeder se crea SysUsuario manual.
        // Vamos a asumir que el ID del usuario autenticado corresponde al SysUsuario id por ahora, o buscarlo.
        
        $usuarioId = auth()->id(); 
        
        $sesion = \App\Models\Tesoreria\TesSesionCaja::where('usuario_id', $usuarioId)
                    ->where('estado', 'abierta')
                    ->with('caja')
                    ->first();

        if (!$sesion) {
            return response()->json([
                'tiene_sesion' => false,
                'mensaje' => 'No hay sesión activa'
            ]);
        }

        return response()->json([
            'tiene_sesion' => true,
            'sesion' => $sesion
        ]);
    }

    /**
     * Aperturar una nueva sesión (Turno).
     */
    public function aperturar(Request $request)
    {
        $request->validate([
            'caja_id' => 'required|exists:tes_cajas,id',
            'monto_inicial' => 'required|numeric|min:0'
        ]);

        $usuarioId = auth()->id();

        // 1. Validar que el usuario NO tenga ya una sesión abierta
        $sesionActiva = \App\Models\Tesoreria\TesSesionCaja::where('usuario_id', $usuarioId)
                            ->where('estado', 'abierta')
                            ->first();
        if ($sesionActiva) {
            return response()->json(['message' => 'Ya tienes una sesión abierta. Debes cerrarla antes de abrir otra.'], 400);
        }

        // 2. Validar que la CAJA no esté ocupada por OTRO usuario
        $caja = \App\Models\Tesoreria\TesCaja::findOrFail($request->caja_id);
        if ($caja->estado === 'ocupada') {
             return response()->json(['message' => 'Esta caja ya está siendo utilizada por otro usuario.'], 409);
        }

        // 3. Crear la sesión
        $nuevaSesion = \App\Models\Tesoreria\TesSesionCaja::create([
            'caja_id' => $caja->id,
            'usuario_id' => $usuarioId,
            'fecha_apertura' => now(),
            'monto_inicial' => $request->monto_inicial,
            'estado' => 'abierta'
        ]);

        // 4. Actualizar estado de la caja
        $caja->update([
            'estado' => 'ocupada',
            'usuario_asignado_id' => $usuarioId
        ]);

        return response()->json(['message' => 'Sesión de caja aperturada correctamente', 'data' => $nuevaSesion], 201);
    }

    /**
     * Cerrar la sesión actual (Corte/Arqueo).
     */
    public function cerrar(Request $request)
    {
        $request->validate([
            'monto_final_real' => 'nullable|numeric|min:0' 
        ]);

        $usuarioId = auth()->id();

        // 1. Buscar sesión activa
        $sesion = \App\Models\Tesoreria\TesSesionCaja::where('usuario_id', $usuarioId)
                    ->where('estado', 'abierta')
                    ->first();

        if (!$sesion) {
            return response()->json(['message' => 'No tienes ninguna sesión abierta para cerrar.'], 404);
        }

        // 2. Calcular Totales por Método de Pago
        $ventas = \App\Models\Operaciones\OperVenta::where('sesion_caja_id', $sesion->id)
                        ->where('estado', 'COMPLETADO')
                        ->get();

        $totalEfectivo = $ventas->where('forma_pago', 'EFECTIVO')->sum('total_venta');
        $totalTarjeta = $ventas->where('forma_pago', 'TARJETA')->sum('total_venta');
        $totalTransferencia = $ventas->where('forma_pago', 'TRANSFERENCIA')->sum('total_venta');
        $totalOtros = $ventas->whereNotIn('forma_pago', ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'])->sum('total_venta');
        
        // Sumar otros valores si existen (Ingresos manuales en efectivo)
        // Por ahora solo Ventas Efectivo + Monto Inicial
        
        $montoSistema = $sesion->monto_inicial + $totalEfectivo; 
        // Nota: Solo el EFECTIVO debe estar en la caja física.
        // Tarjetas y Transferencias van al Banco, no a la caja chica.
        
        // Si no se envía monto real, asumimos que es igual al sistema (Cierre Automático)
        $montoReal = $request->has('monto_final_real') ? $request->monto_final_real : $montoSistema;
        $diferencia = $montoReal - $montoSistema;

        // 3. Cerrar Sesión
        $sesion->update([
            'fecha_cierre' => now(),
            'monto_final_sistema' => $montoSistema, // Esperado en Efectivo
            'monto_final_real' => $montoReal,
            'diferencia' => $diferencia,
            'estado' => 'cerrada'
        ]);

        // 4. Liberar Caja
        $caja = \App\Models\Tesoreria\TesCaja::find($sesion->caja_id);
        if($caja){
            $caja->update([
                'estado' => 'disponible',
                'usuario_asignado_id' => null
            ]);
        }

        return response()->json([
            'message' => 'Sesión cerrada correctamente',
            'resumen' => [
                'inicial' => $sesion->monto_inicial,
                'ventas_efectivo' => $totalEfectivo,
                'ventas_digital' => $totalTarjeta + $totalTransferencia + $totalOtros,
                'esperado' => $montoSistema,
                'real' => $montoReal,
                'diferencia' => $diferencia
            ]
        ]);
    }

    /**
     * Generar Ticket de Cierre
     */
    public function ticket($id)
    {
        $sesion = \App\Models\Tesoreria\TesSesionCaja::with(['caja', 'usuario', 'ventas.detalles'])
                    ->findOrFail($id);
        
        $empresa = \App\Models\Config\SysConfiguracion::first();

        // Calcular Totales (Misma lógica que show/cerrar)
        $ventas = $sesion->ventas()->where('estado', 'COMPLETADO')->get();
        $sesion->total_efectivo = $ventas->where('forma_pago', 'EFECTIVO')->sum('total_venta');
        $sesion->total_tarjeta = $ventas->where('forma_pago', 'TARJETA')->sum('total_venta');
        $sesion->total_transferencia = $ventas->where('forma_pago', 'TRANSFERENCIA')->sum('total_venta');
        $sesion->total_otros = $ventas->whereNotIn('forma_pago', ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'])->sum('total_venta');

        return view('tesoreria.ticket', compact('sesion', 'empresa'));
    }
}
