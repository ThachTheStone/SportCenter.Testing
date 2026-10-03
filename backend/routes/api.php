<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;

// ── Routes publiques (sans auth) ──────────────────────────────
Route::post('/login',           [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password',  [AuthController::class, 'resetPassword']);

// ── Routes protégées (auth requise) ───────────────────────────
Route::middleware(['auth:sanctum', 'locked'])->group(function () {

  Route::get('/me',      [AuthController::class, 'me']);
  Route::post('/logout', [AuthController::class, 'logout']);

  // ── Admin uniquement ──────────────────────────────────────
  Route::middleware('role:admin')->prefix('admin')->group(function () {
    // Routes admin ici
    Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index']);
    Route::apiResource('/clients', \App\Http\Controllers\Admin\ClientController::class);
    Route::get('/coaches-list', function () {
      return response()->json(\App\Models\Coach::with('user')->get()->map(fn($c) => [
        'id'         => $c->id,
        'nom_complet' => $c->prenom . ' ' . $c->nom,
      ]));
    });
    Route::apiResource('/coaches', \App\Http\Controllers\Admin\CoachController::class)->except(['show']);
    Route::get('/paiements',       [\App\Http\Controllers\Admin\PaiementController::class, 'index']);
    Route::post('/paiements',      [\App\Http\Controllers\Admin\PaiementController::class, 'store']);
    Route::get('/paiements/stats', [\App\Http\Controllers\Admin\PaiementController::class, 'stats']);
    Route::apiResource('/ressources', \App\Http\Controllers\Admin\RessourceController::class)->except(['show']);
    Route::get('/plannings', [\App\Http\Controllers\Admin\PlanningController::class, 'index']);
    Route::get('/alertes', [\App\Http\Controllers\Admin\AlerteController::class, 'index']);
    Route::patch('/alertes/{id}/lu', [\App\Http\Controllers\Admin\AlerteController::class, 'marquerLu']);
    Route::patch('/alertes/tout-lu', [\App\Http\Controllers\Admin\AlerteController::class, 'marquerToutLu']);
    Route::get('/paiements/{id}/recu', [\App\Http\Controllers\Admin\PdfController::class, 'recuPaiement']);
  });

  // ── Coach uniquement ──────────────────────────────────────
  Route::middleware('role:coach,admin')->prefix('coach')->group(function () {
    // Routes coach ici
    Route::get('/dashboard', [\App\Http\Controllers\Coach\DashboardController::class, 'index']);
    Route::get('/clients',   [\App\Http\Controllers\Coach\ClientController::class, 'index']);
    Route::get('/clients/{client}/bilans',           [\App\Http\Controllers\Coach\ClientController::class, 'bilans']);
    Route::post('/clients/{client}/bilan-physique',  [\App\Http\Controllers\Coach\ClientController::class, 'storeBilanPhysique']);
    Route::post('/clients/{client}/bilan-sanitaire', [\App\Http\Controllers\Coach\ClientController::class, 'storeBilanSanitaire']);
    Route::get('/planning',                          [\App\Http\Controllers\Coach\PlanningController::class, 'index']);
    Route::post('/planning/seances',                 [\App\Http\Controllers\Coach\PlanningController::class, 'storeSeance']);
    Route::post('/seances/{seance}/realiser',        [\App\Http\Controllers\Coach\PlanningController::class, 'marquerRealisee']);
  });

  // ── Client uniquement ─────────────────────────────────────
  Route::middleware('role:client,admin')->prefix('client')->group(function () {
    // Routes client ici
    Route::get('/dashboard', [\App\Http\Controllers\Client\DashboardController::class, 'index']);
    Route::get('/paiements', [\App\Http\Controllers\Client\PaiementController::class, 'index']);
    Route::get('/planning', [\App\Http\Controllers\Client\PlanningController::class, 'index']);
    Route::get('/bilans', [\App\Http\Controllers\Client\BilanController::class, 'index']);
  });
});
