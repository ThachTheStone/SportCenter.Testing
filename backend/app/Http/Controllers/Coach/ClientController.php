<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use App\Models\Coach;
use App\Models\Client;
use App\Models\BilanPhysique;
use App\Models\BilanSanitaire;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    private function getCoach()
    {
        return Coach::where('user_id', auth('sanctum')->id())->firstOrFail();
    }

    public function index()
    {
        $coach = $this->getCoach();
        $clients = Client::where('coach_id', $coach->id)
            ->with(['user', 'cotisations.echeances', 'bilansPhysiques' => fn($q) => $q->latest()->limit(1)])
            ->get()
            ->map(function ($c) {
                $dernierBilan = $c->bilansPhysiques->first();
                $cotisation   = $c->cotisations->first();
                return [
                    'id'             => $c->id,
                    'nom'            => $c->prenom . ' ' . $c->nom,
                    'prenom'         => $c->prenom,
                    'nom_famille'    => $c->nom,
                    'email'          => $c->user?->email,
                    'telephone'      => $c->telephone,
                    'date_naissance' => $c->date_naissance,
                    'statut'         => $c->statut,
                    'date_inscription' => $c->date_inscription,
                    'dernier_imc'    => $dernierBilan?->imc,
                    'imc_statut'     => $dernierBilan?->imc_statut,
                    'cotisation_statut' => $cotisation?->statut,
                ];
            });

        return response()->json($clients);
    }

    public function storeBilanPhysique(Request $request, Client $client)
    {
        $coach = $this->getCoach();
        if ($client->coach_id !== $coach->id) abort(403);

        $request->validate([
            'taille_cm'       => 'required|numeric|min:50|max:250',
            'poids_kg'        => 'required|numeric|min:20|max:300',
            'tour_taille'     => 'nullable|numeric',
            'tour_hanches'    => 'nullable|numeric',
            'tour_poitrine'   => 'nullable|numeric',
            'masse_grasse_pct' => 'nullable|numeric|min:0|max:100',
            'notes'           => 'nullable|string',
        ]);

        $bilan = BilanPhysique::create([
            'client_id'        => $client->id,
            'coach_id'         => $coach->id,
            'date'             => now()->toDateString(),
            'taille_cm'        => $request->taille_cm,
            'poids_kg'         => $request->poids_kg,
            'tour_taille'      => $request->tour_taille,
            'tour_hanches'     => $request->tour_hanches,
            'tour_poitrine'    => $request->tour_poitrine,
            'masse_grasse_pct' => $request->masse_grasse_pct,
        ]);

        return response()->json(['message' => 'Physical assessment saved.', 'bilan' => $bilan], 201);
    }

    public function storeBilanSanitaire(Request $request, Client $client)
    {
        $coach = $this->getCoach();
        if ($client->coach_id !== $coach->id) abort(403);

        $request->validate([
            'tension_arterielle'  => 'nullable|string',
            'frequence_cardiaque' => 'nullable|integer',
            'allergies'           => 'nullable|string',
            'pathologies'         => 'nullable|string',
            'medicaments'         => 'nullable|string',
        ]);

        $bilan = BilanSanitaire::create([
            'client_id'           => $client->id,
            'coach_id'            => $coach->id,
            'date'                => now()->toDateString(),
            'tension_arterielle'  => $request->tension_arterielle,
            'frequence_cardiaque' => $request->frequence_cardiaque,
            'allergies'           => $request->allergies,
            'pathologies'         => $request->pathologies,
            'medicaments'         => $request->medicaments,
        ]);

        return response()->json(['message' => 'Health assessment saved.', 'bilan' => $bilan], 201);
    }

    public function bilans(Client $client)
    {
        $coach = $this->getCoach();
        if ($client->coach_id !== $coach->id) abort(403);

        return response()->json([
            'client'           => $client->prenom . ' ' . $client->nom,
            'bilans_physiques' => $client->bilansPhysiques()->orderByDesc('date')->get(),
            'bilans_sanitaires' => $client->bilansSanitaires()->orderByDesc('date')->get(),
        ]);
    }
}
