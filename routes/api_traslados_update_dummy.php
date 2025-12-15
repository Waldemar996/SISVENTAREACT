<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Operaciones\OperTrasladoController;

// ... other routes ...

Route::post('/logistica/traslados/{id}/aprobar', [OperTrasladoController::class, 'aprobar']);
Route::post('/logistica/traslados/{id}/rechazar', [OperTrasladoController::class, 'rechazar']);
