<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SysEmpresaController extends Controller
{
    /**
     * Display company configuration
     */
    public function index()
    {
        try {
            $empresa = DB::table('sys_configuracion')->first();

            return response()->json($empresa);
        } catch (\Exception $e) {
            Log::error('Error en Empresa index: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar configuración de empresa'], 500);
        }
    }

    /**
     * Store or update company configuration
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre_empresa' => 'required|string|max:200',
            'nit' => 'required|string|max:20',
            'direccion' => 'required|string|max:300',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'sitio_web' => 'nullable|url|max:200',
            'regimen_tributario' => 'nullable|string|max:100',
            'moneda_base' => 'required|string|max:3',
            'logo' => 'nullable|image|max:2048',
        ]);

        DB::beginTransaction();
        try {
            $data = [
                'nombre_empresa' => $request->nombre_empresa,
                'nit' => $request->nit,
                'direccion' => $request->direccion,
                'telefono' => $request->telefono,
                'email' => $request->email,
                'sitio_web' => $request->sitio_web,
                'regimen_tributario' => $request->regimen_tributario,
                'moneda_base' => $request->moneda_base,
                'updated_at' => now(),
            ];

            // Manejar logo si se sube
            if ($request->hasFile('logo')) {
                $logoPath = $request->file('logo')->store('logos', 'public');
                $data['logo'] = $logoPath;
            }

            // Verificar si ya existe configuración
            $existe = DB::table('sys_configuracion')->exists();

            if ($existe) {
                DB::table('sys_configuracion')->update($data);
                $message = 'Configuración actualizada correctamente';
            } else {
                $data['created_at'] = now();
                DB::table('sys_configuracion')->insert($data);
                $message = 'Configuración creada correctamente';
            }

            DB::commit();

            return response()->json(['message' => $message]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al guardar configuración de empresa: '.$e->getMessage());

            return response()->json(['error' => 'Error al guardar configuración'], 500);
        }
    }

    /**
     * Update company configuration
     */
    public function update(Request $request, $id)
    {
        return $this->store($request);
    }
}
