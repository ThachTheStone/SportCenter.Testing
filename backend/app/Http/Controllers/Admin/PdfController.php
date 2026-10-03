<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use Barryvdh\DomPDF\Facade\Pdf;

class PdfController extends Controller
{
    public function recuPaiement($id)
    {
        $paiement = Paiement::with([
            'echeance.cotisation.client.user',
            'echeance.cotisation.client.coach',
        ])->findOrFail($id);

        $client   = $paiement->echeance->cotisation->client;
        $coach    = $client->coach;
        $cotisation = $paiement->echeance->cotisation;

        $data = [
            'paiement'   => $paiement,
            'client'     => $client,
            'coach'      => $coach,
            'cotisation' => $cotisation,
            'date'       => now()->format('d/m/Y'),
            'numero'     => 'REC-' . str_pad($paiement->id, 5, '0', STR_PAD_LEFT),
        ];

        $pdf = Pdf::loadView('pdf.recu_paiement', $data)
            ->setPaper('a4', 'portrait');

        return $pdf->download('receipt-' . $data['numero'] . '.pdf');
    }
}
