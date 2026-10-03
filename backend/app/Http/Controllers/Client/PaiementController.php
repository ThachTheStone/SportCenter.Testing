<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Client;

class PaiementController extends Controller
{
    public function index()
    {
        $user   = auth('sanctum')->user();
        $client = Client::where('user_id', $user->id)
            ->with(['cotisations.echeances.paiement'])
            ->firstOrFail();

        $cotisation = $client->cotisations->first();
        if (!$cotisation) {
            return response()->json(['echeances' => [], 'total_paye' => 0, 'total_restant' => 0]);
        }

        $echeances = $cotisation->echeances->map(fn($e) => [
            'id'            => $e->id,
            'numero'        => $e->numero,
            'montant'       => $e->montant,
            'date_echeance' => $e->date_echeance,
            'statut'        => $e->statut,
            'est_en_retard' => $e->statut === 'en_attente' && now()->isAfter($e->date_echeance),
            'paiement'      => $e->paiement ? [
                'date'    => $e->paiement->date_paiement,
                'methode' => $e->paiement->methode,
                'montant' => $e->paiement->montant,
            ] : null,
        ]);

        return response()->json([
            'echeances'     => $echeances,
            'montant_annuel' => $cotisation->montant_annuel,
            'total_paye'    => $echeances->where('statut', 'paye')->sum('montant'),
            'total_restant' => $echeances->where('statut', 'en_attente')->sum('montant'),
        ]);
    }
}
