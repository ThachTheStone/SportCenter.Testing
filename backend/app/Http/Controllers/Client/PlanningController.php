<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\SeancePlanifiee;

class PlanningController extends Controller
{
  public function index()
  {
    $user   = auth('sanctum')->user();
    $client = Client::where('user_id', $user->id)->firstOrFail();

    $mois  = request('mois',  now()->month);
    $annee = request('annee', now()->year);

    $seances = SeancePlanifiee::whereHas(
      'planning',
      fn($q) =>
      $q->where('client_id', $client->id)
        ->where('mois', $mois)
        ->where('annee', $annee)
    )
      ->with('seanceRealisee')
      ->orderBy('date')
      ->get()
      ->map(fn($s) => [
        'date'         => $s->date,
        'heure_debut'  => $s->heure_debut,
        'heure_fin'    => $s->heure_fin,
        'lieu'         => $s->lieu,
        'type_exercice' => $s->type_exercice,
        'statut'       => $s->seanceRealisee
          ? ($s->seanceRealisee->present ? 'realisee' : 'manquee')
          : 'planifiee',
        'effort'       => $s->seanceRealisee?->effort_ressenti,
        'compte_rendu' => $s->seanceRealisee?->compte_rendu,
      ]);

    $realisees = $seances->where('statut', 'realisee')->count();
    $total     = $seances->count();

    return response()->json([
      'seances'          => $seances,
      'total_seances'    => $total,
      'seances_realisees' => $realisees,
      'taux_presence'    => $total > 0 ? round(($realisees / $total) * 100) : 0,
    ]);
  }
}
