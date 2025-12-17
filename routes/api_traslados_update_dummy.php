<?php

use App\Http\Controllers\Operaciones\OperTrasladoController;
use Illuminate\Support\Facades\Route;

// ... other routes ...

Route::post('/logistica/traslados/{id}/aprobar', [OperTrasladoController::class, 'aprobar']);
Route::post('/logistica/traslados/{id}/rechazar', [OperTrasladoController::class, 'rechazar']);
