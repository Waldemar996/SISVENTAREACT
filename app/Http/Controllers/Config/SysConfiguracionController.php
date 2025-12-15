<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SysConfiguracionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Obtener la primera configuración o crear una default
        $config = \App\Models\Config\SysConfiguracion::first();
        if (!$config) {
            $config = \App\Models\Config\SysConfiguracion::create([
                'nombre_empresa' => 'Mi Empresa',
                'nit_empresa' => 'CF',
                'direccion_fiscal' => 'Ciudad',
                'moneda_simbolo' => 'Q',
                'ruta_logo' => null,
                'impuesto_general_iva' => 12.00
            ]);
        }
        return response()->json($config);
    }

    public function update(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('Config Update Request:', $request->all());

        $config = \App\Models\Config\SysConfiguracion::first();

        if (!$config) {
            \Illuminate\Support\Facades\Log::info('Creating NEW Config instance');
            $config = new \App\Models\Config\SysConfiguracion();
            // Defaults for fallback
            $config->nombre_empresa = 'Mi Empresa';
            $config->nit_empresa = 'CF';
            $config->moneda_simbolo = 'Q';
            $config->impuesto_general_iva = 12.00;
        } else {
            \Illuminate\Support\Facades\Log::info('Updating EXISTING Config instance', ['id' => $config->id]);
        }

        try {
            $validated = $request->validate([
                'nombre_empresa' => 'required|string|max:100',
                'nit_empresa' => 'required|string|max:20',
                'direccion_fiscal' => 'nullable|string|max:200',
                'moneda_simbolo' => 'required|string|max:5', // GTQ, USD
                'email_contacto' => 'nullable|email|max:100',
                'website' => 'nullable|string|max:200',
                'logo' => 'nullable|image|max:2048', // 2MB max
                'color_primary' => 'nullable|string|max:7',
                'color_secondary' => 'nullable|string|max:7',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('Validation Failed:', $e->errors());
            throw $e;
        }

        \Illuminate\Support\Facades\Log::info('Validation passed', $validated);

        // Manejo de Logo
        if ($request->hasFile('logo')) {
            // Eliminar anterior si existe
            if ($config->ruta_logo && \Illuminate\Support\Facades\Storage::exists('public/'.$config->ruta_logo)) {
                \Illuminate\Support\Facades\Storage::delete('public/'.$config->ruta_logo);
            }
            
            $path = $request->file('logo')->store('logos', 'public');
            $config->ruta_logo = $path;
        }

        $config->nombre_empresa = $validated['nombre_empresa'];
        $config->nit_empresa = $validated['nit_empresa'];
        $config->direccion_fiscal = $request->direccion_fiscal;
        $config->moneda_simbolo = $validated['moneda_simbolo'];
        $config->email_contacto = $request->email_contacto;
        $config->website = $request->website;
        $config->color_primary = $request->color_primary ?? '#4F46E5';
        $config->color_secondary = $request->color_secondary ?? '#1F2937';
        
        $config->save();

        return redirect()->back()->with('success', 'Configuración actualizada');
    }
}
