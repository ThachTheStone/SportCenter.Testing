<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Planning;
use App\Models\Coach;
use App\Models\Client;

class PlanningController extends Controller
{
    public function index()
    {
        $mois  = request('mois',  now()->month);
        $annee = request('annee', now()->year);
        $coach_id = request('coach_id');

        $query = Planning::with(['client.user', 'coach.user', 'seances.seanceRealisee'])
            ->where('mois', $mois)
            ->where('annee', $annee);

        if ($coach_id) {
            $query->where('coach_id', $coach_id);
        }

        $plannings = $query->get()->map(fn($p) => [
            'id'              => $p->id,
            'client'          => $p->client->prenom . ' ' . $p->client->nom,
            'client_id'       => $p->client_id,
            'coach'           => $p->coach->prenom . ' ' . $p->coach->nom,
            'coach_id'        => $p->coach_id,
            'total_seances'   => $p->seances->count(),
            'realisees'       => $p->seances->filter(fn($s) => $s->seanceRealisee?->present)->count(),
            'taux'            => $p->seances->count() > 0
                ? round($p->seances->filter(fn($s) => $s->seanceRealisee?->present)->count() / $p->seances->count() * 100)
                : 0,
            'statut'          => $p->statut,
        ]);

        $coaches = Coach::with('user')->get()->map(fn($c) => [
            'id'  => $c->id,
            'nom' => $c->prenom . ' ' . $c->nom,
        ]);

        $stats = [
            'total_plannings'  => $plannings->count(),
            'total_seances'    => $plannings->sum('total_seances'),
            'total_realisees'  => $plannings->sum('realisees'),
            'taux_global'      => $plannings->sum('total_seances') > 0
                ? round($plannings->sum('realisees') / $plannings->sum('total_seances') * 100)
                : 0,
        ];

        return response()->json([
            'plannings' => $plannings,
            'coaches'   => $coaches,
            'stats'     => $stats,
        ]);
    }
}
