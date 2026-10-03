<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Client;

class BilanController extends Controller
{
  public function index()
  {
    $user   = auth('sanctum')->user();
    $client = Client::where('user_id', $user->id)
      ->with(['bilansPhysiques' => fn($q) => $q->orderBy('date', 'desc')])
      ->firstOrFail();

    $bilans = $client->bilansPhysiques->map(fn($b) => [
      'date'               => $b->date,
      'poids_kg'           => $b->poids_kg,
      'taille_cm'          => $b->taille_cm,
      'imc'                => $b->imc,
      'imc_statut'         => $b->imc_statut,
      'masse_grasse_pct'   => $b->masse_grasse_pct,
      'masse_musculaire_pct' => $b->masse_musculaire_pct,
      'notes'              => $b->notes,
    ]);

    return response()->json([
      'bilans_physiques' => $bilans,
      'dernier_bilan'    => $bilans->first(),
    ]);
  }
}
