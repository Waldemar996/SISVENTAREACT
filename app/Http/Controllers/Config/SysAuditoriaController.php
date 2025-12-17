<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;

class SysAuditoriaController extends Controller
{
    public function index()
    {
        // Logs del sistema
        $logs = \App\Models\Config\SysAuditoriaLog::with('usuario')
            ->orderBy('id', 'desc')
            ->paginate(50);

        return response()->json($logs);
    }
}
